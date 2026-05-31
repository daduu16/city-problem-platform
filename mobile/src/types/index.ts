export type News = {
  id: string;
  title: string;
  summary: string;
  description: string;
  imageUrl: string;
  publishedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type?: 'general' | 'executor_task';
  problemId?: string;
  targetRole?: 'citizen' | 'executor' | 'all';
};

export type ProblemCategory =
  | 'İnfrastruktur'
  | 'Kommunal'
  | 'Yaşıllıq'
  | 'Fövqəladə'
  | 'Sanitariya'
  | 'İşıqlandırma'
  | 'Parklar'
  | 'Reklam';

export type ProblemPriority = 'Aşağı' | 'Orta' | 'Yüksək' | 'Təcili';

export type ProblemStatus = 'Yeni' | 'Baxılır' | 'İcradadır' | 'Həll edildi';

export type ProblemMediaItem = {
  uri: string;
  type: 'image' | 'video';
};

export type MobileAssigneeProfile = {
  id: string;
  name: string;
  kind: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive?: boolean;
};

export type MobileScheduleIncident = {
  id: string;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  status: string;
  priority: string;
};

export type MobileScheduleTask = {
  id: string;
  title: string;
  description?: string | null;
  incidentId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  scheduleType?: string;
  date: string;
  incident: MobileScheduleIncident | null;
};

export type MobileScheduleCalendar = {
  from: string;
  to: string;
  days: Array<{
    date: string;
    tasks: Array<Omit<MobileScheduleTask, 'date'>>;
  }>;
};

export type Problem = {
  id: string;
  title: string;
  category: ProblemCategory;
  priority: ProblemPriority;
  status: ProblemStatus;
  description: string;
  address: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  createdByMe: boolean;
  imageUrl?: string;
  /** All attached photos (citizen reports + attachments). */
  imageUrls?: string[];
  /** Carousel items (photos + videos), preferred over legacy fields. */
  mediaItems?: ProblemMediaItem[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  assignedToRole?: 'executor' | 'citizen';
  assignedByOperator?: boolean;
  resolvedPhotoUrl?: string;
  upvotes: number;
  hasUpvoted: boolean;
};
