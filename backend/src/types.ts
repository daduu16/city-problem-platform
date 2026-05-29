export const problemCategories = [
  'SU',
  'QAZ',
  'ISIQ',
  'YOL',
  'ZIBIL',
  'QEZA',
  'TEBIET_HADISESI',
  'TEHLUKESIZLIK',
] as const;

export const problemPriorities = ['ASAGI', 'ORTA', 'YUKSEK', 'TECILI'] as const;
export const problemStatuses = ['YENI', 'BAXILIR', 'ICRADADIR', 'HELL_EDILDI'] as const;

export type ProblemCategoryCode = (typeof problemCategories)[number];
export type ProblemPriorityCode = (typeof problemPriorities)[number];
export type ProblemStatusCode = (typeof problemStatuses)[number];

export const categoryMap: Record<ProblemCategoryCode, string> = {
  SU: 'Su',
  QAZ: 'Qaz',
  ISIQ: 'İşıq',
  YOL: 'Yol',
  ZIBIL: 'Zibil',
  QEZA: 'Qəza',
  TEBIET_HADISESI: 'Təbiət hadisəsi',
  TEHLUKESIZLIK: 'Təhlükəsizlik',
} as const;

export const priorityMap: Record<ProblemPriorityCode, string> = {
  ASAGI: 'Aşağı',
  ORTA: 'Orta',
  YUKSEK: 'Yüksək',
  TECILI: 'Təcili',
} as const;

export const statusMap: Record<ProblemStatusCode, string> = {
  YENI: 'Yeni',
  BAXILIR: 'Baxılır',
  ICRADADIR: 'İcradadır',
  HELL_EDILDI: 'Həll edildi',
} as const;
