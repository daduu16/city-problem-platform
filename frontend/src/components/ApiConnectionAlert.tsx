import { AlertCircle, RefreshCw } from "lucide-react";
import { az } from "@/i18n/az";
import { Button } from "@/components/ui/button";

interface Props {
	onRetry?: () => void;
	className?: string;
}

export function ApiConnectionAlert({ onRetry, className }: Props) {
	return (
		<div
			className={
				className ??
				"flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			}
			role="alert"
		>
			<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
			<div className="flex-1 space-y-1">
				<p className="font-medium">{az.errors.backendUnreachableTitle}</p>
				<p className="text-destructive/90">{az.errors.backendUnreachable}</p>
			</div>
			{onRetry && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="shrink-0 border-destructive/40"
					onClick={onRetry}
				>
					<RefreshCw className="mr-1 h-3 w-3" />
					{az.errors.retry}
				</Button>
			)}
		</div>
	);
}
