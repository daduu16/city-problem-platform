import { canViewCategory } from '@/lib/mapCategories';
import { getMapCategoryLabel } from '@/lib/mapCategoryTree';
import type { Category } from '@/types';

export type CreatableParentOption = {
	id: string;
	key: string;
	label: string;
};

export type CreatableSubcategoryOption = {
	id: string;
	key: string;
	label: string;
};

function isCreatable(
	category: Category,
	hasMapLayer: (accessKey: string) => boolean,
): boolean {
	return canViewCategory(category.key, hasMapLayer);
}

/** Top-level categories that have at least one allowed subcategory. */
export function getCreatableParentCategories(
	categories: Category[],
	hasMapLayer: (accessKey: string) => boolean,
): CreatableParentOption[] {
	return categories
		.filter((c) => !c.parentId)
		.filter((parent) =>
			categories.some(
				(child) =>
					child.parentId === parent.id && isCreatable(child, hasMapLayer),
			),
		)
		.map((parent) => ({
			id: parent.id,
			key: parent.key,
			label: getMapCategoryLabel(parent.key) || parent.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label, 'az'));
}

export function getCreatableSubcategories(
	parentId: string,
	categories: Category[],
	hasMapLayer: (accessKey: string) => boolean,
): CreatableSubcategoryOption[] {
	return categories
		.filter((c) => c.parentId === parentId && isCreatable(c, hasMapLayer))
		.map((c) => ({
			id: c.id,
			key: c.key,
			label: c.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label, 'az'));
}
