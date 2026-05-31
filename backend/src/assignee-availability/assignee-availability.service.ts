import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssigneeAvailabilityKind,
  AssigneeAvailabilitySlotType,
  IncidentAssigneeTaskScheduleType,
  IncidentAssigneeTaskStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  enumerateBakuDateKeys,
  getBakuWeekdayMon0,
  toBakuDateKey,
  bakuLocalToUtc,
  dateKeyFromDbDate,
} from './baku-time.util';
import {
  AvailabilitySlotRow,
  findFreeMinuteIntervalsInWindows,
  getEffectiveWindowsForDay,
  isDayExplicitlyClosed,
  isIntervalWithinWindows,
  slotsToMinuteRanges,
} from './assignee-availability.logic';
import { UpsertAvailabilitySlotDto } from './dto/upsert-availability-slot.dto';

const ACTIVE_TASK_STATUSES: IncidentAssigneeTaskStatus[] = [
  IncidentAssigneeTaskStatus.SCHEDULED,
  IncidentAssigneeTaskStatus.IN_PROGRESS,
];

/** Inclusive calendar days allowed in overview / calendar APIs. */
export const MAX_AVAILABILITY_RANGE_DAYS = 63;

const slotSelect = {
  id: true,
  assigneeId: true,
  kind: true,
  dayOfWeek: true,
  date: true,
  slotType: true,
  startMinute: true,
  endMinute: true,
  label: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AssigneeAvailabilitySlotSelect;

export type CalendarDayDto = {
  date: string;
  dayOfWeek: number;
  hasDateOverride: boolean;
  status: 'open' | 'partial' | 'closed' | 'off' | 'busy';
  effectiveWindows: Array<{ startMinute: number; endMinute: number }>;
  unavailableBlocks: Array<{ startMinute: number; endMinute: number }>;
  tasks: Array<{
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    status: IncidentAssigneeTaskStatus;
    scheduleType: string;
  }>;
};

@Injectable()
export class AssigneeAvailabilityService {
  constructor(private prisma: PrismaService) {}

  /** Accepts `yyyy-MM-dd` (preferred) or ISO strings. */
  private parseOverviewRange(fromStr: string, toStr: string) {
    if (!fromStr?.trim() || !toStr?.trim()) {
      throw new BadRequestException('Query params from and to are required');
    }

    const from = /^\d{4}-\d{2}-\d{2}$/.test(fromStr.trim())
      ? bakuLocalToUtc(fromStr.trim(), 0)
      : new Date(fromStr);
    const to = /^\d{4}-\d{2}-\d{2}$/.test(toStr.trim())
      ? bakuLocalToUtc(toStr.trim(), 24 * 60)
      : new Date(toStr);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid from/to');
    }
    if (to <= from) {
      throw new BadRequestException('to must be after from');
    }
    const dateKeys = enumerateBakuDateKeys(from, to);
    if (dateKeys.length > MAX_AVAILABILITY_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${MAX_AVAILABILITY_RANGE_DAYS} days`,
      );
    }
    return { from, to, dateKeys };
  }

  private dayStatus(
    effectiveWindows: { start: number; end: number }[],
    unavailableBlocks: { start: number; end: number }[],
    tasks: unknown[],
    explicitlyClosed: boolean,
  ): CalendarDayDto['status'] {
    if (tasks.length > 0) return 'busy';
    if (effectiveWindows.length === 0) {
      return explicitlyClosed ? 'closed' : 'off';
    }
    if (unavailableBlocks.length > 0) return 'partial';
    return 'open';
  }

  private buildCalendarDays(
    slots: AvailabilitySlotRow[],
    tasks: Array<{
      id: string;
      title: string;
      startsAt: Date;
      endsAt: Date;
      status: IncidentAssigneeTaskStatus;
      scheduleType: IncidentAssigneeTaskScheduleType;
    }>,
    dateKeys: string[],
  ): CalendarDayDto[] {
    return dateKeys.map((dateKey) => {
      const dayOfWeek = getBakuWeekdayMon0(bakuLocalToUtc(dateKey, 12 * 60));
      const effectiveWindows = getEffectiveWindowsForDay(
        slots,
        dateKey,
        dayOfWeek,
      );
      const hasDateOverride = slots.some(
        (s) =>
          s.kind === AssigneeAvailabilityKind.DATE &&
          s.date != null &&
          dateKeyFromDbDate(s.date) === dateKey,
      );

      const unavailableBlocks = slotsToMinuteRanges(slots, (s) => {
        if (s.slotType !== AssigneeAvailabilitySlotType.UNAVAILABLE) {
          return false;
        }
        if (s.kind === AssigneeAvailabilityKind.WEEKLY) {
          return s.dayOfWeek === dayOfWeek;
        }
        return (
          s.kind === AssigneeAvailabilityKind.DATE &&
          s.date != null &&
          dateKeyFromDbDate(s.date) === dateKey
        );
      });

      const dayStart = bakuLocalToUtc(dateKey, 0);
      const dayEnd = bakuLocalToUtc(dateKey, 24 * 60);
      const dayTasks = tasks
        .filter((t) => t.startsAt < dayEnd && t.endsAt > dayStart)
        .map((t) => ({
          id: t.id,
          title: t.title,
          startsAt: t.startsAt.toISOString(),
          endsAt: t.endsAt.toISOString(),
          status: t.status,
          scheduleType: t.scheduleType,
        }));

      return {
        date: dateKey,
        dayOfWeek,
        hasDateOverride,
        status: this.dayStatus(
          effectiveWindows,
          unavailableBlocks,
          dayTasks,
          isDayExplicitlyClosed(slots, dateKey, dayOfWeek),
        ),
        effectiveWindows: effectiveWindows.map((w) => ({
          startMinute: w.start,
          endMinute: w.end,
        })),
        unavailableBlocks: unavailableBlocks.map((w) => ({
          startMinute: w.start,
          endMinute: w.end,
        })),
        tasks: dayTasks,
      };
    });
  }

  private async assertAssignee(assigneeId: string) {
    const assignee = await this.prisma.categoryAssignee.findUnique({
      where: { id: assigneeId },
    });
    if (!assignee) throw new NotFoundException('Assignee not found');
    return assignee;
  }

  private validateSlotDto(dto: UpsertAvailabilitySlotDto) {
    const closedDayMarker =
      dto.slotType === AssigneeAvailabilitySlotType.AVAILABLE &&
      dto.endMinute === dto.startMinute;
    if (dto.endMinute < dto.startMinute) {
      throw new BadRequestException('endMinute must be >= startMinute');
    }
    if (dto.endMinute === dto.startMinute && !closedDayMarker) {
      throw new BadRequestException('endMinute must be greater than startMinute');
    }
    if (dto.kind === AssigneeAvailabilityKind.WEEKLY) {
      if (dto.dayOfWeek === undefined || dto.dayOfWeek === null) {
        throw new BadRequestException('dayOfWeek is required for WEEKLY slots');
      }
      if (dto.date) {
        throw new BadRequestException('date must not be set for WEEKLY slots');
      }
    } else {
      if (!dto.date) {
        throw new BadRequestException('date is required for DATE slots');
      }
      if (dto.dayOfWeek !== undefined && dto.dayOfWeek !== null) {
        throw new BadRequestException('dayOfWeek must not be set for DATE slots');
      }
    }
  }

  private parseDateOnly(dateStr: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    return new Date(`${dateStr}T00:00:00.000Z`);
  }

  private toSlotRow(
    slot: Prisma.AssigneeAvailabilitySlotGetPayload<{ select: typeof slotSelect }>,
  ) {
    return {
      id: slot.id,
      assigneeId: slot.assigneeId,
      kind: slot.kind,
      dayOfWeek: slot.dayOfWeek,
      date: slot.date ? dateKeyFromDbDate(slot.date) : null,
      slotType: slot.slotType,
      startMinute: slot.startMinute,
      endMinute: slot.endMinute,
      label: slot.label,
      createdAt: slot.createdAt.toISOString(),
      updatedAt: slot.updatedAt.toISOString(),
    };
  }

  async findAllSlots(assigneeId: string) {
    await this.assertAssignee(assigneeId);
    const slots = await this.prisma.assigneeAvailabilitySlot.findMany({
      where: { assigneeId },
      select: slotSelect,
      orderBy: [
        { kind: 'asc' },
        { dayOfWeek: 'asc' },
        { date: 'asc' },
        { startMinute: 'asc' },
      ],
    });
    return slots.map((s) => this.toSlotRow(s));
  }

  async replaceAll(assigneeId: string, dtos: UpsertAvailabilitySlotDto[]) {
    await this.assertAssignee(assigneeId);
    for (const dto of dtos) {
      this.validateSlotDto(dto);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.assigneeAvailabilitySlot.deleteMany({ where: { assigneeId } });
      if (dtos.length > 0) {
        await tx.assigneeAvailabilitySlot.createMany({
          data: dtos.map((dto) => ({
            assigneeId,
            kind: dto.kind,
            dayOfWeek:
              dto.kind === AssigneeAvailabilityKind.WEEKLY
                ? dto.dayOfWeek!
                : null,
            date:
              dto.kind === AssigneeAvailabilityKind.DATE
                ? this.parseDateOnly(dto.date!)
                : null,
            slotType: dto.slotType,
            startMinute: dto.startMinute,
            endMinute: dto.endMinute,
            label: dto.label?.trim() || null,
          })),
        });
      }
    });

    return this.findAllSlots(assigneeId);
  }

  async createSlot(assigneeId: string, dto: UpsertAvailabilitySlotDto) {
    await this.assertAssignee(assigneeId);
    this.validateSlotDto(dto);

    const slot = await this.prisma.assigneeAvailabilitySlot.create({
      data: {
        assigneeId,
        kind: dto.kind,
        dayOfWeek:
          dto.kind === AssigneeAvailabilityKind.WEEKLY ? dto.dayOfWeek! : null,
        date:
          dto.kind === AssigneeAvailabilityKind.DATE
            ? this.parseDateOnly(dto.date!)
            : null,
        slotType: dto.slotType,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
        label: dto.label?.trim() || null,
      },
      select: slotSelect,
    });
    return this.toSlotRow(slot);
  }

  async updateSlot(
    assigneeId: string,
    slotId: string,
    dto: Partial<UpsertAvailabilitySlotDto>,
  ) {
    await this.assertAssignee(assigneeId);
    const existing = await this.prisma.assigneeAvailabilitySlot.findFirst({
      where: { id: slotId, assigneeId },
    });
    if (!existing) throw new NotFoundException('Slot not found');

    const merged: UpsertAvailabilitySlotDto = {
      kind: dto.kind ?? existing.kind,
      dayOfWeek: dto.dayOfWeek ?? existing.dayOfWeek ?? undefined,
      date:
        dto.date ??
        (existing.date ? dateKeyFromDbDate(existing.date) : undefined),
      slotType: dto.slotType ?? existing.slotType,
      startMinute: dto.startMinute ?? existing.startMinute,
      endMinute: dto.endMinute ?? existing.endMinute,
      label: dto.label !== undefined ? dto.label : existing.label ?? undefined,
    };
    this.validateSlotDto(merged);

    const slot = await this.prisma.assigneeAvailabilitySlot.update({
      where: { id: slotId },
      data: {
        kind: merged.kind,
        dayOfWeek:
          merged.kind === AssigneeAvailabilityKind.WEEKLY
            ? merged.dayOfWeek!
            : null,
        date:
          merged.kind === AssigneeAvailabilityKind.DATE
            ? this.parseDateOnly(merged.date!)
            : null,
        slotType: merged.slotType,
        startMinute: merged.startMinute,
        endMinute: merged.endMinute,
        label: merged.label?.trim() || null,
      },
      select: slotSelect,
    });
    return this.toSlotRow(slot);
  }

  async removeSlot(assigneeId: string, slotId: string) {
    await this.assertAssignee(assigneeId);
    const existing = await this.prisma.assigneeAvailabilitySlot.findFirst({
      where: { id: slotId, assigneeId },
    });
    if (!existing) throw new NotFoundException('Slot not found');
    await this.prisma.assigneeAvailabilitySlot.delete({ where: { id: slotId } });
    return { ok: true };
  }

  async loadSlotRows(assigneeId: string): Promise<AvailabilitySlotRow[]> {
    const slots = await this.prisma.assigneeAvailabilitySlot.findMany({
      where: { assigneeId },
    });
    return slots.map((s) => ({
      kind: s.kind,
      dayOfWeek: s.dayOfWeek,
      date: s.date,
      slotType: s.slotType,
      startMinute: s.startMinute,
      endMinute: s.endMinute,
    }));
  }

  getEffectiveWindows(slots: AvailabilitySlotRow[], localDateKey: string) {
    const dayOfWeek = getBakuWeekdayMon0(bakuLocalToUtc(localDateKey, 12 * 60));
    return getEffectiveWindowsForDay(slots, localDateKey, dayOfWeek);
  }

  isIntervalWithinAvailability(
    slots: AvailabilitySlotRow[],
    start: Date,
    end: Date,
  ) {
    return isIntervalWithinWindows(start, end, slots);
  }

  async findFreeIntervals(
    assigneeId: string,
    from: Date,
    to: Date,
    durationMinutes: number,
  ) {
    const slots = await this.loadSlotRows(assigneeId);
    const busyTasks = await this.prisma.incidentAssigneeTask.findMany({
      where: {
        assigneeId,
        status: { in: ACTIVE_TASK_STATUSES },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      orderBy: { startsAt: 'asc' },
      select: { startsAt: true, endsAt: true },
    });
    const busyUtc = busyTasks.map((t) => ({
      start: t.startsAt,
      end: t.endsAt,
    }));

    const result: Array<{ startsAt: string; endsAt: string }> = [];
    const dateKeys = enumerateBakuDateKeys(from, to);

    for (const dateKey of dateKeys) {
      const dayOfWeek = getBakuWeekdayMon0(bakuLocalToUtc(dateKey, 12 * 60));
      const windows = getEffectiveWindowsForDay(slots, dateKey, dayOfWeek);
      const dayStart = bakuLocalToUtc(dateKey, 0);
      const dayEnd = bakuLocalToUtc(dateKey, 24 * 60);
      const segStart = new Date(Math.max(dayStart.getTime(), from.getTime()));
      const segEnd = new Date(Math.min(dayEnd.getTime(), to.getTime()));
      if (segEnd <= segStart) continue;

      const daySlots = findFreeMinuteIntervalsInWindows(
        windows,
        busyUtc,
        segStart,
        segEnd,
        durationMinutes,
      );
      result.push(...daySlots);
    }

    return result;
  }

  async getCalendar(assigneeId: string, fromStr: string, toStr: string) {
    await this.assertAssignee(assigneeId);
    const { from, to, dateKeys } = this.parseOverviewRange(fromStr, toStr);

    const slots = await this.loadSlotRows(assigneeId);

    const tasks = await this.prisma.incidentAssigneeTask.findMany({
      where: {
        assigneeId,
        status: { in: ACTIVE_TASK_STATUSES },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        status: true,
        scheduleType: true,
      },
    });

    const days = this.buildCalendarDays(slots, tasks, dateKeys);

    return { from: from.toISOString(), to: to.toISOString(), days };
  }

  async getGlobalOverview(fromStr: string, toStr: string) {
    const { from, to, dateKeys } = this.parseOverviewRange(fromStr, toStr);

    const assignees = await this.prisma.categoryAssignee.findMany({
      where: { isActive: true },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
      orderBy: { name: 'asc' },
    });

    const assigneeIds = assignees.map((a) => a.id);
    if (assigneeIds.length === 0) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        dates: dateKeys,
        assignees: [],
      };
    }

    const allSlots = await this.prisma.assigneeAvailabilitySlot.findMany({
      where: { assigneeId: { in: assigneeIds } },
    });

    const allTasks = await this.prisma.incidentAssigneeTask.findMany({
      where: {
        assigneeId: { in: assigneeIds },
        status: { in: ACTIVE_TASK_STATUSES },
        startsAt: { lt: to },
        endsAt: { gt: from },
      },
      select: {
        assigneeId: true,
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        status: true,
        scheduleType: true,
      },
    });

    const slotsByAssignee = new Map<string, AvailabilitySlotRow[]>();
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

    const tasksByAssignee = new Map<string, typeof allTasks>();
    for (const task of allTasks) {
      const list = tasksByAssignee.get(task.assigneeId) ?? [];
      list.push(task);
      tasksByAssignee.set(task.assigneeId, list);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      dates: dateKeys,
      assignees: assignees.map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind,
        organization: a.organization,
        days: this.buildCalendarDays(
          slotsByAssignee.get(a.id) ?? [],
          tasksByAssignee.get(a.id) ?? [],
          dateKeys,
        ),
      })),
    };
  }
}
