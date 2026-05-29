import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Motion, spring } from "react-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = { stiffness: 420, damping: 38 };

function drawerTravelPx() {
	if (typeof window === "undefined") return 448;
	return Math.min(window.innerWidth, 448);
}

interface SlideDrawerProps<T> {
	item: T | null;
	onClose: () => void;
	render: (item: T) => ReactNode;
	className?: string;
	panelStyle?: CSSProperties;
	getPanelStyle?: (item: T) => CSSProperties | undefined;
}

export function SlideDrawer<T>({
	item,
	onClose,
	render,
	className,
	panelStyle,
	getPanelStyle,
}: SlideDrawerProps<T>) {
	const open = item != null;
	const [retained, setRetained] = useState<T | null>(null);
	const travelRef = useRef(drawerTravelPx());

	const displayItem = item ?? retained;

	useEffect(() => {
		if (item != null) {
			setRetained(item);
		}
	}, [item]);

	useEffect(() => {
		travelRef.current = drawerTravelPx();
	}, [open, displayItem]);

	const handleRest = useCallback(() => {
		if (item == null) {
			setRetained(null);
		}
	}, [item]);

	useEffect(() => {
		if (item == null) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [item, onClose]);

	if (displayItem == null || typeof document === "undefined") {
		return null;
	}

	const travel = travelRef.current;

	return createPortal(
		<Motion
			key="incident-slide-drawer"
			defaultStyle={{ x: travel }}
			style={{ x: spring(open ? 0 : travel, SPRING) }}
			onRest={handleRest}
		>
			{({ x }) => (
				<aside
					role="dialog"
					aria-modal={false}
					aria-hidden={!open}
					className={cn(
						"fixed inset-y-0 right-0 z-[1100] flex w-full max-w-md flex-col border-l bg-background shadow-xl",
						className,
					)}
					style={{
						transform: `translate3d(${x}px, 0, 0)`,
						willChange: "transform",
						pointerEvents: open ? "auto" : "none",
						...panelStyle,
						...getPanelStyle?.(displayItem),
					}}
				>
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						<X className="h-4 w-4" />
						<span className="sr-only">Bağla</span>
					</button>
					{render(displayItem)}
				</aside>
			)}
		</Motion>,
		document.body,
	);
}
