import type { Category } from '@/types';
import type { CategoryTreeNode } from '@/lib/categoryTree';

/** Build a hierarchy from API categories (parentId) for admin access UI. */
export function buildDbCategoryTree(categories: Category[]): CategoryTreeNode[] {
	const byParent = new Map<string | null, Category[]>();
	for (const c of categories) {
		const pid = c.parentId ?? null;
		const list = byParent.get(pid) ?? [];
		list.push(c);
		byParent.set(pid, list);
	}

	const sortByName = (a: Category, b: Category) =>
		a.name.localeCompare(b.name, 'az');

	function walk(parentId: string | null): CategoryTreeNode[] {
		return (byParent.get(parentId) ?? [])
			.sort(sortByName)
			.map((c) => {
				const children = walk(c.id);
				if (children.length === 0) {
					return { key: c.id, label: c.name, categoryKey: c.key };
				}
				return {
					key: c.id,
					label: c.name,
					categoryKey: c.key,
					children,
				};
			});
	}

	return walk(null);
}
