import { getApiBaseUrl } from '@/config/api';
import { News, NotificationItem, Problem, ProblemCategory, ProblemPriority, ProblemStatus } from '@/types';

export const API_BASE_URL = getApiBaseUrl();

type BackendProblem = {
  id: string;
  title: string;
  description: string;
  address: string;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  category: string;
  categoryLabel?: string;
  priority: string;
  priorityLabel?: string;
  status: string;
  statusLabel?: string;
  createdAt: string;
  upvotes?: number;
};

type BackendNews = News;

const statusMap: Record<string, ProblemStatus> = {
  YENI: 'Yeni',
  BAXILIR: 'Baxılır',
  ICRADADIR: 'İcradadır',
  HELL_EDILDI: 'Həll edildi',
};

const priorityMap: Record<string, ProblemPriority> = {
  ASAGI: 'Aşağı',
  ORTA: 'Orta',
  YUKSEK: 'Yüksək',
  TECILI: 'Təcili',
};

const categoryMap: Record<string, ProblemCategory> = {
  SU: 'Su',
  QAZ: 'Qaz',
  ISIQ: 'İşıq',
  YOL: 'Yol',
  ZIBIL: 'Zibil',
  QEZA: 'Qəza',
  TEBIET_HADISESI: 'Təbiət hadisəsi',
  TEHLUKESIZLIK: 'Təhlükəsizlik',
};

function toProblem(item: BackendProblem): Problem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    address: item.address,
    imageUrl: item.imageUrl || undefined,
    mediaUrl: item.mediaUrl || item.imageUrl || undefined,
    mediaType: item.mediaType || (item.imageUrl ? 'image' : undefined),
    category: categoryMap[item.category] || (item.categoryLabel as ProblemCategory),
    priority: priorityMap[item.priority] || (item.priorityLabel as ProblemPriority),
    status: statusMap[item.status] || (item.statusLabel as ProblemStatus),
    createdAt: item.createdAt,
    createdByMe: false,
    upvotes: item.upvotes ?? 0,
    hasUpvoted: false,
  };
}

function normalizeAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  const legacy = url.match(/^https?:\/\/(localhost|127\.0\.0\.1):(4000|3001)(\/.*)?$/);
  if (legacy) {
    return `${API_BASE_URL}${legacy[3] ?? ''}`;
  }
  return url;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      if (json?.message) message = json.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchNews(): Promise<News[]> {
  const data = await apiFetch<BackendNews[]>('/api/news');
  return data.map((item) => ({
    ...item,
    imageUrl: normalizeAssetUrl(item.imageUrl) || item.imageUrl,
  }));
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const data = await apiFetch<NotificationItem[]>('/api/notifications');
  return data.map((item) => ({ ...item, isRead: item.isRead ?? false }));
}

export async function fetchProblems(): Promise<Problem[]> {
  const data = await apiFetch<BackendProblem[]>('/api/problems');
  return data.map(toProblem);
}

export async function createProblem(input: {
  title: string;
  category: ProblemCategory;
  priority: ProblemPriority;
  description: string;
  address: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}): Promise<Problem> {
  const categoryCode: Record<ProblemCategory, string> = {
    Su: 'SU',
    Qaz: 'QAZ',
    İşıq: 'ISIQ',
    Yol: 'YOL',
    Zibil: 'ZIBIL',
    Qəza: 'QEZA',
    'Təbiət hadisəsi': 'TEBIET_HADISESI',
    Təhlükəsizlik: 'TEHLUKESIZLIK',
  };

  const priorityCode: Record<ProblemPriority, string> = {
    Aşağı: 'ASAGI',
    Orta: 'ORTA',
    Yüksək: 'YUKSEK',
    Təcili: 'TECILI',
  };

  const created = await apiFetch<BackendProblem>('/api/problems', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      address: input.address.trim(),
      imageUrl: input.imageUrl,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      category: categoryCode[input.category],
      priority: priorityCode[input.priority],
    }),
  });

  return { ...toProblem(created), createdByMe: true };
}
