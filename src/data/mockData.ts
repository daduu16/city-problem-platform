import { News, NotificationItem, Problem } from '@/types';

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
    category: 'Su',
    priority: 'Orta',
    status: 'Baxılır',
    description: 'Binada su təzyiqi son iki gündür aşağıdır.',
    address: 'Nərimanov r., Ağa Nemətulla küç. 12',
    createdAt: '2026-05-06T07:20:00.000Z',
    createdByMe: true,
    imageUrl: 'https://picsum.photos/seed/problem1/700/450',
    upvotes: 24,
    hasUpvoted: false,
  },
  {
    id: 'prob_2',
    title: 'Yol çuxuru təhlükə yaradır',
    category: 'Yol',
    priority: 'Yüksək',
    status: 'İcradadır',
    description: 'Əsas yolda böyük çuxur var, avtomobillərə zərər verir.',
    address: 'Yasamal r., İnşaatçılar pr. 56',
    createdAt: '2026-05-05T16:10:00.000Z',
    createdByMe: false,
    upvotes: 61,
    hasUpvoted: true,
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_azeriisiq_1',
    title: 'Azərişıq — elektrik kəsintiləri',
    message: 'Azərişıq — elektrik kəsintiləri.',
    createdAt: '2026-05-30T08:30:00.000Z',
    isRead: false,
  },
  {
    id: 'notif_azeriqaz_1',
    title: 'Azəriqaz — qaz təchizatı problemləri',
    message: 'Azəriqaz — qaz təchizatı problemləri.',
    createdAt: '2026-05-30T09:10:00.000Z',
    isRead: false,
  },
  {
    id: 'notif_azersu_1',
    title: 'Azərsu — su kəsintisi və qəza məlumatları',
    message: 'Azərsu — su kəsintisi və qəza məlumatları.',
    createdAt: '2026-05-30T09:40:00.000Z',
    isRead: false,
  },
  {
    id: 'notif_fhn_1',
    title: 'Fövqəladə Hallar Nazirliyi — sel, subasma, güclü külək, yanğın, təxliyə və xəbərdarlıqlar',
    message: 'Fövqəladə Hallar Nazirliyi — sel, subasma, güclü külək, yanğın, təxliyə və xəbərdarlıqlar.',
    createdAt: '2026-05-30T10:05:00.000Z',
    isRead: false,
  },
];

