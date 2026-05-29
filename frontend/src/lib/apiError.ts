import axios from "axios";

export function isApiUnreachable(error: unknown): boolean {
	if (!axios.isAxiosError(error)) return false;
	if (error.response) return false;
	return (
		error.code === "ERR_NETWORK" ||
		error.code === "ECONNREFUSED" ||
		error.message === "Network Error"
	);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
	if (isApiUnreachable(error)) {
		return fallback;
	}
	if (axios.isAxiosError(error) && error.response?.status === 401) {
		return fallback;
	}
	return fallback;
}
