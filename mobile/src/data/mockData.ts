import { News, NotificationItem, Problem } from '@/types';

export type MockPointActivity = {
  id: string;
  title: string;
  points: number;
  createdAt: string;
};

export type MockLeaderboardEntry = {
  id: string;
  fullName: string;
  points: number;
  createdProblems: number;
  resolvedProblems: number;
};

export type MockGamificationSummary = {
  points: number;
  createdProblems: number;
  resolvedProblems: number;
};

export const mockNews: News[] = [
  {
    id: 'news_1',
    title: 'Şəhərdə yeni park açıldı',
    summary: 'Yeni park sakinlər üçün istirahət məkanı olacaq.',
    description: 'Şəhərin mərkəzində yeni park istifadəyə verildi.',
    imageUrl: 'https://picsum.photos/seed/citynews1/800/500',
    publishedAt: '2026-05-06T10:00:00.000Z',
  },
  {
    id: 'news_2',
    title: 'Yolların təmiri sürətlənir',
    summary: 'Bir neçə əsas küçədə asfalt yenilənməsi aparılır.',
    description: 'Təmir işləri mərhələli davam edir.',
    imageUrl: 'https://picsum.photos/seed/citynews2/800/500',
    publishedAt: '2026-05-05T14:30:00.000Z',
  },
];

export const mockProblems: Problem[] = [
  {
    id: 'prob_1',
    title: 'Su təzyiqi zəifdir',
    category: 'Kommunal',
    priority: 'Orta',
    status: 'Baxılır',
    description: 'Binada su təzyiqi son iki gündür aşağıdır.',
    address: 'Nərimanov r., Ağa Nemətulla küç. 12',
    createdAt: '2026-05-06T07:20:00.000Z',
    createdByMe: true,
    assignedToRole: 'citizen',
    imageUrl: 'https://picsum.photos/seed/problem1/700/450',
    upvotes: 24,
    hasUpvoted: false,
  },
  {
    id: 'prob_2',
    title: 'Yol çuxuru təhlükə yaradır',
    category: 'İnfrastruktur',
    priority: 'Yüksək',
    status: 'İcradadır',
    description: 'Əsas yolda böyük çuxur var, avtomobillərə zərər verir.',
    address: 'Yasamal r., İnşaatçılar pr. 56',
    createdAt: '2026-05-05T16:10:00.000Z',
    createdByMe: false,
    assignedToRole: 'executor',
    assignedByOperator: true,
    upvotes: 61,
    hasUpvoted: true,
  },
  {
    id: 'prob_3',
    title: 'Qaranlıq sahədə işıqlandırma işləmir',
    category: 'İşıqlandırma',
    priority: 'Yüksək',
    status: 'Baxılır',
    description: 'Operator tərəfindən icraçıya yönləndirilib. Ərazi gecə saatlarında tam qaranlıq qalır.',
    address: 'Nərimanov r., Təbriz küç. 41',
    createdAt: '2026-05-30T18:20:00.000Z',
    createdByMe: false,
    assignedToRole: 'executor',
    assignedByOperator: true,
    imageUrl: 'https://picsum.photos/seed/problem3/700/450',
    upvotes: 11,
    hasUpvoted: false,
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_real_water_28may',
    title: '28 May tarixində su kəsintisi',
    message: 'Məlumat: 28 May tarixində təmir işləri ilə əlaqədar saat 10:00-18:00 aralığında su verilişi dayandırılacaq.',
    createdAt: '2026-05-30T07:30:00.000Z',
    isRead: false,
    type: 'general',
    targetRole: 'all',
  },
  {
    id: 'notif_real_power_interval',
    title: 'İşığın verilməsində fasilələr',
    message: 'Xəbərdarlıq: Şəbəkə yüklənməsi səbəbi ilə bu axşam 19:00-23:00 saatlarında elektrik verilişində aralıqlı fasilələr gözlənilir.',
    createdAt: '2026-05-30T08:10:00.000Z',
    isRead: false,
    type: 'general',
    targetRole: 'all',
  },
  {
    id: 'notif_real_dyp_road_close',
    title: 'DYP: Yol sabah bağlı olacaq',
    message: 'DYP məlumatı: Tədbirlə əlaqədar Nərimanov rayonu, Təbriz küçəsinin bir hissəsi sabah saat 09:00-dan 14:00-dək nəqliyyat üçün bağlanacaq.',
    createdAt: '2026-05-30T08:45:00.000Z',
    isRead: false,
    type: 'general',
    targetRole: 'all',
  },
];

export const mockPointActivities: MockPointActivity[] = [
  {
    id: 'points_1',
    title: 'Yeni problem yaradıldı',
    points: 5,
    createdAt: '2026-05-29T10:20:00.000Z',
  },
  {
    id: 'points_2',
    title: 'Problem həll edildi',
    points: 10,
    createdAt: '2026-05-30T09:45:00.000Z',
  },
  {
    id: 'points_3',
    title: 'Yeni problem yaradıldı',
    points: 5,
    createdAt: '2026-05-30T12:10:00.000Z',
  },
];

export const mockWeeklyLeaderboard: MockLeaderboardEntry[] = [
  { id: 'wk_1', fullName: 'Aysel Məmmədova', points: 145, createdProblems: 13, resolvedProblems: 8 },
  { id: 'wk_2', fullName: 'Orxan Hüseynov', points: 130, createdProblems: 12, resolvedProblems: 7 },
  { id: 'wk_3', fullName: 'Nigar Əliyeva', points: 115, createdProblems: 11, resolvedProblems: 6 },
  { id: 'wk_4', fullName: 'Rauf Qasımov', points: 95, createdProblems: 9, resolvedProblems: 5 },
  { id: 'wk_5', fullName: 'Leyla İsmayılova', points: 80, createdProblems: 8, resolvedProblems: 4 },
];

export const mockMonthlyLeaderboard: MockLeaderboardEntry[] = [
  { id: 'mo_1', fullName: 'Orxan Hüseynov', points: 520, createdProblems: 44, resolvedProblems: 30 },
  { id: 'mo_2', fullName: 'Aysel Məmmədova', points: 495, createdProblems: 42, resolvedProblems: 28 },
  { id: 'mo_3', fullName: 'Nigar Əliyeva', points: 470, createdProblems: 40, resolvedProblems: 27 },
  { id: 'mo_4', fullName: 'Rauf Qasımov', points: 430, createdProblems: 36, resolvedProblems: 25 },
  { id: 'mo_5', fullName: 'Leyla İsmayılova', points: 390, createdProblems: 33, resolvedProblems: 22 },
];

export const mockGamificationSummary: MockGamificationSummary = {
  points: 135,
  createdProblems: 11,
  resolvedProblems: 8,
};
