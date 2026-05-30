import { getMapCategoryLabel } from '@/lib/mapCategoryTree';

export type CategoryTreeNode = {
  key: string;
  label: string;
  children?: CategoryTreeNode[];
};

/** Full incident category hierarchy (mirrors backend CATEGORY_TREE). */
export const INCIDENT_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    key: 'infrastructure',
    label: getMapCategoryLabel('infrastructure'),
    children: [
      { key: 'facades', label: getMapCategoryLabel('facades') },
      { key: 'sidewalks', label: getMapCategoryLabel('sidewalks') },
      { key: 'curbs', label: getMapCategoryLabel('curbs') },
      { key: 'road_surface', label: getMapCategoryLabel('road_surface') },
      { key: 'asphalt_repair', label: getMapCategoryLabel('asphalt_repair') },
    ],
  },
  {
    key: 'utilities',
    label: getMapCategoryLabel('utilities'),
    children: [
      { key: 'water', label: getMapCategoryLabel('water') },
      { key: 'gas', label: getMapCategoryLabel('gas') },
      { key: 'electricity', label: getMapCategoryLabel('electricity') },
      { key: 'comm_lines', label: getMapCategoryLabel('comm_lines') },
    ],
  },
  {
    key: 'greenery',
    label: getMapCategoryLabel('greenery'),
    children: [
      { key: 'dry_zones', label: getMapCategoryLabel('dry_zones') },
      { key: 'tree_fall', label: getMapCategoryLabel('tree_fall') },
      { key: 'mowing', label: getMapCategoryLabel('mowing') },
    ],
  },
  {
    key: 'weather_emergency',
    label: getMapCategoryLabel('weather_emergency'),
    children: [
      { key: 'floods', label: getMapCategoryLabel('floods') },
      { key: 'ice', label: getMapCategoryLabel('ice') },
      { key: 'storm_damage', label: getMapCategoryLabel('storm_damage') },
    ],
  },
  {
    key: 'sanitation',
    label: getMapCategoryLabel('sanitation'),
    children: [
      { key: 'street_dirt', label: getMapCategoryLabel('street_dirt') },
      { key: 'overflow_bins', label: getMapCategoryLabel('overflow_bins') },
    ],
  },
  {
    key: 'lighting',
    label: getMapCategoryLabel('lighting'),
    children: [
      { key: 'broken_lamps', label: getMapCategoryLabel('broken_lamps') },
      { key: 'dark_areas', label: getMapCategoryLabel('dark_areas') },
    ],
  },
  {
    key: 'parks',
    label: getMapCategoryLabel('parks'),
    children: [
      { key: 'playgrounds', label: getMapCategoryLabel('playgrounds') },
      { key: 'benches', label: getMapCategoryLabel('benches') },
      { key: 'fountains', label: getMapCategoryLabel('fountains') },
    ],
  },
  {
    key: 'advertising',
    label: getMapCategoryLabel('advertising'),
    children: [
      { key: 'billboards', label: getMapCategoryLabel('billboards') },
      { key: 'storefronts', label: getMapCategoryLabel('storefronts') },
      { key: 'fences', label: getMapCategoryLabel('fences') },
    ],
  },
];

export function collectLeafCategoryKeys(nodes: CategoryTreeNode[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    if (node.children?.length) {
      keys.push(...collectLeafCategoryKeys(node.children));
    } else {
      keys.push(node.key);
    }
  }
  return keys;
}

export const ALL_INCIDENT_LEAF_CATEGORY_KEYS = collectLeafCategoryKeys(
  INCIDENT_CATEGORY_TREE,
);

function nodeMatchesQuery(node: CategoryTreeNode, q: string): boolean {
  const haystack = `${node.label} ${node.key}`.toLocaleLowerCase('az');
  return haystack.includes(q);
}

/** Filter tree — keeps branches that match query on parent or any descendant. */
export function filterCategoryTree(
  nodes: CategoryTreeNode[],
  query: string,
): CategoryTreeNode[] {
  const q = query.trim().toLocaleLowerCase('az');
  if (!q) return nodes;

  const walk = (node: CategoryTreeNode): CategoryTreeNode | null => {
    if (node.children?.length) {
      const children = node.children
        .map(walk)
        .filter((n): n is CategoryTreeNode => n != null);
      if (children.length > 0) {
        return { ...node, children };
      }
      if (nodeMatchesQuery(node, q)) {
        return { ...node, children: node.children };
      }
      return null;
    }
    return nodeMatchesQuery(node, q) ? node : null;
  };

  return nodes.map(walk).filter((n): n is CategoryTreeNode => n != null);
}

/** Flat leaf list for search — each item is toggled individually (no group checkboxes). */
export function flattenMatchingCategoryLeaves(
  nodes: CategoryTreeNode[],
  query: string,
): CategoryTreeNode[] {
  const q = query.trim().toLocaleLowerCase('az');
  if (!q) return [];

  const results: CategoryTreeNode[] = [];

  const walk = (node: CategoryTreeNode, ancestors: string[]) => {
    if (node.children?.length) {
      for (const child of node.children) {
        walk(child, [...ancestors, node.label]);
      }
      return;
    }
    const pathLabel = [...ancestors, node.label].join(' › ');
    const haystack = `${pathLabel} ${node.key}`.toLocaleLowerCase('az');
    if (haystack.includes(q)) {
      results.push({ key: node.key, label: pathLabel });
    }
  };

  for (const node of nodes) {
    walk(node, []);
  }

  return results.sort((a, b) => a.label.localeCompare(b.label, 'az'));
}

export function findLeafCategoryLabel(
  nodes: CategoryTreeNode[],
  key: string,
): string | undefined {
  for (const node of nodes) {
    if (node.children?.length) {
      const found = findLeafCategoryLabel(node.children, key);
      if (found) return found;
    } else if (node.key === key) {
      return node.label;
    }
  }
  return undefined;
}

/** Restrict tree to nodes whose leaf keys pass the predicate. */
export function pruneCategoryTree(
  nodes: CategoryTreeNode[],
  allowLeaf: (key: string) => boolean,
): CategoryTreeNode[] {
  const walk = (node: CategoryTreeNode): CategoryTreeNode | null => {
    if (node.children?.length) {
      const children = node.children
        .map(walk)
        .filter((n): n is CategoryTreeNode => n != null);
      if (children.length === 0) return null;
      return { ...node, children };
    }
    return allowLeaf(node.key) ? node : null;
  };

  return nodes.map(walk).filter((n): n is CategoryTreeNode => n != null);
}

export function mergeCategoryLabelsFromIncidents(
  incidents: Array<{
    category: { key: string; name: string };
    subcategory?: { key: string; name: string } | null;
  }>,
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const node of INCIDENT_CATEGORY_TREE) {
    labels.set(node.key, node.label);
    for (const child of node.children ?? []) {
      labels.set(child.key, child.label);
    }
  }
  for (const incident of incidents) {
    labels.set(incident.category.key, incident.category.name);
    if (incident.subcategory) {
      labels.set(incident.subcategory.key, incident.subcategory.name);
    }
  }
  return labels;
}

export function resolveCategoryLabel(
  key: string,
  labels?: Map<string, string>,
): string {
  return labels?.get(key) ?? getMapCategoryLabel(key);
}
