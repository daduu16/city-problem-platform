import { getApiBaseUrl } from '@/config/api';
import { News, NotificationItem, Problem, ProblemCategory, ProblemPriority, ProblemStatus } from '@/types';

/** @deprecated Prefer getApiBaseUrl() — URL may depend on Expo dev host at runtime. */
export const API_BASE_URL = getApiBaseUrl();

type BackendProblem = {
  id: string;
  title: string;
  description: string;
  address: string;
  lat?: number;
  lng?: number;
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
  INFRASTRUCTURE: 'İnfrastruktur',
  UTILITIES: 'Kommunal',
  GREENERY: 'Yaşıllıq',
  WEATHER_EMERGENCY: 'Fövqəladə',
  SANITATION: 'Sanitariya',
  LIGHTING: 'İşıqlandırma',
  PARKS: 'Parklar',
  ADVERTISING: 'Reklam',
  // Legacy backend/mobile codes support
  SU: 'Kommunal',
  QAZ: 'Kommunal',
  ISIQ: 'İşıqlandırma',
  YOL: 'İnfrastruktur',
  ZIBIL: 'Sanitariya',
  QEZA: 'İnfrastruktur',
  TEBIET_HADISESI: 'Fövqəladə',
  TEHLUKESIZLIK: 'Parklar',
};

function toProblem(item: BackendProblem): Problem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    address: item.address,
    lat: item.lat,
    lng: item.lng,
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
  const base = getApiBaseUrl();
  if (url.startsWith('/')) {
    return `${base}${url}`;
  }
  const legacy = url.match(/^https?:\/\/(localhost|127\.0\.0\.1):(4000|3001)(\/.*)?$/);
  if (legacy) {
    return `${base}${legacy[3] ?? ''}`;
  }
  return url;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  lat?: number;
  lng?: number;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaAsset?: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  };
}): Promise<Problem> {
  const categoryCode: Record<ProblemCategory, string> = {
    İnfrastruktur: 'INFRASTRUCTURE',
    Kommunal: 'UTILITIES',
    Yaşıllıq: 'GREENERY',
    Fövqəladə: 'WEATHER_EMERGENCY',
    Sanitariya: 'SANITATION',
    İşıqlandırma: 'LIGHTING',
    Parklar: 'PARKS',
    Reklam: 'ADVERTISING',
  };

  const priorityCode: Record<ProblemPriority, string> = {
    Aşağı: 'ASAGI',
    Orta: 'ORTA',
    Yüksək: 'YUKSEK',
    Təcili: 'TECILI',
  };

  const normalizeMediaType = (type?: 'image' | 'video', mimeType?: string | null) => {
    if (type) return type;
    if (!mimeType) return undefined;
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('image/')) return 'image';
    return undefined;
  };

  const uploadLocalMediaIfNeeded = async () => {
    const uri = input.mediaAsset?.uri ?? input.mediaUrl;
    if (!uri) {
      return {
        mediaUrl: undefined as string | undefined,
        mediaType: input.mediaType,
      };
    }

    const mediaType = normalizeMediaType(input.mediaType, input.mediaAsset?.mimeType);
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      return { mediaUrl: uri, mediaType };
    }

    const extFromName = input.mediaAsset?.fileName?.match(/\.[a-zA-Z0-9]+$/)?.[0];
    const ext =
      extFromName ??
      (mediaType === 'video'
        ? '.mp4'
        : input.mediaAsset?.mimeType?.includes('png')
          ? '.png'
          : '.jpg');
    const mimeType =
      input.mediaAsset?.mimeType ??
      (mediaType === 'video' ? 'video/mp4' : ext === '.png' ? 'image/png' : 'image/jpeg');
    const fileName =
      input.mediaAsset?.fileName ?? `mobile-upload-${Date.now()}${ext}`;

    const formData = new FormData();
    formData.append('mediaType', mediaType ?? 'image');
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/api/uploads/mobile-media`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const json = await response.json();
        if (json?.message) message = json.message;
      } catch {
        // ignore
      }
      throw new Error(`Media upload failed: ${message}`);
    }
    const json = (await response.json()) as {
      url: string;
      mediaType?: 'image' | 'video';
    };
    return {
      mediaUrl: json.url,
      mediaType: json.mediaType ?? mediaType,
    };
  };

  const uploadedMedia = await uploadLocalMediaIfNeeded();

  const created = await apiFetch<BackendProblem>('/api/problems', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      address: input.address.trim(),
      lat: input.lat,
      lng: input.lng,
      imageUrl:
        uploadedMedia.mediaType === 'image'
          ? uploadedMedia.mediaUrl ?? input.imageUrl
          : undefined,
      mediaUrl: uploadedMedia.mediaUrl,
      mediaType: uploadedMedia.mediaType,
      category: categoryCode[input.category],
      priority: priorityCode[input.priority],
    }),
  });

  return { ...toProblem(created), createdByMe: true };
}
