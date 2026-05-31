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
  assigneeTasks?: IncidentAssigneeTask[];
}

export interface DashboardKpis {
  activeProblems: number;
  overdueTasks: number;
  newToday: number;
  resolvedToday: number;
  avgResolutionHours: number;
  accidentsCount: number;
  slaPercent: number;
  totalOpen: number;
  resolutionRate: number;
  healthScore: number;
  priorityOpen: Record<IncidentPriority, number>;
}

export type ZoneRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type DistrictZoneId = 'A' | 'B' | 'C' | 'D';

export interface TopZoneRow {
  zoneId: DistrictZoneId;
  label: string;
  color: string;
  count: number;
  riskLevel: ZoneRiskLevel;
  lat: number;
  lng: number;
}

export interface RecentEventRow {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  address: string | null;
  category: { key: string; name: string };
  updatedAt: string;
  createdAt: string;
}

export interface ResolutionTimelinePoint {
  date: string;
  created: number;
  resolved: number;
}

export interface StatusCategoryBreakdown {
  statuses: Array<{ status: IncidentStatus; count: number }>;
  categoriesByStatus: Record<
    string,
    Array<{
      categoryId: string;
      category: { id: string; key: string; name: string };
      count: number;
    }>
  >;
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

export type CategoryAssigneeKind = 'TEAM' | 'PERSON';

export interface CategoryAssignee {
  id: string;
  kind: CategoryAssigneeKind;
  name: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  organization?: Organization | null;
  categories?: Array<{ category: Category }>;
}

export type IncidentAssigneeTaskStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type IncidentAssigneeTaskScheduleType = 'FIXED' | 'WINDOW';

export interface IncidentAssigneeTask {
  id: string;
  incidentId: string;
  assigneeId: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  scheduleType: IncidentAssigneeTaskScheduleType;
  estimatedMinutes?: number | null;
  status: IncidentAssigneeTaskStatus;
  assignee: CategoryAssignee;
  createdBy: { id: string; name: string };
}

export interface AssigneeDaySchedule {
  assignee: { id: string; name: string };
  date: string;
  day: AssigneeAvailabilityCalendarDay;
  draft?: {
    fixedConflicts: Array<{
      id: string;
      title: string;
      startsAt: string;
      endsAt: string;
      scheduleType: IncidentAssigneeTaskScheduleType;
    }>;
    outsideHours: boolean;
    reason?: string;
  };
}

export type AssigneeAvailabilityKind = 'WEEKLY' | 'DATE';
export type AssigneeAvailabilitySlotType = 'AVAILABLE' | 'UNAVAILABLE';

export interface AssigneeAvailabilitySlot {
  id: string;
  assigneeId: string;
  kind: AssigneeAvailabilityKind;
  dayOfWeek: number | null;
  date: string | null;
  slotType: AssigneeAvailabilitySlotType;
  startMinute: number;
  endMinute: number;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AvailabilityDayStatus = 'open' | 'partial' | 'closed' | 'off' | 'busy';

export interface ScheduleTaskIncident {
  id: string;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  status: IncidentStatus;
  priority: IncidentPriority;
}

export interface AssigneeCalendarTask {
  id: string;
  title: string;
  description?: string | null;
  incidentId: string;
  startsAt: string;
  endsAt: string;
  status: IncidentAssigneeTaskStatus;
  scheduleType?: IncidentAssigneeTaskScheduleType;
  incident: ScheduleTaskIncident | null;
}

export interface AssigneeAvailabilityCalendarDay {
  date: string;
  dayOfWeek: number;
  hasDateOverride: boolean;
  status?: AvailabilityDayStatus;
  effectiveWindows: Array<{ startMinute: number; endMinute: number }>;
  unavailableBlocks: Array<{ startMinute: number; endMinute: number }>;
  tasks: AssigneeCalendarTask[];
}

/** Task with calendar day key for schedule list/map views. */
export interface ScheduleTaskView extends AssigneeCalendarTask {
  date: string;
}

export interface AvailabilityOverview {
  from: string;
  to: string;
  dates: string[];
  assignees: Array<{
    id: string;
    name: string;
    kind: CategoryAssigneeKind;
    organization?: Organization | null;
    days: AssigneeAvailabilityCalendarDay[];
  }>;
}

export interface AssigneeAvailabilityCalendar {
  from: string;
  to: string;
  days: AssigneeAvailabilityCalendarDay[];
}

export type AssigneePickerAvailabilityStatus =
  | 'available'
  | 'busy'
  | 'outside_hours'
  | 'unavailable_block';

export interface AssigneeAvailabilityCandidate {
  id: string;
  name: string;
  kind: CategoryAssigneeKind;
  organization?: Organization | null;
  availabilityStatus: AssigneePickerAvailabilityStatus;
  reason?: string;
  conflicts?: Array<{ id: string; title: string; startsAt: string; endsAt: string }>;
}

export interface AssigneeAvailabilityResult {
  available: CategoryAssignee[];
  busy: Array<{
    id: string;
    name: string;
    kind: CategoryAssigneeKind;
    organization?: Organization | null;
    conflicts: Array<{ id: string; title: string; startsAt: string; endsAt: string }>;
  }>;
  outsideAvailability: Array<{
    id: string;
    name: string;
    kind: CategoryAssigneeKind;
    organization?: Organization | null;
    reason: string;
  }>;
  /** Unified list sorted for picker UI (available → busy → outside). */
  candidates: AssigneeAvailabilityCandidate[];
  startsAt: string;
  endsAt: string;
}

export interface AssigneeFreeSlot {
  startsAt: string;
  endsAt: string;
}

export interface AssigneeFreeSlotsResult {
  assignee: CategoryAssignee;
  durationMinutes: number;
  slots: AssigneeFreeSlot[];
}
