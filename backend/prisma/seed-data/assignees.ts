import { CategoryAssigneeKind } from '@prisma/client';

export type SeedAssigneeDef = {
  id: string;
  kind: CategoryAssigneeKind;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  organizationId?: string;
  /** Leaf category keys from CATEGORY_TREE */
  categoryKeys: string[];
};

/** Stable demo assignees (upserted on every seed). */
export const SEED_ASSIGNEES: SeedAssigneeDef[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    kind: CategoryAssigneeKind.PERSON,
    name: 'Kamran Mammadli',
    description: 'Kommunal və yol təmiri üzrə icraçı',
    contactEmail: 'kamran.mammadli@municipal.local',
    contactPhone: '+994501234501',
    organizationId: '00000000-0000-4000-8000-000000000010',
    categoryKeys: ['water', 'gas', 'road_surface', 'asphalt_repair'],
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    kind: CategoryAssigneeKind.TEAM,
    name: 'Nərimanov Kommunal Briqadası',
    description: 'Sanitariya və səki işləri',
    contactPhone: '+994121234502',
    organizationId: '00000000-0000-4000-8000-000000000010',
    categoryKeys: ['street_dirt', 'overflow_bins', 'sidewalks', 'curbs'],
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    kind: CategoryAssigneeKind.TEAM,
    name: 'Yaşıllaşdırma Qrupu',
    description: 'Ağac və ot biçmə işləri',
    organizationId: '00000000-0000-4000-8000-000000000010',
    categoryKeys: ['tree_fall', 'mowing', 'dry_zones'],
  },
  {
    id: '00000000-0000-4000-8000-000000000204',
    kind: CategoryAssigneeKind.TEAM,
    name: 'İşıqlandırma Qrupu',
    description: 'Küçə işıqlandırması',
    organizationId: '00000000-0000-4000-8000-000000000010',
    categoryKeys: ['broken_lamps', 'dark_areas'],
  },
  {
    id: '00000000-0000-4000-8000-000000000205',
    kind: CategoryAssigneeKind.TEAM,
    name: 'Azeriqaz Xidmət',
    description: 'Qaz təchizatı üzrə icraçı',
    organizationId: '00000000-0000-4000-8000-000000000011',
    categoryKeys: ['gas'],
  },
  {
    id: '00000000-0000-4000-8000-000000000206',
    kind: CategoryAssigneeKind.PERSON,
    name: 'Leyla Həsənova',
    description: 'Fövqəladə hallar və su basması',
    contactEmail: 'leyla.hasanova@municipal.local',
    organizationId: '00000000-0000-4000-8000-000000000010',
    categoryKeys: ['floods', 'ice', 'storm_damage', 'water'],
  },
];
