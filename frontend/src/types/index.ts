export type IncidentStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'OVERDUE'
  | 'ARCHIVED';

export type DistrictStatus = 'WITHIN_DISTRICT' | 'OUTSIDE_DISTRICT';

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentType = 'ACCIDENT' | 'COMPLAINT' | 'INSPECTION' | 'EMERGENCY';

export type IncidentScopeType = 'all' | 'region' | 'assigned' | 'organization';

export interface CategoryRef {
  id: string;
  key: string;
  name: string;
}

export interface UserAccess {
  permissions: string[];
  categories: string[];
  mapLayers: string[];
  analytics: string[];
  incidentScope: IncidentScopeType;
  geozones: string[];
  roleKey: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roleKey: string;
  roleName?: string;
  department?: string | null;
  organization?: Organization | null;
}

export interface MapIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  type: IncidentType;
  category: CategoryRef;
  subcategory?: CategoryRef | null;
  districtStatus?: DistrictStatus;
  lat: number;
  lng: number;
  address?: string | null;
  deadline?: string | null;
  slaDueAt?: string | null;
  createdAt: string;
  /** Total müraciətlər — all IncidentReport rows on this hadisə (map API `_count.reports`). */
  reportCount: number;
}

export interface IncidentDetail extends MapIncident {
  description: string;
  createdBy: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  attachments: Array<{ id: string; fileUrl: string; type: string }>;
  reports: Array<{
    id: string;
    title: string;
    message: string;
    lat: number;
    lng: number;
    address?: string | null;
    photoUrl?: string | null;
    videoUrl?: string | null;
    createdAt: string;
    reporter: { id: string; name: string };
  }>;
  history: Array<{
    id: string;
    actionType: string;
    oldValue?: string | null;
    newValue?: string | null;
    metadata?: { reportId?: string } | null;
    createdAt: string;
    createdBy: { id: string; name: string };
  }>;
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string };
  }>;
}

export interface DashboardKpis {
  activeProblems: number;
  overdueTasks: number;
  newToday: number;
  avgResolutionHours: number;
  accidentsCount: number;
  slaPercent: number;
  totalOpen: number;
}

export interface Geozone {
  id: string;
  name: string;
  description?: string | null;
  geojson: GeoJSON.Feature | GeoJSON.FeatureCollection;
  color: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  access: UserAccess;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  department?: string | null;
  isActive: boolean;
  role: { id: string; key: string; name: string };
  organization?: Organization | null;
  categoryAccess: Array<{ category: CategoryRef }>;
  geozoneAccess: Array<{ geozone: { id: string; name: string } }>;
  mapLayerAccess: Array<{ layerKey: string }>;
  analyticsAccess: Array<{ analyticsKey: string }>;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  parentId?: string | null;
  serviceOwner?: string | null;
}
