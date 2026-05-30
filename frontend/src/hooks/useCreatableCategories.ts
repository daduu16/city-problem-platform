import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
	getCreatableParentCategories,
	getCreatableSubcategories,
} from '@/lib/creatableCategories';
import { useAuthStore } from '@/stores/authStore';
import type { Category } from '@/types';

export function useCreatableCategories(enabled = true) {
	const hasMapLayer = useAuthStore((s) => s.hasMapLayer);

	const query = useQuery({
		queryKey: ['categories', 'creatable'],
		queryFn: async () => {
			const res = await api.get<Category[]>('/categories');
			return res.data;
		},
		enabled,
	});

	const parents = useMemo(
		() => getCreatableParentCategories(query.data ?? [], hasMapLayer),
		[query.data, hasMapLayer],
	);

	const getSubcategories = useCallback(
		(parentId: string) =>
			getCreatableSubcategories(parentId, query.data ?? [], hasMapLayer),
		[query.data, hasMapLayer],
	);

	return { ...query, categories: query.data ?? [], parents, getSubcategories };
}
