import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { User, UserAccess } from "@/types";

type MeResponse = {
	id: string;
	email: string;
	name: string;
	roleKey: string;
	roleName?: string;
	department?: string | null;
	phone?: string | null;
	organization?: User["organization"];
	access: UserAccess;
};

/** Refreshes permissions and role from the server (fixes stale localStorage after deploy). */
export function useAuthSessionRefresh() {
	const token = useAuthStore((s) => s.token);
	const setAuth = useAuthStore((s) => s.setAuth);

	const meQuery = useQuery({
		queryKey: ["auth", "me"],
		queryFn: async () => {
			const res = await api.get<MeResponse>("/auth/me");
			return res.data;
		},
		enabled: Boolean(token),
		staleTime: 60_000,
		retry: 1,
	});

	useEffect(() => {
		if (!meQuery.data || !token) return;
		const data = meQuery.data;
		setAuth(
			token,
			{
				id: data.id,
				email: data.email,
				name: data.name,
				roleKey: data.roleKey,
				roleName: data.roleName,
				department: data.department,
				organization: data.organization ?? null,
			},
			data.access,
		);
	}, [meQuery.data, token, setAuth]);
}
