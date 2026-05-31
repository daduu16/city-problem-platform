export const PERMISSIONS = [
  { key: 'view_dashboard', description: 'View analytics dashboard' },
  { key: 'view_map', description: 'View incident map' },
  { key: 'view_incidents', description: 'View incident list' },
  { key: 'create_incident', description: 'Create incidents' },
  { key: 'edit_incident', description: 'Edit incidents' },
  { key: 'assign_task', description: 'Assign incidents to workers' },
  { key: 'close_task', description: 'Close/resolve incidents' },
  { key: 'export_reports', description: 'Export analytics reports' },
  { key: 'manage_users', description: 'Manage users and access' },
  { key: 'manage_geozones', description: 'Manage geozones' },
  { key: 'manage_assignees', description: 'Manage category responsible parties' },
  { key: 'view_audit', description: 'View audit log' },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];

export const ROLES: Array<{
  key: string;
  name: string;
  incidentScope: 'ALL' | 'REGION' | 'ASSIGNED' | 'ORGANIZATION';
  permissions: PermissionKey[];
}> = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    incidentScope: 'ALL',
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    key: 'regional_admin',
    name: 'Regional Admin',
    incidentScope: 'REGION',
    permissions: [
      'view_dashboard',
      'view_map',
      'view_incidents',
      'create_incident',
      'edit_incident',
      'assign_task',
      'close_task',
      'export_reports',
      'manage_users',
      'manage_geozones',
      'manage_assignees',
      'view_audit',
    ],
  },
  {
    key: 'dispatcher',
    name: 'Dispatcher',
    incidentScope: 'ALL',
    permissions: [
      'view_dashboard',
      'view_map',
      'view_incidents',
      'create_incident',
      'edit_incident',
      'assign_task',
      'close_task',
    ],
  },
  {
    key: 'analyst',
    name: 'Analyst',
    incidentScope: 'ALL',
    permissions: ['view_dashboard', 'view_map', 'view_incidents', 'export_reports'],
  },
  {
    key: 'field_worker',
    name: 'Field Worker',
    incidentScope: 'ASSIGNED',
    permissions: ['view_map', 'view_incidents', 'edit_incident', 'close_task'],
  },
  {
    key: 'viewer',
    name: 'Viewer',
    incidentScope: 'ALL',
    permissions: ['view_dashboard', 'view_map', 'view_incidents'],
  },
  {
    key: 'citizen',
    name: 'Citizen',
    incidentScope: 'ALL',
    permissions: ['view_map', 'view_incidents', 'create_incident'],
  },
  {
    key: 'utility_operator',
    name: 'Utility Operator',
    incidentScope: 'ORGANIZATION',
    permissions: ['view_dashboard', 'view_map', 'view_incidents', 'edit_incident', 'close_task'],
  },
];

export const MAP_LAYERS = [
  'water_incidents',
  'gas_incidents',
  'electricity_incidents',
  'roads_incidents',
  'lighting_incidents',
  'sanitation_incidents',
  'weather_incidents',
  'floods',
  'greenery_incidents',
] as const;

export const ANALYTICS_KEYS = [
  'kpis',
  'by_category',
  'by_status',
  'by_priority',
  'timeline',
  'hot_zones',
  'recent_events',
  'top_zones',
  'gas_statistics',
  'response_time',
] as const;
