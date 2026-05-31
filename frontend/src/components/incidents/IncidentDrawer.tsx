import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { az as azLocale } from "date-fns/locale";
import { api } from "@/lib/api";
import type { IncidentDetail } from "@/types";
import { az } from "@/i18n/az";
import { formatCategory } from "@/lib/format";
import { getCitizenReportTotal } from "@/lib/citizenReports";
import { IncidentTimeline } from "@/components/incidents/IncidentTimeline";
import { ReportMediaPopover } from "@/components/incidents/ReportMediaPopover";
import { hasReportMedia } from "@/lib/normalizeReportMedia";
import { getStatusStyle } from "@/lib/incidentStyles";
import { DistrictStatusBadge } from "./DistrictStatusBadge";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { isApiUnreachable } from "@/lib/apiError";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";
import {
	IncidentTaskList,
	IncidentTaskPlanner,
} from "@/components/incidents/IncidentTaskPlanner";

interface Props {
	incidentId: string | null;
	onClose: () => void;
}

const drawerSectionTitle =
	"text-sm font-semibold tracking-tight text-foreground";
const drawerSectionHint = "text-xs leading-relaxed text-foreground/70";
const drawerMetaText = "text-xs text-foreground/75";

function IncidentDrawerPanel({ incidentId }: { incidentId: string }) {
	const queryClient = useQueryClient();
	const canAssign = useAuthStore((s) => s.can("assign_task"));
	const [showPlanner, setShowPlanner] = useState(false);

	const {
		data: incident,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ["incidents", incidentId],
		queryFn: async () => {
			const res = await api.get<IncidentDetail>(`/incidents/${incidentId}`);
			return res.data;
		},
	});

	const commentMutation = useMutation({
		mutationFn: async (body: string) => {
			await api.post(`/incidents/${incidentId}/comments`, { body });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["incidents", incidentId] });
		},
	});

	const citizenReportTotal = incident
		? getCitizenReportTotal(incident.reportCount ?? incident.reports.length)
		: 0;
	const uniqueReporters =
		incident && incident.reports.length > 0
			? new Set(incident.reports.map((r) => r.reporter.id)).size
			: 0;

	return (
		<>
			<header
				className="space-y-0 border-b px-6 py-4 text-left"
				style={
					incident
						? {
								background: `linear-gradient(90deg, ${getStatusStyle(incident.status).bg} 0%, transparent 70%)`,
							}
						: undefined
				}
			>
				<h2 className="pr-8 text-left text-lg font-semibold text-foreground">
					{isLoading ? <Skeleton className="h-6 w-3/4" /> : incident?.title}
				</h2>
				{incident && citizenReportTotal > 0 && (
					<p className="mt-1 text-xs text-foreground/70">
						{az.drawer.citizenReportsTitle(citizenReportTotal)}
						{citizenReportTotal > 1
							? ` · ${az.drawer.citizenReportsHint}`
							: null}
					</p>
				)}
			</header>

			{isLoading && (
				<div className="space-y-3 p-6">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			)}

			{isError && !isLoading && (
				<div className="space-y-2 p-6 text-sm text-destructive">
					<p className="font-medium">{az.drawer.loadError}</p>
					<p>
						{isApiUnreachable(error)
							? az.errors.backendUnreachable
							: az.drawer.loadErrorHint}
					</p>
				</div>
			)}

			{incident && (
				<ScrollArea className="flex-1">
					<div className="space-y-6 p-6">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge status={incident.status} size="md" />
							<PriorityBadge priority={incident.priority} />
							<DistrictStatusBadge status={incident.districtStatus} />
							<Badge variant="secondary">
								{formatCategory(incident.category)}
							</Badge>
						</div>

						<p className="text-sm leading-relaxed text-foreground/90">
							{incident.description}
						</p>

						{incident.address && (
							<p className={drawerMetaText}>📍 {incident.address}</p>
						)}

						{incident.assignedTo && (
							<p className="text-sm text-foreground">
								<span className="font-medium text-foreground/80">
									{az.drawer.assignee}:
								</span>{" "}
								{incident.assignedTo.name}
							</p>
						)}

						{incident.deadline && (
							<p className="text-sm font-medium text-amber-700">
								{az.drawer.deadline}:{" "}
								{format(new Date(incident.deadline), "PPp", {
									locale: azLocale,
								})}
							</p>
						)}

						{incident.reports.length > 0 && (
							<>
								<Separator />
								<section>
									<h4 className={`mb-1 ${drawerSectionTitle}`}>
										{az.drawer.reportsSection}
									</h4>
									<p className={`mb-3 ${drawerSectionHint}`}>
										{az.drawer.reportLocationHint}
									</p>
									<ul className="space-y-3">
										{incident.reports.map((report) => (
											<li
												key={report.id}
												className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5"
											>
												{report.title && (
													<p className="text-xs font-medium text-foreground">
														{report.title}
													</p>
												)}
												<p className="mt-1 text-sm leading-relaxed text-foreground">
													{report.message}
												</p>
												{hasReportMedia(report) && (
													<ReportMediaPopover
														className="mt-2"
														showInlinePreview
														photoUrl={report.photoUrl}
														videoUrl={report.videoUrl}
													/>
												)}
												{(report.address ||
													(report.lat != null && report.lng != null)) && (
													<p className={`mt-2 ${drawerMetaText}`}>
														{report.address ??
															`${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}
													</p>
												)}
												<p className={`mt-2 ${drawerMetaText}`}>
													<span className="font-semibold text-foreground">
														{report.reporter.name}
													</span>
													{" · "}
													{format(new Date(report.createdAt), "PPp", {
														locale: azLocale,
													})}
												</p>
											</li>
										))}
									</ul>
								</section>
							</>
						)}

						<Separator />

						<section>
							<div className="mb-3 flex items-center justify-between gap-2">
								<h4 className={drawerSectionTitle}>{az.tasks.sectionTitle}</h4>
								{canAssign && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setShowPlanner((v) => !v)}
									>
										{showPlanner ? az.tasks.hidePlanner : az.tasks.planTask}
									</Button>
								)}
							</div>
							<IncidentTaskList
								tasks={incident.assigneeTasks ?? []}
								canManage={canAssign}
								onCancel={() => {
									void queryClient.invalidateQueries({
										queryKey: ["incidents", incidentId],
									});
								}}
							/>
							{canAssign && showPlanner && (
								<div className="mt-3">
									<IncidentTaskPlanner
										incidentId={incidentId}
										categoryId={
											incident.subcategory?.id ?? incident.category.id
										}
										onCreated={() => {
											setShowPlanner(false);
											void queryClient.invalidateQueries({
												queryKey: ["incidents", incidentId],
											});
										}}
									/>
								</div>
							)}
						</section>

						<Separator />

						<section>
							<h4 className={`mb-3 ${drawerSectionTitle}`}>
								{az.drawer.timeline}
							</h4>
							<IncidentTimeline
								history={incident.history}
								reports={incident.reports}
								reporterCount={
									uniqueReporters > 0 ? uniqueReporters : undefined
								}
							/>
						</section>

						<Separator />

						<section>
							<h4 className={`mb-3 ${drawerSectionTitle}`}>
								{az.drawer.comments}
							</h4>
							<p className={`mb-3 ${drawerSectionHint}`}>
								{az.drawer.commentsHint}
							</p>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									const fd = new FormData(e.currentTarget);
									const body = fd.get("body") as string;
									if (body.trim()) commentMutation.mutate(body.trim());
									e.currentTarget.reset();
								}}
								className="space-y-2"
							>
								<Textarea
									name="body"
									rows={3}
									placeholder={az.drawer.commentPlaceholder}
								/>
								<Button
									type="submit"
									size="sm"
									disabled={commentMutation.isPending}
								>
									{az.drawer.postComment}
								</Button>
							</form>
						</section>
					</div>
				</ScrollArea>
			)}
		</>
	);
}

export function IncidentDrawer({ incidentId, onClose }: Props) {
	const queryClient = useQueryClient();

	return (
		<SlideDrawer
			item={incidentId}
			onClose={onClose}
			className="flex flex-col p-0"
			getPanelStyle={(id) => {
				const cached = queryClient.getQueryData<IncidentDetail>([
					"incidents",
					id,
				]);
				if (!cached) return undefined;
				return {
					borderLeftWidth: 4,
					borderLeftColor: getStatusStyle(cached.status).color,
				};
			}}
			render={(id) => <IncidentDrawerPanel incidentId={id} />}
		/>
	);
}
