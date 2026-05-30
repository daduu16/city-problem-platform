export const mobileCategoryMap = {
  SU: 'water',
  QAZ: 'gas',
  ISIQ: 'electricity',
  YOL: 'road_surface',
  ZIBIL: 'street_dirt',
  QEZA: 'road_surface',
  TEBIET_HADISESI: 'storm_damage',
  TEHLUKESIZLIK: 'playgrounds',
} as const;

export const mobileCategoryLabels: Record<keyof typeof mobileCategoryMap, string> = {
  SU: 'Su',
  QAZ: 'Qaz',
  ISIQ: 'İşıq',
  YOL: 'Yol',
  ZIBIL: 'Zibil',
  QEZA: 'Qəza',
  TEBIET_HADISESI: 'Təbiət hadisəsi',
  TEHLUKESIZLIK: 'Təhlükəsizlik',
};

export const mobilePriorityMap = {
  ASAGI: 'LOW',
  ORTA: 'MEDIUM',
  YUKSEK: 'HIGH',
  TECILI: 'CRITICAL',
} as const;

export const mobilePriorityLabels: Record<keyof typeof mobilePriorityMap, string> = {
  ASAGI: 'Aşağı',
  ORTA: 'Orta',
  YUKSEK: 'Yüksək',
  TECILI: 'Təcili',
};

export const mobileStatusLabels = {
  YENI: 'Yeni',
  BAXILIR: 'Baxılır',
  ICRADADIR: 'İcradadır',
  HELL_EDILDI: 'Həll edildi',
} as const;
