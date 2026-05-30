import { useEffect, useMemo, useState } from 'react';
import { format, setHours, setMinutes, startOfDay } from 'date-fns';
import { az as azLocale } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { az } from '@/i18n/az';

const timeSelectClassName =
	'flex h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export type DateTimePickerProps = {
	value?: Date;
	onChange?: (value: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	/** Raise above sheets (default matches map header popovers). */
	popoverClassName?: string;
};

function parseIsoDate(value: string | undefined): Date | undefined {
	if (!value?.trim()) return undefined;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? undefined : d;
}

export function isoStringToDate(value: string | undefined): Date | undefined {
	return parseIsoDate(value);
}

export function dateToIsoString(value: Date | undefined): string {
	return value ? value.toISOString() : '';
}

export function DateTimePicker({
	value,
	onChange,
	placeholder = az.map.pickDateTime,
	className,
	popoverClassName,
}: DateTimePickerProps) {
	const [open, setOpen] = useState(false);
	const [hour, setHour] = useState(() =>
		value ? String(value.getHours()).padStart(2, '0') : '09',
	);
	const [minute, setMinute] = useState(() =>
		value ? String(value.getMinutes()).padStart(2, '0') : '00',
	);

	useEffect(() => {
		if (!value) return;
		setHour(String(value.getHours()).padStart(2, '0'));
		setMinute(String(value.getMinutes()).padStart(2, '0'));
	}, [value]);

	const hours = useMemo(
		() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
		[],
	);
	const minutes = useMemo(
		() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
		[],
	);

	const applyTime = (base: Date, h: string, m: string): Date => {
		const parsedH = Number.parseInt(h, 10);
		const parsedM = Number.parseInt(m, 10);
		return setMinutes(
			setHours(base, Number.isNaN(parsedH) ? 9 : parsedH),
			Number.isNaN(parsedM) ? 0 : parsedM,
		);
	};

	const handleDaySelect = (day: Date | undefined) => {
		if (!day) {
			onChange?.(undefined);
			return;
		}
		onChange?.(applyTime(day, hour, minute));
	};

	const handleTimeChange = (nextHour: string, nextMinute: string) => {
		setHour(nextHour);
		setMinute(nextMinute);
		const base = value ?? startOfDay(new Date());
		onChange?.(applyTime(value ?? base, nextHour, nextMinute));
	};

	const label =
		value != null
			? format(value, 'dd MMM yyyy, HH:mm', { locale: azLocale })
			: placeholder;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					id="create-planned-response"
					className={cn(
						'h-9 w-full justify-start gap-2 px-3 text-left font-normal',
						!value && 'text-muted-foreground',
						className,
					)}
				>
					<CalendarIcon className="h-4 w-4 shrink-0" />
					<span className="truncate">{label}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className={cn('w-auto p-0', popoverClassName)}
				align="start"
			>
				<Calendar
					mode="single"
					selected={value}
					onSelect={handleDaySelect}
					defaultMonth={value}
					locale={azLocale}
				/>
				<div className="space-y-2 border-t px-3 py-3">
					<div className="flex gap-2">
						<div className="min-w-0 flex-1 space-y-1">
							<Label className="text-xs text-muted-foreground">
								{az.map.dateTimeHour}
							</Label>
							<select
								className={timeSelectClassName}
								value={hour}
								onChange={(e) => handleTimeChange(e.target.value, minute)}
							>
								{hours.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>
						<div className="min-w-0 flex-1 space-y-1">
							<Label className="text-xs text-muted-foreground">
								{az.map.dateTimeMinute}
							</Label>
							<select
								className={timeSelectClassName}
								value={minute}
								onChange={(e) => handleTimeChange(hour, e.target.value)}
							>
								{minutes.map((m) => (
									<option key={m} value={m}>
										{m}
									</option>
								))}
							</select>
						</div>
					</div>
					{value && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 w-full"
							onClick={() => {
								onChange?.(undefined);
								setOpen(false);
							}}
						>
							{az.map.clearDateTime}
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
