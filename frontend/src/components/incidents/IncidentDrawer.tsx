import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { az as azLocale } from "date-fns/locale";
import { api } from "@/lib/api";
import type { IncidentDetail } from "@/types";
import { az } from "@/i18n/az";
import { formatCategory, formatHistoryAction } from "@/lib/format";
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
interface Props {
	incidentId: string | null;
	onClose: () => void;
}

function IncidentDrawerPanel({ incidentId }: { incidentId: string }) {
	const queryClient = useQueryClient();

	const { data: incident, isLoading, isError, error } = useQuery({
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

						<p className="text-sm text-muted-foreground">{incident.description}</p>

						{incident.address && (
							<p className="text-xs text-muted-foreground">📍 {incident.address}</p>
						)}

						{incident.assignedTo && (
							<p className="text-sm">
								<span className="text-muted-foreground">{az.drawer.assignee}:</span>{" "}
								{incident.assignedTo.name}
							</p>
						)}

						{incident.deadline && (
							<p className="text-sm font-medium text-amber-500">
								{az.drawer.deadline}:{" "}
								{format(new Date(incident.deadline), "PPp", { locale: azLocale })}
							</p>
						)}

						<Separator />

						<section>
							<h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{az.drawer.timeline}
							</h4>
							<ul className="space-y-3">
								{incident.history.map((h) => (
									<li
										key={h.id}
										className="border-l-2 border-primary pl-3 text-xs"
									>
										<span className="text-foreground">
											{formatHistoryAction(h.actionType)}
										</span>
										{h.newValue && (
											<span className="text-muted-foreground">
												{" "}
												→ {h.newValue}
											</span>
										)}
										<p className="mt-1 text-muted-foreground">
											{h.createdBy.name} ·{" "}
											{format(new Date(h.createdAt), "PPp", {
												locale: azLocale,
											})}
										</p>
									</li>
								))}
							</ul>
						</section>

						<Separator />

						<section>
							<h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{az.drawer.comments}
							</h4>
							<ul className="mb-4 space-y-2">
								{incident.comments.map((c) => (
									<li
										key={c.id}
										className="rounded-lg border bg-muted/50 p-3 text-sm"
									>
										<p>{c.body}</p>
										<p className="mt-1 text-xs text-muted-foreground">
											{c.author.name} ·{" "}
											{format(new Date(c.createdAt), "PPp", {
												locale: azLocale,
											})}
										</p>
									</li>
								))}
							</ul>
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
