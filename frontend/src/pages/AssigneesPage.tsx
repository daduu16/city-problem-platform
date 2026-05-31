import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type {
	Category,
	CategoryAssignee,
	CategoryAssigneeKind,
	Organization,
} from "@/types";
import { az } from "@/i18n/az";
import { buildDbCategoryTree } from "@/lib/adminCategoryTree";
import { CategoryTreeView } from "@/components/shared/CategoryTreeView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	buildAssigneePayload,
	formatAssigneeApiError,
	resolveLeafCategoryIds,
} from "@/lib/assigneeForm";
import { formatAssigneeLabel } from "@/lib/assigneeLabel";
import { cn } from "@/lib/utils";
import { ExecutorAvailabilityTab } from "@/components/executors/ExecutorAvailabilityTab";

type DetailTab = "profile" | "availability";

type AssigneeForm = {
	kind: CategoryAssigneeKind;
	name: string;
	description: string;
	contactEmail: string;
	contactPhone: string;
	organizationId: string;
	isActive: boolean;
};

const emptyForm = (): AssigneeForm => ({
	kind: "TEAM",
	name: "",
	description: "",
	contactEmail: "",
	contactPhone: "",
	organizationId: "",
	isActive: true,
});

function assigneeToForm(a: CategoryAssignee): AssigneeForm {
	return {
		kind: a.kind,
		name: a.name,
		description: a.description ?? "",
		contactEmail: a.contactEmail ?? "",
		contactPhone: a.contactPhone ?? "",
		organizationId: a.organization?.id ?? "",
		isActive: a.isActive,
	};
}

export function AssigneesPage() {
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [form, setForm] = useState<AssigneeForm>(emptyForm);
	const [categoryIds, setCategoryIds] = useState<string[]>([]);
	const [detailTab, setDetailTab] = useState<DetailTab>("profile");

	const assigneesQuery = useQuery({
		queryKey: ["assignees"],
		queryFn: async () => {
			const res = await api.get<CategoryAssignee[]>("/assignees");
			return res.data;
		},
	});

	const categoriesQuery = useQuery({
		queryKey: ["assignees", "categories"],
		queryFn: async () => {
			const res = await api.get<Category[]>("/assignees/categories");
			return res.data;
		},
	});

	const orgsQuery = useQuery({
		queryKey: ["assignees", "organizations"],
		queryFn: async () => {
			const res = await api.get<Organization[]>("/assignees/organizations");
			return res.data;
		},
	});

	const selected = assigneesQuery.data?.find((a) => a.id === selectedId);

	useEffect(() => {
		if (isCreating) {
			setForm(emptyForm());
			setCategoryIds([]);
			return;
		}
		if (selected) {
			setForm(assigneeToForm(selected));
			setCategoryIds(selected.categories?.map((c) => c.category.id) ?? []);
		}
	}, [selected, isCreating]);

	const categoryTree = useMemo(
		() => buildDbCategoryTree(categoriesQuery.data ?? []),
		[categoriesQuery.data],
	);

	const checkedKeys = useMemo(() => {
		const map: Record<string, boolean> = {};
		for (const id of categoryIds) map[id] = true;
		return map;
	}, [categoryIds]);

	const leafCategoryIds = useMemo(
		() => resolveLeafCategoryIds(categoriesQuery.data ?? [], categoryIds),
		[categoriesQuery.data, categoryIds],
	);

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ["assignees"] });
	};

	const createMutation = useMutation({
		mutationFn: async () => {
			const res = await api.post<CategoryAssignee>(
				"/assignees",
				buildAssigneePayload(form, leafCategoryIds),
			);
			return res.data;
		},
		onSuccess: (created) => {
			invalidate();
			setIsCreating(false);
			setSelectedId(created.id);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (!selectedId) return;
			const payload = buildAssigneePayload(form, leafCategoryIds);
			await api.patch(`/assignees/${selectedId}`, {
				kind: payload.kind,
				name: payload.name,
				description: form.description.trim() || null,
				contactEmail: form.contactEmail.trim() || null,
				contactPhone: form.contactPhone.trim() || null,
				organizationId: form.organizationId.trim() || null,
				isActive: payload.isActive,
			});
			await api.put(`/assignees/${selectedId}/categories`, {
				categoryIds: leafCategoryIds,
			});
		},
		onSuccess: invalidate,
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/assignees/${id}`);
		},
		onSuccess: () => {
			invalidate();
			setSelectedId(null);
			setIsCreating(false);
		},
	});

	const editing = isCreating || Boolean(selected);
	const saving = createMutation.isPending || updateMutation.isPending;

	const saveErrorMessage = useMemo(() => {
		const err = createMutation.error ?? updateMutation.error;
		if (!err) return null;
		return formatAssigneeApiError(err) || az.executors.saveError;
	}, [createMutation.error, updateMutation.error]);

	if (assigneesQuery.isLoading) {
		return <Skeleton className="m-6 h-96 w-full" />;
	}

	return (
		<div className="w-full min-w-0 p-6">
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
				<div>
					<h2 className="text-2xl font-semibold">{az.executors.title}</h2>
					<p className="text-sm text-muted-foreground">
						{az.executors.subtitle}
					</p>
				</div>
				<Button
					type="button"
					size="sm"
					className="gap-1.5"
					onClick={() => {
						setIsCreating(true);
						setSelectedId(null);
					}}
				>
					<Plus className="h-4 w-4" />
					{az.executors.add}
				</Button>
			</header>

			<div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
				<Card>
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-base">
							{az.executors.listTitle}
						</CardTitle>
					</CardHeader>
					<CardContent className="max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto p-3 pt-0">
						{assigneesQuery.data?.length === 0 && (
							<p className="text-sm text-muted-foreground">
								{az.executors.empty}
							</p>
						)}
						{assigneesQuery.data?.map((a) => (
							<button
								key={a.id}
								type="button"
								onClick={() => {
									setIsCreating(false);
									setSelectedId(a.id);
									setDetailTab("profile");
								}}
								className={cn(
									"w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
									selectedId === a.id && !isCreating
										? "border-primary bg-primary/5"
										: "border-border hover:bg-muted/50",
									!a.isActive && "opacity-60",
								)}
							>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 shrink-0 text-muted-foreground" />
									<span className="font-medium">{formatAssigneeLabel(a)}</span>
								</div>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{a.kind === "TEAM"
										? az.executors.kindTeam
										: az.executors.kindPerson}
									{" · "}
									{az.executors.categoryCount(a.categories?.length ?? 0)}
								</p>
							</button>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-3 pb-2">
						<CardTitle className="text-base">
							{isCreating
								? az.executors.formCreate
								: selected
									? selected.name
									: az.executors.formSelect}
						</CardTitle>
					</CardHeader>
					<CardContent className="p-3 pt-0">
						{!editing ? (
							<p className="text-sm text-muted-foreground">
								{az.executors.formSelect}
							</p>
						) : (
							<div className="space-y-4">
								{!isCreating && selectedId && (
									<div className="flex gap-1 border-b pb-2">
										<Button
											type="button"
											size="sm"
											variant={detailTab === "profile" ? "default" : "ghost"}
											onClick={() => setDetailTab("profile")}
										>
											{az.availability.profileTab}
										</Button>
										<Button
											type="button"
											size="sm"
											variant={
												detailTab === "availability" ? "default" : "ghost"
											}
											onClick={() => setDetailTab("availability")}
										>
											{az.availability.tab}
										</Button>
									</div>
								)}

								{!isCreating && selectedId && detailTab === "availability" ? (
									<ExecutorAvailabilityTab assigneeId={selectedId} />
								) : (
									<div className="space-y-5">
										<div className="grid gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="assignee-kind">
													{az.executors.kind}
												</Label>
												<select
													id="assignee-kind"
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
													value={form.kind}
													onChange={(e) =>
														setForm((f) => ({
															...f,
															kind: e.target.value as CategoryAssigneeKind,
														}))
													}
												>
													<option value="TEAM">{az.executors.kindTeam}</option>
													<option value="PERSON">
														{az.executors.kindPerson}
													</option>
												</select>
											</div>
											<div className="space-y-2">
												<Label htmlFor="assignee-name">
													{az.executors.name}
												</Label>
												<Input
													id="assignee-name"
													value={form.name}
													onChange={(e) =>
														setForm((f) => ({ ...f, name: e.target.value }))
													}
												/>
											</div>
											<div className="space-y-2 sm:col-span-2">
												<Label htmlFor="assignee-desc">
													{az.executors.description}
												</Label>
												<Input
													id="assignee-desc"
													value={form.description}
													onChange={(e) =>
														setForm((f) => ({
															...f,
															description: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="assignee-email">
													{az.executors.email}
												</Label>
												<Input
													id="assignee-email"
													type="email"
													value={form.contactEmail}
													onChange={(e) =>
														setForm((f) => ({
															...f,
															contactEmail: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="assignee-phone">
													{az.executors.phone}
												</Label>
												<Input
													id="assignee-phone"
													value={form.contactPhone}
													onChange={(e) =>
														setForm((f) => ({
															...f,
															contactPhone: e.target.value,
														}))
													}
												/>
											</div>
											<div className="space-y-2 sm:col-span-2">
												<Label htmlFor="assignee-org">
													{az.executors.organization}
												</Label>
												<select
													id="assignee-org"
													className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
													value={form.organizationId}
													onChange={(e) =>
														setForm((f) => ({
															...f,
															organizationId: e.target.value,
														}))
													}
												>
													<option value="">—</option>
													{orgsQuery.data?.map((org) => (
														<option key={org.id} value={org.id}>
															{org.name}
														</option>
													))}
												</select>
											</div>
											<div className="flex items-center gap-2 sm:col-span-2">
												<Checkbox
													id="assignee-active"
													checked={form.isActive}
													onCheckedChange={(v) =>
														setForm((f) => ({ ...f, isActive: v === true }))
													}
												/>
												<Label
													htmlFor="assignee-active"
													className="font-normal"
												>
													{az.executors.active}
												</Label>
											</div>
										</div>

										<div>
											<p className="mb-2 text-sm font-medium">
												{az.executors.categories}
											</p>
											<div className="max-h-72 overflow-y-auto rounded-md border p-3">
												{categoriesQuery.isLoading ? (
													<Skeleton className="h-40 w-full" />
												) : categoryTree.length === 0 ? (
													<p className="text-sm text-muted-foreground">—</p>
												) : (
													<CategoryTreeView
														mode="checkbox"
														tree={categoryTree}
														emptyMessage="—"
														defaultExpanded
														checkedKeys={checkedKeys}
														onToggleKey={(id) => {
															setCategoryIds((prev) =>
																prev.includes(id)
																	? prev.filter((x) => x !== id)
																	: [...prev, id],
															);
														}}
														onToggleKeys={(ids, checked) => {
															setCategoryIds((prev) => {
																const set = new Set(prev);
																for (const id of ids) {
																	if (checked) set.add(id);
																	else set.delete(id);
																}
																return [...set];
															});
														}}
													/>
												)}
											</div>
										</div>

										{saveErrorMessage && (
											<p className="text-sm text-destructive">
												{saveErrorMessage}
											</p>
										)}

										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												disabled={!form.name.trim() || saving}
												onClick={() => {
													if (isCreating) createMutation.mutate();
													else updateMutation.mutate();
												}}
											>
												{saving ? az.executors.saving : az.executors.save}
											</Button>
											{!isCreating && selectedId && (
												<Button
													type="button"
													variant="destructive"
													size="default"
													className="gap-1.5"
													disabled={deleteMutation.isPending}
													onClick={() => {
														if (window.confirm(az.executors.deleteConfirm)) {
															deleteMutation.mutate(selectedId);
														}
													}}
												>
													<Trash2 className="h-4 w-4" />
													{az.executors.delete}
												</Button>
											)}
										</div>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
