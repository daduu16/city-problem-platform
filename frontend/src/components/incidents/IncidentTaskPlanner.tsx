import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { az } from "@/i18n/az";
import type {
	AssigneeAvailabilityCalendar,
	AssigneeDaySchedule,
	CategoryAssignee,
	IncidentAssigneeTask,
	IncidentAssigneeTaskScheduleType,
} from "@/types";
import {
	AssigneeDayTimeline,
	dateKeyFromDraft,
	minuteOnDateKey,
} from "@/components/incidents/AssigneeDayTimeline";
import { AssigneePickerModal } from "@/components/incidents/AssigneePickerModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
	addDaysToDateKey,
	addUtcMinutes,
	bakuLocalToUtc,
	defaultTaskStartUtc,
	formatBakuDateTime,
	getBakuMinutes,
	roundBakuMinutesUp,
	todayDateKey,
	utcToIsoString,
} from "@/lib/baku-date";
import { cn } from "@/lib/utils";

type PlannerMode = "timeFirst" | "assigneeFirst";

type Props = {
	incidentId: string;
	categoryId: string;
	onCreated: () => void;
};

export function IncidentTaskPlanner({
	incidentId,
	categoryId,
	onCreated,
}: Props) {
	const queryClient = useQueryClient();
	const defaultStart = defaultTaskStartUtc();
	const [mode, setMode] = useState<PlannerMode>("assigneeFirst");
	const [scheduleType, setScheduleType] =
		useState<IncidentAssigneeTaskScheduleType>("FIXED");
	const [startsAt, setStartsAt] = useState<Date>(defaultStart);
	const [fixedEndsAt, setFixedEndsAt] = useState<Date>(() =>
		addUtcMinutes(defaultStart, 120),
	);
	const [windowEndsAt, setWindowEndsAt] = useState<Date>(() =>
		addUtcMinutes(defaultStart, 24 * 60),
	);
	const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">(120);
	const [allowOverlap, setAllowOverlap] = useState(false);
	const [selectedAssignee, setSelectedAssignee] =
		useState<CategoryAssignee | null>(null);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const isFixed = scheduleType === "FIXED";
	const endsAt = isFixed ? fixedEndsAt : windowEndsAt;

	const startsIso = utcToIsoString(startsAt);
	const endsIso = utcToIsoString(endsAt);
	const rangeValid = endsAt > startsAt;
	const rangeDurationMinutes = useMemo(
		() =>
			rangeValid
				? Math.max(
						15,
						Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
					)
				: 15,
		[endsAt, startsAt, rangeValid],
	);
	const focusDateKey = dateKeyFromDraft(startsAt);
	const isAssigneeFirst = mode === "assigneeFirst";
	const showTimeline = isFixed && Boolean(selectedAssignee);
	const timelineInitForRef = useRef<string | null>(null);

	useEffect(() => {
		setAllowOverlap(false);
	}, [startsIso, endsIso, selectedAssignee?.id, scheduleType]);

	useEffect(() => {
		if (!isAssigneeFirst || !isFixed) {
			if (!selectedAssignee) timelineInitForRef.current = null;
			return;
		}
		if (!selectedAssignee) {
			timelineInitForRef.current = null;
			return;
		}
		if (timelineInitForRef.current === selectedAssignee.id) return;
		timelineInitForRef.current = selectedAssignee.id;

		const today = todayDateKey();
		let dateKey = today;
		let minutes = roundBakuMinutesUp(getBakuMinutes(new Date()) + 60, 15);
		if (minutes >= 24 * 60 - 15) {
			dateKey = addDaysToDateKey(today, 1);
			minutes = 9 * 60;
		}
		const start = bakuLocalToUtc(dateKey, minutes);
		setStartsAt(start);
		setFixedEndsAt(addUtcMinutes(start, 120));
	}, [isAssigneeFirst, isFixed, selectedAssignee]);

	useEffect(() => {
		if (scheduleType === "WINDOW") {
			const now = new Date();
			setStartsAt(now);
			if (windowEndsAt <= now) {
				setWindowEndsAt(addUtcMinutes(now, 24 * 60));
			}
		}
	}, [scheduleType]);

	const setStartsAtSafe = (next: Date) => {
		setStartsAt(next);
		if (isFixed && fixedEndsAt <= next) {
			setFixedEndsAt(addUtcMinutes(next, 120));
		}
		if (!isFixed && windowEndsAt <= next) {
			setWindowEndsAt(addUtcMinutes(next, 24 * 60));
		}
	};

	const setFixedEndsAtSafe = (next: Date) => {
		if (next <= startsAt) {
			setFixedEndsAt(addUtcMinutes(startsAt, 15));
		} else {
			setFixedEndsAt(next);
		}
	};

	const dayScheduleQuery = useQuery({
		queryKey: [
			"incident-tasks",
			"day-schedule",
			selectedAssignee?.id,
			focusDateKey,
			rangeValid ? startsIso : null,
			rangeValid ? endsIso : null,
		],
		queryFn: async (): Promise<AssigneeDaySchedule> => {
			const assigneeId = selectedAssignee!.id;
			const params: Record<string, string> = { date: focusDateKey };
			if (rangeValid) {
				params.draftStartsAt = startsIso;
				params.draftEndsAt = endsIso;
			}
			try {
				const res = await api.get<AssigneeDaySchedule>(
					`/incident-tasks/assignees/${assigneeId}/day-schedule`,
					{ params },
				);
				return res.data;
			} catch {
				const cal = await api.get<AssigneeAvailabilityCalendar>(
					`/assignees/${assigneeId}/availability/calendar`,
					{ params: { from: focusDateKey, to: focusDateKey } },
				);
				const day = cal.data.days[0];
				if (!day) {
					throw new Error("day_not_found");
				}
				return {
					assignee: {
						id: assigneeId,
						name: selectedAssignee!.name,
					},
					date: focusDateKey,
					day,
				};
			}
		},
		enabled: Boolean(selectedAssignee?.id && isFixed),
		retry: 1,
	});

	const draftWarnings = dayScheduleQuery.data?.draft;
	const hasFixedConflict = (draftWarnings?.fixedConflicts.length ?? 0) > 0;
	const hasOutsideHours = draftWarnings?.outsideHours === true;

	const createMutation = useMutation({
		mutationFn: async (payload: {
			assigneeId: string;
			startsAt: string;
			endsAt: string;
			scheduleType: IncidentAssigneeTaskScheduleType;
			estimatedMinutes?: number;
			allowOverlap?: boolean;
		}) => {
			await api.post(`/incidents/${incidentId}/tasks`, {
				assigneeId: payload.assigneeId,
				title: title.trim(),
				description: description.trim() || undefined,
				startsAt: payload.startsAt,
				endsAt: payload.endsAt,
				scheduleType: payload.scheduleType,
				estimatedMinutes: payload.estimatedMinutes,
				allowOverlap: payload.allowOverlap,
			});
		},
		onSuccess: () => {
			setTitle("");
			setDescription("");
			setSelectedAssignee(null);
			setAllowOverlap(false);
			void queryClient.invalidateQueries({
				queryKey: ["availability-overview"],
			});
			onCreated();
		},
	});

	const effectiveStarts = startsIso;
	const effectiveEnds = endsIso;

	const needsOverlapAck = isFixed && hasFixedConflict && !allowOverlap;
	const needsOutsideAck = isFixed && hasOutsideHours && !allowOverlap;

	const canSubmit =
		Boolean(
			selectedAssignee && title.trim() && effectiveStarts && effectiveEnds,
		) &&
		!createMutation.isPending &&
		new Date(effectiveEnds) > new Date(effectiveStarts) &&
		!needsOverlapAck &&
		!(needsOutsideAck && !allowOverlap);

	const busyMessage = useMemo(() => {
		if (!createMutation.isError) return null;
		const err = createMutation.error as {
			response?: {
				data?: { message?: string | { message?: string; reason?: string } };
			};
		};
		const raw = err.response?.data?.message;
		if (typeof raw === "string") return raw;
		if (typeof raw === "object" && raw?.reason === "outside_hours") {
			return az.tasks.availabilityError;
		}
		if (typeof raw === "object" && raw?.reason === "unavailable_block") {
			return az.tasks.unavailableBlockError;
		}
		if (typeof raw === "object" && raw?.message) return raw.message;
		return az.tasks.conflictError;
	}, [createMutation.isError, createMutation.error]);

	const resetPlanningDraft = () => {
		setSelectedAssignee(null);
		setAllowOverlap(false);
		setPickerOpen(false);
		timelineInitForRef.current = null;
	};

	const applyDefaultTimeRange = (
		nextScheduleType: IncidentAssigneeTaskScheduleType,
	) => {
		if (nextScheduleType === "FIXED") {
			const start = defaultTaskStartUtc();
			setStartsAt(start);
			setFixedEndsAt(addUtcMinutes(start, 120));
			return;
		}
		const now = new Date();
		setStartsAt(now);
		setWindowEndsAt(addUtcMinutes(now, 24 * 60));
	};

	const selectScheduleType = (next: IncidentAssigneeTaskScheduleType) => {
		if (next === scheduleType) return;
		resetPlanningDraft();
		applyDefaultTimeRange(next);
		setScheduleType(next);
	};

	const selectMode = (next: PlannerMode) => {
		if (next === mode) return;
		resetPlanningDraft();
		applyDefaultTimeRange(scheduleType);
		setMode(next);
	};

	const openPicker = () => {
		if (mode === "timeFirst" && !rangeValid) return;
		setPickerOpen(true);
	};

	const handleTimelineRange = (startMinute: number, endMinute: number) => {
		const dateKey = dayScheduleQuery.data?.day.date ?? focusDateKey;
		const start = minuteOnDateKey(dateKey, startMinute);
		const end = minuteOnDateKey(dateKey, endMinute);
		setStartsAt(start);
		setFixedEndsAt(end);
	};

	return (
		<div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-3">
			<AssigneePickerModal
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode={mode}
				categoryId={categoryId}
				startsAt={startsIso}
				endsAt={endsIso}
				selectedId={selectedAssignee?.id ?? null}
				onSelect={(a) => {
					setSelectedAssignee(a);
				}}
			/>

			<div className="flex gap-1 rounded-md border border-border/60 bg-background/80 p-0.5">
				<button
					type="button"
					className={cn(
						"flex-1 rounded px-2 py-1.5 text-xs font-medium",
						scheduleType === "FIXED"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground",
					)}
					onClick={() => selectScheduleType("FIXED")}
				>
					{az.tasks.scheduleTypeFixed}
				</button>
				<button
					type="button"
					className={cn(
						"flex-1 rounded px-2 py-1.5 text-xs font-medium",
						scheduleType === "WINDOW"
							? "bg-primary text-primary-foreground"
							: "text-muted-foreground",
					)}
					onClick={() => selectScheduleType("WINDOW")}
				>
					{az.tasks.scheduleTypeWindow}
				</button>
			</div>
			<p className="text-[11px] text-muted-foreground">
				{isFixed
					? az.tasks.scheduleTypeFixedHint
					: az.tasks.scheduleTypeWindowHint}
			</p>

			<div className="flex gap-1 rounded-md border border-border/60 bg-background/80 p-0.5">
				<button
					type="button"
					className={cn(
						"flex-1 rounded px-2 py-1.5 text-xs font-medium",
						mode === "assigneeFirst"
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground",
					)}
					onClick={() => selectMode("assigneeFirst")}
				>
					{az.tasks.modeAssigneeFirst}
				</button>
				<button
					type="button"
					className={cn(
						"flex-1 rounded px-2 py-1.5 text-xs font-medium",
						mode === "timeFirst"
							? "bg-secondary text-secondary-foreground"
							: "text-muted-foreground",
					)}
					onClick={() => selectMode("timeFirst")}
				>
					{az.tasks.modeTimeFirst}
				</button>
			</div>

			{isAssigneeFirst && !selectedAssignee && (
				<p className="text-xs text-muted-foreground">
					{az.tasks.assigneeFirstTimelineHint}
				</p>
			)}

			<div className="space-y-1.5">
				<Label className="text-xs">{az.drawer.assignee}</Label>
				<button
					type="button"
					onClick={openPicker}
					disabled={mode === "timeFirst" && !rangeValid}
					className={cn(
						"flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
						mode === "timeFirst" &&
							!rangeValid &&
							"cursor-not-allowed opacity-50",
					)}
				>
					<span
						className={
							selectedAssignee ? "font-medium" : "text-muted-foreground"
						}
					>
						{selectedAssignee?.name ?? az.tasks.noExecutorSelected}
					</span>
					<span className="flex shrink-0 items-center gap-1 text-xs text-primary">
						{selectedAssignee
							? az.tasks.changeExecutor
							: az.tasks.selectExecutor}
						<ChevronRight className="h-4 w-4" />
					</span>
				</button>
			</div>

			{showTimeline && (
				<div className="space-y-2">
					{dayScheduleQuery.isPending && !dayScheduleQuery.data && (
						<div className="space-y-2" aria-busy="true">
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs font-medium">{az.tasks.dayTimeline}</p>
								<p className="text-[10px] text-muted-foreground">
									{focusDateKey}
								</p>
							</div>
							<p className="text-[10px] text-muted-foreground">
								{az.tasks.dayTimelineLoading}
							</p>
							<div className="h-14 animate-pulse rounded-md border border-border bg-muted/50" />
						</div>
					)}
					{dayScheduleQuery.isError && !dayScheduleQuery.data && (
						<div className="space-y-2">
							<p className="text-xs font-medium">{az.tasks.dayTimeline}</p>
							<p className="text-xs text-destructive">
								{az.tasks.dayTimelineLoadError}
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void dayScheduleQuery.refetch()}
							>
								{az.errors.retry}
							</Button>
						</div>
					)}
					{dayScheduleQuery.data && (
						<AssigneeDayTimeline
							day={dayScheduleQuery.data.day}
							draftStart={rangeValid ? new Date(startsIso) : undefined}
							draftEnd={rangeValid ? new Date(endsIso) : undefined}
							onPickRange={handleTimelineRange}
						/>
					)}
				</div>
			)}

			{isAssigneeFirst && selectedAssignee && rangeValid && isFixed && (
				<p className="text-center text-xs text-muted-foreground">
					{az.tasks.selectedRange(
						formatBakuDateTime(startsAt),
						formatBakuDateTime(fixedEndsAt),
						rangeDurationMinutes,
					)}
				</p>
			)}

			{isAssigneeFirst && selectedAssignee && !isFixed && (
				<div className="space-y-3 rounded-md border border-border/60 bg-background/50 p-3">
					<div className="space-y-1.5">
						<Label className="text-xs">{az.tasks.windowTo}</Label>
						<DateTimePicker
							value={windowEndsAt}
							onChange={(d) => d && setWindowEndsAt(d)}
							popoverClassName="z-[1200]"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">{az.tasks.estimatedEffort}</Label>
						<Input
							type="number"
							min={15}
							step={15}
							className="h-9 max-w-[8rem]"
							value={estimatedMinutes}
							onChange={(e) => {
								const v = e.target.value;
								setEstimatedMinutes(v === "" ? "" : Number(v));
							}}
						/>
						<p className="text-[10px] text-muted-foreground">
							{az.tasks.estimatedEffortHint}
						</p>
					</div>
				</div>
			)}

			{mode === "timeFirst" && isFixed && (
				<div className="space-y-3">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label className="text-xs">{az.tasks.startsAt}</Label>
							<DateTimePicker
								value={startsAt}
								onChange={(d) => d && setStartsAtSafe(d)}
								popoverClassName="z-[1200]"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">{az.tasks.endsAt}</Label>
							<DateTimePicker
								value={fixedEndsAt}
								onChange={(d) => d && setFixedEndsAtSafe(d)}
								popoverClassName="z-[1200]"
							/>
						</div>
					</div>
					{rangeValid && (
						<p className="text-center text-xs text-muted-foreground">
							{az.tasks.selectedRange(
								formatBakuDateTime(startsAt),
								formatBakuDateTime(fixedEndsAt),
								rangeDurationMinutes,
							)}
						</p>
					)}
				</div>
			)}

			{mode === "timeFirst" && !isFixed && (
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label className="text-xs">{az.tasks.windowTo}</Label>
						<DateTimePicker
							value={windowEndsAt}
							onChange={(d) => d && setWindowEndsAt(d)}
							popoverClassName="z-[1200]"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">{az.tasks.estimatedEffort}</Label>
						<Input
							type="number"
							min={15}
							step={15}
							className="h-9 max-w-[8rem]"
							value={estimatedMinutes}
							onChange={(e) => {
								const v = e.target.value;
								setEstimatedMinutes(v === "" ? "" : Number(v));
							}}
						/>
						<p className="text-[10px] text-muted-foreground">
							{az.tasks.estimatedEffortHint}
						</p>
					</div>
				</div>
			)}

			{mode === "timeFirst" && !rangeValid && (
				<p className="text-xs text-destructive">{az.tasks.invalidRange}</p>
			)}

			{isFixed && selectedAssignee && hasFixedConflict && (
				<div className="space-y-2 rounded-md border border-amber-300/60 bg-amber-50/80 p-2.5 dark:border-amber-800 dark:bg-amber-950/30">
					<p className="text-xs font-medium text-amber-900 dark:text-amber-200">
						{az.tasks.conflictWarning}
					</p>
					<ul className="space-y-1 text-[11px] text-amber-900/90 dark:text-amber-100/90">
						{draftWarnings?.fixedConflicts.map((c) => (
							<li key={c.id}>
								{c.title}: {formatBakuDateTime(new Date(c.startsAt))} —{" "}
								{formatBakuDateTime(new Date(c.endsAt))}
							</li>
						))}
					</ul>
					<label className="flex cursor-pointer items-start gap-2">
						<Checkbox
							checked={allowOverlap}
							onCheckedChange={(v) => setAllowOverlap(v === true)}
						/>
						<span className="text-xs leading-snug">
							{az.tasks.allowOverlap}
							<span className="mt-0.5 block text-[10px] text-muted-foreground">
								{az.tasks.allowOverlapHint}
							</span>
						</span>
					</label>
				</div>
			)}

			{isFixed && selectedAssignee && hasOutsideHours && !hasFixedConflict && (
				<div className="rounded-md border border-amber-300/60 bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
					{az.tasks.outsideHoursWarning}
					<label className="mt-2 flex cursor-pointer items-center gap-2">
						<Checkbox
							checked={allowOverlap}
							onCheckedChange={(v) => setAllowOverlap(v === true)}
						/>
						<span>{az.tasks.allowOverlap}</span>
					</label>
				</div>
			)}

			<div className="space-y-2 border-t border-border/50 pt-3">
				<div className="space-y-1.5">
					<Label htmlFor="task-title" className="text-xs">
						{az.tasks.taskTitle}
					</Label>
					<Input
						id="task-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={az.tasks.taskTitlePlaceholder}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="task-desc" className="text-xs">
						{az.tasks.taskDescription}
					</Label>
					<Input
						id="task-desc"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={isFixed ? undefined : az.tasks.estimatedEffortHint}
					/>
				</div>
				{busyMessage && (
					<p className="text-xs text-destructive">{busyMessage}</p>
				)}
				<Button
					type="button"
					size="sm"
					disabled={!canSubmit}
					onClick={() => {
						if (!selectedAssignee) return;
						createMutation.mutate({
							assigneeId: selectedAssignee.id,
							startsAt: effectiveStarts,
							endsAt: effectiveEnds,
							scheduleType,
							estimatedMinutes:
								!isFixed && estimatedMinutes !== ""
									? Number(estimatedMinutes)
									: undefined,
							allowOverlap: isFixed && allowOverlap ? true : undefined,
						});
					}}
				>
					{createMutation.isPending ? az.tasks.saving : az.tasks.schedule}
				</Button>
			</div>
		</div>
	);
}

function scheduleTypeLabel(t: IncidentAssigneeTaskScheduleType) {
	return t === "WINDOW" ? az.tasks.typeWindow : az.tasks.typeFixed;
}

export function IncidentTaskList({
	tasks,
	canManage,
	onCancel,
}: {
	tasks: IncidentAssigneeTask[];
	canManage: boolean;
	onCancel: () => void;
}) {
	const cancelMutation = useMutation({
		mutationFn: async (taskId: string) => {
			await api.delete(`/incident-tasks/${taskId}`);
		},
		onSuccess: onCancel,
	});

	if (tasks.length === 0) {
		return <p className="text-sm text-muted-foreground">{az.tasks.empty}</p>;
	}

	return (
		<ul className="space-y-2">
			{tasks.map((task) => {
				const st = task.scheduleType ?? "FIXED";
				return (
					<li
						key={task.id}
						className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-sm"
					>
						<div className="flex flex-wrap items-center gap-2">
							<p className="font-medium text-foreground">{task.title}</p>
							<span
								className={cn(
									"rounded-full px-2 py-0.5 text-[10px] font-semibold",
									st === "WINDOW"
										? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
										: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
								)}
							>
								{scheduleTypeLabel(st)}
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							{task.assignee.name} ·{" "}
							{formatBakuDateTime(new Date(task.startsAt))}
							{" — "}
							{formatBakuDateTime(new Date(task.endsAt))}
						</p>
						{task.description && (
							<p className="mt-1 text-xs text-foreground/80">
								{task.description}
							</p>
						)}
						{canManage &&
							task.status !== "CANCELLED" &&
							task.status !== "COMPLETED" && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="mt-2 h-7 text-xs text-destructive"
									disabled={cancelMutation.isPending}
									onClick={() => cancelMutation.mutate(task.id)}
								>
									{az.tasks.cancel}
								</Button>
							)}
					</li>
				);
			})}
		</ul>
	);
}
