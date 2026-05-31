export const mobileCategoryMap = {
  INFRASTRUCTURE: 'infrastructure',
  UTILITIES: 'utilities',
  GREENERY: 'greenery',
  WEATHER_EMERGENCY: 'weather_emergency',
  SANITATION: 'sanitation',
  LIGHTING: 'lighting',
  PARKS: 'parks',
  ADVERTISING: 'advertising',
} as const;

export const mobileCategoryLabels: Record<keyof typeof mobileCategoryMap, string> = {
  INFRASTRUCTURE: 'İnfrastruktur',
  UTILITIES: 'Kommunal',
  GREENERY: 'Yaşıllıq',
  WEATHER_EMERGENCY: 'Fövqəladə',
  SANITATION: 'Sanitariya',
  LIGHTING: 'İşıqlandırma',
  PARKS: 'Parklar',
  ADVERTISING: 'Reklam',
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
