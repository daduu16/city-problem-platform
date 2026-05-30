import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { az } from '@/i18n/az';
import { useCreatableCategories } from '@/hooks/useCreatableCategories';
import { useMapStore } from '@/stores/mapStore';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	DateTimePicker,
	isoStringToDate,
} from '@/components/ui/date-time-picker';
import { cn } from '@/lib/utils';

const selectClassName =
	'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const schema = z.object({
	title: z.string().min(3, az.map.createTitleMin),
	description: z.string().min(5, az.map.createDescriptionMin),
	parentCategoryId: z.string().uuid({ message: az.map.createCategoryRequired }),
	subcategoryId: z.string().optional(),
	priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
	address: z.string().optional(),
	plannedResponseAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type NominatimResult = {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
};

function FieldGroup({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('min-w-0 space-y-2 px-1 py-0.5', className)}>{children}</div>
	);
}

export function CreateIncidentSheet() {
	const queryClient = useQueryClient();
	const mode = useMapStore((s) => s.incidentCreateMode);
	const location = useMapStore((s) => s.incidentCreateLocation);
	const cancel = useMapStore((s) => s.cancelIncidentCreate);
	const repick = useMapStore((s) => s.reopenIncidentCreatePicker);
	const setIncidentCreateLocation = useMapStore(
		(s) => s.setIncidentCreateLocation,
	);
	const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
	const [addressLoading, setAddressLoading] = useState(false);
	const [addressError, setAddressError] = useState<string | null>(null);

	const open = mode === 'form' && location != null;

	const {
		parents,
		getSubcategories,
		isLoading: categoriesLoading,
	} = useCreatableCategories(open);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		setError,
		clearErrors,
		control,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: {
			priority: 'MEDIUM',
			parentCategoryId: '',
			subcategoryId: '',
			plannedResponseAt: '',
		},
	});

	const parentCategoryId = watch('parentCategoryId');
	const addressValue = watch('address');
	const subcategories = useMemo(
		() => (parentCategoryId ? getSubcategories(parentCategoryId) : []),
		[parentCategoryId, getSubcategories],
	);

	useEffect(() => {
		if (!open) reset();
	}, [open, reset]);

	useEffect(() => {
		if (!open) {
			setAddressResults([]);
			setAddressLoading(false);
			setAddressError(null);
		}
	}, [open]);

	useEffect(() => {
		setValue('subcategoryId', '');
		clearErrors('subcategoryId');
	}, [parentCategoryId, setValue, clearErrors]);

	useEffect(() => {
		const query = addressValue?.trim() ?? '';
		if (!open || query.length < 3) {
			setAddressResults([]);
			setAddressLoading(false);
			setAddressError(null);
			return;
		}

		const controller = new AbortController();
		const timeoutId = window.setTimeout(async () => {
			try {
				setAddressLoading(true);
				setAddressError(null);

				const params = new URLSearchParams({
					format: 'jsonv2',
					addressdetails: '1',
					limit: '5',
					accept_language: 'az',
					countrycodes: 'az',
					q: query,
				});
				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?${params.toString()}`,
					{
						signal: controller.signal,
						headers: {
							'Accept-Language': 'az',
						},
					},
				);
				if (!res.ok) {
					throw new Error(`nominatim_http_${res.status}`);
				}
				const data = (await res.json()) as NominatimResult[];
				setAddressResults(data);
			} catch (error) {
				if (controller.signal.aborted) return;
				setAddressResults([]);
				setAddressError(
					error instanceof Error ? error.message : 'nominatim_request_failed',
				);
			} finally {
				if (!controller.signal.aborted) {
					setAddressLoading(false);
				}
			}
		}, 350);

		return () => {
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [addressValue, open]);

	const noCategories = !categoriesLoading && parents.length === 0;

	const onOpenChange = (next: boolean) => {
		if (!next) cancel();
	};

	const createMutation = useMutation({
		mutationFn: async (data: FormData) => {
			if (!location) throw new Error('Location required');

			if (subcategories.length > 0 && !data.subcategoryId) {
				throw new Error('subcategory_required');
			}

			const plannedAt = data.plannedResponseAt?.trim();
			const deadline =
				plannedAt && plannedAt.length > 0
					? new Date(plannedAt).toISOString()
					: undefined;

			await api.post('/incidents', {
				title: data.title,
				description: data.description,
				categoryId: data.parentCategoryId,
				subcategoryId: data.subcategoryId || undefined,
				priority: data.priority,
				address: data.address,
				deadline,
				lat: location.lat,
				lng: location.lng,
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ['incidents'] });
			void queryClient.invalidateQueries({ queryKey: ['analytics'] });
			cancel();
		},
	});

	const onSubmit = handleSubmit((data) => {
		if (subcategories.length > 0 && !data.subcategoryId) {
			setError('subcategoryId', {
				message: az.map.createSubcategoryRequired,
			});
			return;
		}
		createMutation.mutate(data);
	});

	const handleAddressResultSelect = (item: NominatimResult) => {
		const lat = Number(item.lat);
		const lng = Number(item.lon);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
		setValue('address', item.display_name, { shouldDirty: true });
		setAddressResults([]);
		setAddressError(null);
		setIncidentCreateLocation(lat, lng);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
			>
				<div className="shrink-0 space-y-4 border-b px-6 pb-4 pt-6">
					<SheetHeader className="space-y-1 text-left">
						<SheetTitle>{az.map.createTitle}</SheetTitle>
						<SheetDescription>{az.map.createSubtitle}</SheetDescription>
					</SheetHeader>

					{location && (
						<div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
							<p className="font-medium text-foreground">
								{az.map.createLocationLabel}
							</p>
							<p className="mt-1 tabular-nums text-muted-foreground">
								{location.lat.toFixed(5)}, {location.lng.toFixed(5)}
							</p>
							<Button
								type="button"
								variant="link"
								size="sm"
								className="mt-1 h-auto p-0"
								onClick={repick}
							>
								<MapPin className="mr-1 h-3.5 w-3.5" />
								{az.map.createRepickLocation}
							</Button>
						</div>
					)}
				</div>

				{noCategories ? (
					<p className="px-6 py-4 text-sm text-destructive">
						{az.map.createNoCategories}
					</p>
				) : (
					<form
						onSubmit={onSubmit}
						className="flex min-h-0 flex-1 flex-col overflow-hidden"
					>
						<div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
							<div className="flex flex-col gap-4">
								<FieldGroup>
									<Label htmlFor="create-title">{az.map.createFieldTitle}</Label>
									<Input id="create-title" {...register('title')} />
									{errors.title && (
										<p className="text-xs text-destructive">
											{errors.title.message}
										</p>
									)}
								</FieldGroup>

								<FieldGroup>
									<Label htmlFor="create-description">
										{az.map.createFieldDescription}
									</Label>
									<Textarea
										id="create-description"
										rows={4}
										{...register('description')}
									/>
									{errors.description && (
										<p className="text-xs text-destructive">
											{errors.description.message}
										</p>
									)}
								</FieldGroup>

								<FieldGroup>
									<Label htmlFor="create-parent-category">
										{az.map.createFieldCategory}
									</Label>
									<select
										id="create-parent-category"
										className={selectClassName}
										disabled={categoriesLoading}
										{...register('parentCategoryId')}
									>
										<option value="">
											{categoriesLoading
												? az.map.createCategoriesLoading
												: az.map.createCategoryPlaceholder}
										</option>
										{parents.map((c) => (
											<option key={c.id} value={c.id}>
												{c.label}
											</option>
										))}
									</select>
									{errors.parentCategoryId && (
										<p className="text-xs text-destructive">
											{errors.parentCategoryId.message}
										</p>
									)}
								</FieldGroup>

								{parentCategoryId && subcategories.length > 0 && (
									<FieldGroup>
										<Label htmlFor="create-subcategory">
											{az.map.createFieldSubcategory}
										</Label>
										<select
											id="create-subcategory"
											className={selectClassName}
											{...register('subcategoryId')}
										>
											<option value="">{az.map.createSubcategoryPlaceholder}</option>
											{subcategories.map((c) => (
												<option key={c.id} value={c.id}>
													{c.label}
												</option>
											))}
										</select>
										{errors.subcategoryId && (
											<p className="text-xs text-destructive">
												{errors.subcategoryId.message}
											</p>
										)}
									</FieldGroup>
								)}

								<FieldGroup>
									<Label htmlFor="create-priority">
										{az.map.createFieldPriority}
									</Label>
									<select
										id="create-priority"
										className={selectClassName}
										{...register('priority')}
									>
										<option value="LOW">{az.priority.LOW}</option>
										<option value="MEDIUM">{az.priority.MEDIUM}</option>
										<option value="HIGH">{az.priority.HIGH}</option>
										<option value="CRITICAL">{az.priority.CRITICAL}</option>
									</select>
								</FieldGroup>

								<FieldGroup>
									<Label htmlFor="create-planned-response">
										{az.map.createFieldPlannedResponse}
									</Label>
									<p className="text-xs text-muted-foreground">
										{az.map.createFieldPlannedResponseHint}
									</p>
									<Controller
										name="plannedResponseAt"
										control={control}
										render={({ field }) => (
											<DateTimePicker
												value={isoStringToDate(field.value)}
												onChange={(d) => field.onChange(d?.toISOString() ?? '')}
												placeholder={az.map.pickDateTime}
												popoverClassName="z-[1200]"
											/>
										)}
									/>
								</FieldGroup>

								<FieldGroup>
									<Label htmlFor="create-address">{az.map.createFieldAddress}</Label>
									<Input
										id="create-address"
										placeholder={az.map.addressSearchPlaceholder}
										{...register('address')}
									/>
									<p className="text-xs text-muted-foreground">
										{az.map.addressSearchHint}
									</p>
									{addressLoading && (
										<p className="text-xs text-muted-foreground">
											{az.map.addressSearchLoading}
										</p>
									)}
									{addressError && (
										<p className="text-xs text-destructive">
											{az.map.addressSearchError}
										</p>
									)}
									{!addressLoading &&
										!addressError &&
										(addressValue?.trim()?.length ?? 0) >= 3 &&
										addressResults.length === 0 && (
											<p className="text-xs text-muted-foreground">
												{az.map.addressSearchEmpty}
											</p>
										)}
									{addressResults.length > 0 && (
										<div className="max-h-44 overflow-y-auto rounded-md border bg-background">
											<ul className="divide-y">
												{addressResults.map((item) => (
													<li key={item.place_id}>
														<button
															type="button"
															className="w-full px-3 py-2 text-left text-xs transition hover:bg-muted"
															onClick={() => handleAddressResultSelect(item)}
														>
															{item.display_name}
														</button>
													</li>
												))}
											</ul>
										</div>
									)}
								</FieldGroup>

								{createMutation.isError &&
									createMutation.error instanceof Error &&
									createMutation.error.message !== 'subcategory_required' && (
										<p className="px-1 text-sm text-destructive">
											{az.map.createError}
										</p>
									)}
							</div>
						</div>

						<div className="flex shrink-0 gap-2 border-t bg-background px-6 py-4">
							<Button
								type="submit"
								disabled={
									createMutation.isPending || categoriesLoading || noCategories
								}
							>
								{createMutation.isPending
									? az.map.createSubmitting
									: az.map.createSubmit}
							</Button>
							<Button type="button" variant="outline" onClick={cancel}>
								{az.map.createCancel}
							</Button>
						</div>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
