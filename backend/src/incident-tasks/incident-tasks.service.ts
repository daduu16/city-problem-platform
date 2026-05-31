import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HistoryActionType,
  IncidentAssigneeTaskScheduleType,
  IncidentAssigneeTaskStatus,
  Prisma,
} from '@prisma/client';
import { AccessControlService } from '../access-control/access-control.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { AssigneeAvailabilityService } from '../assignee-availability/assignee-availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentTaskDto } from './dto/create-incident-task.dto';
import { UpdateIncidentTaskDto } from './dto/update-incident-task.dto';

const ACTIVE_TASK_STATUSES: IncidentAssigneeTaskStatus[] = [
  IncidentAssigneeTaskStatus.SCHEDULED,
  IncidentAssigneeTaskStatus.IN_PROGRESS,
];

const taskInclude = {
  assignee: {
    include: {
      organization: { select: { id: true, name: true, type: true } },
    },
  },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.IncidentAssigneeTaskInclude;

@Injectable()
export class IncidentTasksService {
  constructor(
    private prisma: PrismaService,
    private accessControl: AccessControlService,
    private availabilityService: AssigneeAvailabilityService,
  ) {}

  private parseRange(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (end <= start) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    return { start, end };
  }

  private rangesOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  private async assertIncidentAccess(incidentId: string, user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_incidents');

    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');

    const canView = await this.accessControl.canViewIncident(scope, incident);
    if (!canView) throw new ForbiddenException();

    return { incident, scope };
  }

  private async assertAssigneeForCategory(
    assigneeId: string,
    categoryId: string,
  ) {
    const assignee = await this.prisma.categoryAssignee.findUnique({
      where: { id: assigneeId },
      include: {
        organization: { select: { id: true, name: true, type: true } },
        categories: { include: { category: true } },
      },
    });
    if (!assignee || !assignee.isActive) {
      throw new BadRequestException('Assignee not found or inactive');
    }

    const linked = assignee.categories.some(
      (c) => c.categoryId === categoryId,
    );
    if (!linked) {
      throw new BadRequestException(
        'Assignee is not responsible for this incident category',
      );
    }

    return assignee;
  }

  private async assertWithinAvailability(
    assigneeId: string,
    start: Date,
    end: Date,
  ) {
    const slots = await this.availabilityService.loadSlotRows(assigneeId);
    const check = this.availabilityService.isIntervalWithinAvailability(
      slots,
      start,
      end,
    );
    if (!check.ok) {
      throw new BadRequestException({
        message: 'Assignee is not available during this time',
        reason: check.reason ?? 'outside_hours',
      });
    }
  }

  private async findFixedOverlaps(
    assigneeId: string,
    start: Date,
    end: Date,
    excludeTaskId?: string,
  ) {
    return this.prisma.incidentAssigneeTask.findMany({
      where: {
        assigneeId,
        scheduleType: IncidentAssigneeTaskScheduleType.FIXED,
        status: { in: ACTIVE_TASK_STATUSES },
        ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}),
        startsAt: { lt: end },
        endsAt: { gt: start },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        scheduleType: true,
      },
    });
  }

  private async assertNoFixedOverlap(
    assigneeId: string,
    start: Date,
    end: Date,
    excludeTaskId?: string,
  ) {
    const conflicts = await this.findFixedOverlaps(
      assigneeId,
      start,
      end,
      excludeTaskId,
    );

    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Assignee is busy during this time',
        conflicts,
      });
    }
  }

  private buildAssigneeSearchWhere(
    search?: string,
  ): Prisma.CategoryAssigneeWhereInput {
    if (!search?.trim()) return {};
    const q = search.trim();
    return {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q, mode: 'insensitive' } },
        { organization: { name: { contains: q, mode: 'insensitive' } } },
      ],
    };
  }

  async listCategoryAssignees(
    categoryId: string,
    search: string | undefined,
    user: JwtPayload,
  ) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'assign_task');

    return this.prisma.categoryAssignee.findMany({
      where: {
        isActive: true,
        categories: { some: { categoryId } },
        ...this.buildAssigneeSearchWhere(search),
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAvailability(
    categoryId: string,
    startsAt: string,
    endsAt: string,
    search: string | undefined,
    user: JwtPayload,
  ) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_incidents');
    this.accessControl.requirePermission(scope, 'assign_task');

    const { start, end } = this.parseRange(startsAt, endsAt);

    const assignees = await this.prisma.categoryAssignee.findMany({
      where: {
        isActive: true,
        categories: { some: { categoryId } },
        ...this.buildAssigneeSearchWhere(search),
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
        categories: { include: { category: { select: { id: true, key: true, name: true } } } },
        tasks: {
          where: {
            status: { in: ACTIVE_TASK_STATUSES },
            startsAt: { lt: end },
            endsAt: { gt: start },
          },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            title: true,
            scheduleType: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const assigneeIds = assignees.map((a) => a.id);
    const allSlots = assigneeIds.length
      ? await this.prisma.assigneeAvailabilitySlot.findMany({
          where: { assigneeId: { in: assigneeIds } },
        })
      : [];

    const slotsByAssignee = new Map<
      string,
      Awaited<ReturnType<AssigneeAvailabilityService['loadSlotRows']>>
    >();
    for (const slot of allSlots) {
      const list = slotsByAssignee.get(slot.assigneeId) ?? [];
      list.push({
        kind: slot.kind,
        dayOfWeek: slot.dayOfWeek,
        date: slot.date,
        slotType: slot.slotType,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      });
      slotsByAssignee.set(slot.assigneeId, list);
    }

    const available: typeof assignees = [];
    const busy: Array<{
      id: string;
      name: string;
      kind: (typeof assignees)[0]['kind'];
      organization: (typeof assignees)[0]['organization'];
      conflicts: (typeof assignees)[0]['tasks'];
    }> = [];
    const outsideAvailability: Array<{
      id: string;
      name: string;
      kind: (typeof assignees)[0]['kind'];
      organization: (typeof assignees)[0]['organization'];
      reason: string;
    }> = [];

    type CandidateStatus = 'available' | 'busy' | 'outside_hours' | 'unavailable_block';
    const candidates: Array<{
      id: string;
      name: string;
      kind: (typeof assignees)[0]['kind'];
      organization: (typeof assignees)[0]['organization'];
      availabilityStatus: CandidateStatus;
      reason?: string;
      conflicts?: (typeof assignees)[0]['tasks'];
    }> = [];

    const statusOrder: Record<CandidateStatus, number> = {
      available: 0,
      busy: 1,
      unavailable_block: 2,
      outside_hours: 3,
    };

    for (const a of assignees) {
      const { tasks, ...rest } = a;
      const slots = slotsByAssignee.get(a.id) ?? [];
      const withinHours = this.availabilityService.isIntervalWithinAvailability(
        slots,
        start,
        end,
      );

      let availabilityStatus: CandidateStatus = 'available';
      let reason: string | undefined;

      const fixedConflicts = a.tasks.filter(
        (t) => t.scheduleType === IncidentAssigneeTaskScheduleType.FIXED,
      );

      if (fixedConflicts.length > 0) {
        availabilityStatus = 'busy';
        busy.push({
          id: a.id,
          name: a.name,
          kind: a.kind,
          organization: a.organization,
          conflicts: fixedConflicts,
        });
      } else if (!withinHours.ok) {
        availabilityStatus =
          withinHours.reason === 'unavailable_block'
            ? 'unavailable_block'
            : 'outside_hours';
        reason = withinHours.reason ?? 'outside_hours';
        outsideAvailability.push({
          id: a.id,
          name: a.name,
          kind: a.kind,
          organization: a.organization,
          reason,
        });
      } else {
        available.push(rest as (typeof assignees)[0]);
      }

      candidates.push({
        id: a.id,
        name: a.name,
        kind: a.kind,
        organization: a.organization,
        availabilityStatus,
        reason,
        conflicts: fixedConflicts.length > 0 ? fixedConflicts : undefined,
      });
    }

    candidates.sort((x, y) => {
      const byStatus = statusOrder[x.availabilityStatus] - statusOrder[y.availabilityStatus];
      if (byStatus !== 0) return byStatus;
      return x.name.localeCompare(y.name, 'az');
    });

    return {
      available,
      busy,
      outsideAvailability,
      candidates,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    };
  }

  async findFreeSlots(
    assigneeId: string,
    from: string,
    to: string,
    durationMinutes: number,
    categoryId: string | undefined,
    user: JwtPayload,
  ) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_incidents');
    this.accessControl.requirePermission(scope, 'assign_task');

    const windowStart = new Date(from);
    const windowEnd = new Date(to);
    if (Number.isNaN(windowStart.getTime()) || Number.isNaN(windowEnd.getTime())) {
      throw new BadRequestException('Invalid window');
    }
    if (windowEnd <= windowStart) {
      throw new BadRequestException('to must be after from');
    }

    const assignee = await this.prisma.categoryAssignee.findUnique({
      where: { id: assigneeId },
      include: { organization: { select: { id: true, name: true, type: true } } },
    });
    if (!assignee || !assignee.isActive) {
      throw new NotFoundException('Assignee not found');
    }

    if (categoryId) {
      await this.assertAssigneeForCategory(assigneeId, categoryId);
    }

    const gaps = await this.availabilityService.findFreeIntervals(
      assigneeId,
      windowStart,
      windowEnd,
      durationMinutes,
    );

    const slots = this.toBookableSlots(gaps, durationMinutes);

    return {
      assignee: {
        id: assignee.id,
        name: assignee.name,
        kind: assignee.kind,
        organization: assignee.organization,
      },
      durationMinutes,
      slots,
    };
  }

  /** Step starts every 15m; each slot is exactly durationMinutes long. */
  private toBookableSlots(
    gaps: Array<{ startsAt: string; endsAt: string }>,
    durationMinutes: number,
    stepMinutes = 15,
    maxSlots = 48,
  ): Array<{ startsAt: string; endsAt: string }> {
    const durationMs = durationMinutes * 60 * 1000;
    const stepMs = stepMinutes * 60 * 1000;
    const result: Array<{ startsAt: string; endsAt: string }> = [];

    for (const gap of gaps) {
      let cursor = new Date(gap.startsAt).getTime();
      const gapEnd = new Date(gap.endsAt).getTime();
      while (cursor + durationMs <= gapEnd && result.length < maxSlots) {
        result.push({
          startsAt: new Date(cursor).toISOString(),
          endsAt: new Date(cursor + durationMs).toISOString(),
        });
        cursor += stepMs;
      }
    }

    return result;
  }

  private async assertSchedulingAllowed(
    assigneeId: string,
    start: Date,
    end: Date,
    scheduleType: IncidentAssigneeTaskScheduleType,
    allowOverlap: boolean,
    excludeTaskId?: string,
  ) {
    if (scheduleType === IncidentAssigneeTaskScheduleType.WINDOW) {
      return;
    }
    if (allowOverlap) {
      return;
    }
    await this.assertWithinAvailability(assigneeId, start, end);
    await this.assertNoFixedOverlap(assigneeId, start, end, excludeTaskId);
  }

  async getAssigneeDaySchedule(
    assigneeId: string,
    dateKey: string,
    draftStartsAt: string | undefined,
    draftEndsAt: string | undefined,
    user: JwtPayload,
  ) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'view_incidents');
    this.accessControl.requirePermission(scope, 'assign_task');

    const assignee = await this.prisma.categoryAssignee.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, isActive: true },
    });
    if (!assignee || !assignee.isActive) {
      throw new NotFoundException('Assignee not found');
    }

    const calendar = await this.availabilityService.getCalendar(
      assigneeId,
      dateKey,
      dateKey,
    );
    const day = calendar.days[0];
    if (!day) {
      throw new BadRequestException('Invalid date');
    }

    let draft:
      | {
          fixedConflicts: Awaited<ReturnType<typeof this.findFixedOverlaps>>;
          outsideHours: boolean;
          reason?: string;
        }
      | undefined;

    if (draftStartsAt && draftEndsAt) {
      const { start, end } = this.parseRange(draftStartsAt, draftEndsAt);
      const slots = await this.availabilityService.loadSlotRows(assigneeId);
      const within = this.availabilityService.isIntervalWithinAvailability(
        slots,
        start,
        end,
      );
      const fixedConflicts = await this.findFixedOverlaps(assigneeId, start, end);
      draft = {
        fixedConflicts,
        outsideHours: !within.ok,
        reason: within.reason,
      };
    }

    return {
      assignee: { id: assignee.id, name: assignee.name },
      date: dateKey,
      day,
      draft,
    };
  }

  async createForIncident(
    incidentId: string,
    dto: CreateIncidentTaskDto,
    user: JwtPayload,
  ) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'assign_task');

    const { incident } = await this.assertIncidentAccess(incidentId, user);
    const categoryId = incident.subcategoryId ?? incident.categoryId;
    await this.assertAssigneeForCategory(dto.assigneeId, categoryId);

    const { start, end } = this.parseRange(dto.startsAt, dto.endsAt);
    const scheduleType =
      dto.scheduleType ?? IncidentAssigneeTaskScheduleType.FIXED;
    const allowOverlap = dto.allowOverlap === true;

    await this.assertSchedulingAllowed(
      dto.assigneeId,
      start,
      end,
      scheduleType,
      allowOverlap,
    );

    const description = this.buildDescription(
      dto.description,
      scheduleType,
      dto.estimatedMinutes,
    );

    try {
      const task = await this.prisma.incidentAssigneeTask.create({
        data: {
          incidentId,
          assigneeId: dto.assigneeId,
          title: dto.title.trim(),
          description,
          startsAt: start,
          endsAt: end,
          scheduleType,
          estimatedMinutes:
            scheduleType === IncidentAssigneeTaskScheduleType.WINDOW
              ? dto.estimatedMinutes ?? null
              : null,
          createdById: user.sub,
        },
        include: taskInclude,
      });

      await this.prisma.incidentHistory.create({
        data: {
          incidentId,
          actionType: HistoryActionType.ASSIGNED,
          oldValue: null,
          newValue: task.assignee.name,
          metadata: {
            taskId: task.id,
            startsAt: task.startsAt.toISOString(),
            endsAt: task.endsAt.toISOString(),
            title: task.title,
            scheduleType: task.scheduleType,
          },
          createdById: user.sub,
        },
      });

      return task;
    } catch (e) {
      if (this.isAssigneeOverlapError(e)) {
        throw new ConflictException('Assignee is busy during this time');
      }
      throw e;
    }
  }

  async update(taskId: string, dto: UpdateIncidentTaskDto, user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'assign_task');

    const existing = await this.prisma.incidentAssigneeTask.findUnique({
      where: { id: taskId },
      include: { incident: true },
    });
    if (!existing) throw new NotFoundException('Task not found');

    await this.assertIncidentAccess(existing.incidentId, user);

    const assigneeId = dto.assigneeId ?? existing.assigneeId;
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      const categoryId =
        existing.incident.subcategoryId ?? existing.incident.categoryId;
      await this.assertAssigneeForCategory(assigneeId, categoryId);
    }

    const scheduleType =
      dto.scheduleType ?? existing.scheduleType;
    const allowOverlap = dto.allowOverlap === true;
    const estimatedMinutes =
      dto.estimatedMinutes !== undefined
        ? dto.estimatedMinutes
        : existing.estimatedMinutes;

    const nextStatus = dto.status ?? existing.status;
    if (ACTIVE_TASK_STATUSES.includes(nextStatus)) {
      await this.assertSchedulingAllowed(
        assigneeId,
        startsAt,
        endsAt,
        scheduleType,
        allowOverlap,
        taskId,
      );
    }

    const description =
      dto.description !== undefined
        ? this.buildDescription(
            dto.description,
            scheduleType,
            estimatedMinutes ?? undefined,
          )
        : undefined;

    try {
      return await this.prisma.incidentAssigneeTask.update({
        where: { id: taskId },
        data: {
          ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(description !== undefined && { description }),
          ...(dto.startsAt !== undefined && { startsAt }),
          ...(dto.endsAt !== undefined && { endsAt }),
          ...(dto.scheduleType !== undefined && { scheduleType }),
          ...(dto.estimatedMinutes !== undefined && {
            estimatedMinutes:
              scheduleType === IncidentAssigneeTaskScheduleType.WINDOW
                ? estimatedMinutes
                : null,
          }),
          ...(dto.status !== undefined && {
            status: dto.status,
            completedAt:
              dto.status === IncidentAssigneeTaskStatus.COMPLETED
                ? new Date()
                : dto.status === IncidentAssigneeTaskStatus.CANCELLED
                  ? existing.completedAt
                  : null,
          }),
        },
        include: taskInclude,
      });
    } catch (e) {
      if (this.isAssigneeOverlapError(e)) {
        throw new ConflictException('Assignee is busy during this time');
      }
      throw e;
    }
  }

  private buildDescription(
    raw: string | undefined,
    scheduleType: IncidentAssigneeTaskScheduleType,
    estimatedMinutes?: number,
  ): string | null {
    const base = raw?.trim() || '';
    if (scheduleType !== IncidentAssigneeTaskScheduleType.WINDOW) {
      return base || null;
    }
    const effort =
      estimatedMinutes != null
        ? `~${estimatedMinutes} dəq təxmini sərfiyyat`
        : null;
    if (!effort) return base || null;
    if (!base) return effort;
    if (base.includes(effort)) return base;
    return `${base}\n\n${effort}`;
  }

  private isAssigneeOverlapError(e: unknown): boolean {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
    const msg = String(e.message);
    return (
      msg.includes('incident_assignee_tasks_no_overlap') ||
      msg.includes('exclusion')
    );
  }

  async remove(taskId: string, user: JwtPayload) {
    const scope = await this.accessControl.getScope(user.sub);
    this.accessControl.requirePermission(scope, 'assign_task');

    const existing = await this.prisma.incidentAssigneeTask.findUnique({
      where: { id: taskId },
    });
    if (!existing) throw new NotFoundException('Task not found');

    await this.assertIncidentAccess(existing.incidentId, user);

    await this.prisma.incidentAssigneeTask.update({
      where: { id: taskId },
      data: { status: IncidentAssigneeTaskStatus.CANCELLED },
    });

    return { ok: true };
  }

  async listForIncident(incidentId: string) {
    return this.prisma.incidentAssigneeTask.findMany({
      where: {
        incidentId,
        status: { not: IncidentAssigneeTaskStatus.CANCELLED },
      },
      include: taskInclude,
      orderBy: { startsAt: 'asc' },
    });
  }
}
