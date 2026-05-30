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
};

export type ProblemCategory =
  | 'Su'
  | 'Qaz'
  | 'İşıq'
  | 'Yol'
  | 'Zibil'
  | 'Qəza'
  | 'Təbiət hadisəsi'
  | 'Təhlükəsizlik';

export type ProblemPriority = 'Aşağı' | 'Orta' | 'Yüksək' | 'Təcili';

export type ProblemStatus = 'Yeni' | 'Baxılır' | 'İcradadır' | 'Həll edildi';

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
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  upvotes: number;
  hasUpvoted: boolean;
};
