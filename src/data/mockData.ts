import { News, NotificationItem, Problem } from '@/types';

export const mockNews: News[] = [
  {
    id: 'news_1',
    title: 'Şəhərdə yeni park açıldı',
    summary: 'Yeni park sakinlər üçün istirahət məkanı olacaq.',
    description:
      'Bu gün şəhərin mərkəzində yeni parkın açılışı oldu. Parkda uşaq meydançası, velosiped yolu, idman zonası və istirahət skamyaları var. Sakinlər parkın həm dizaynını, həm də yaşıllıq sahəsini yüksək qiymətləndiriblər.',
    imageUrl: 'https://picsum.photos/seed/citynews1/800/500',
    publishedAt: '2026-05-06T10:00:00.000Z',
  },
  {
    id: 'news_2',
    title: 'Yolların təmiri sürətlənir',
    summary: 'Bir neçə əsas küçədə asfalt yenilənməsi aparılır.',
    description:
      'Şəhər yollarında təmir işləri mərhələli şəkildə davam edir. Prioritet olaraq sıx trafik olan küçələr seçilib. Sürücülərə alternativ marşrutlardan istifadə etmək tövsiyə olunur.',
    imageUrl: 'https://picsum.photos/seed/citynews2/800/500',
    publishedAt: '2026-05-05T14:30:00.000Z',
  },
  {
    id: 'news_3',
    title: 'İctimai nəqliyyatda yeni marşrut',
    summary: 'Yeni avtobus xətti bir neçə rayonu birləşdirəcək.',
    description:
      'Yeni marşrut şəhərin şərq və qərb hissələrini birləşdirir. Məqsəd sərnişin axınını daha balanslı etmək və pik saatlarda sıxlığı azaltmaqdır. Marşrut sabahdan etibarən fəaliyyətə başlayır.',
    imageUrl: 'https://picsum.photos/seed/citynews3/800/500',
    publishedAt: '2026-05-04T08:15:00.000Z',
  },
  {
    id: 'news_4',
    title: 'Yağışlı hava ilə bağlı xəbərdarlıq',
    summary: 'Güclü külək və yağış gözlənilir.',
    description:
      'Sinoptiklər yaxın günlərdə yağış və külək olacağını bildiriblər. Vətəndaşlardan ehtiyatlı olmaları və ehtiyac olmadıqca uzaq səfərlərdən çəkinmələri xahiş olunur.',
    imageUrl: 'https://picsum.photos/seed/citynews4/800/500',
    publishedAt: '2026-05-03T19:05:00.000Z',
  },
  {
    id: 'news_5',
    title: 'Şəhər mərkəzində təmizlik aksiyası',
    summary: 'Könüllülər park və küçələrdə təmizlik işləri gördü.',
    description:
      'Könüllülərin iştirakı ilə keçirilən aksiyada ətraf mühitin təmizliyi təşviq olundu. Aksiya çərçivəsində zibil qutuları yenilənib, yaşıllıq zonalarında təmizlik aparılıb.',
    imageUrl: 'https://picsum.photos/seed/citynews5/800/500',
    publishedAt: '2026-05-02T09:45:00.000Z',
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
    address: 'Nərimanov r., Ağa Neymətulla küç. 12',
    createdAt: '2026-05-06T07:20:00.000Z',
    createdByMe: true,
    imageUrl: 'https://picsum.photos/seed/problem1/700/450',
  },
  {
    id: 'prob_2',
    title: 'Yol çuxuru təhlükə yaradır',
    category: 'Yol',
    priority: 'Yüksək',
    status: 'İcradadır',
    description: 'Əsas yolda böyük çuxur var, maşınlara zərər verir.',
    address: 'Yasamal r., İnşaatçılar pr. 56',
    createdAt: '2026-05-05T16:10:00.000Z',
    createdByMe: false,
  },
  {
    id: 'prob_3',
    title: 'İşıqlar sönür',
    category: 'İşıq',
    priority: 'Təcili',
    status: 'Yeni',
    description: 'Axşam saatlarında tez-tez işıq kəsilir.',
    address: 'Xətai r., Babək pr. 101',
    createdAt: '2026-05-04T20:55:00.000Z',
    createdByMe: true,
  },
  {
    id: 'prob_4',
    title: 'Zibil qutuları doludur',
    category: 'Zibil',
    priority: 'Aşağı',
    status: 'Həll edildi',
    description: 'Zibil qutuları vaxtında boşaldılmır.',
    address: 'Binəqədi r., 8-ci mikrorayon',
    createdAt: '2026-05-03T11:05:00.000Z',
    createdByMe: false,
  },
  {
    id: 'prob_5',
    title: 'Qəza baş verib',
    category: 'Qəza',
    priority: 'Təcili',
    status: 'Baxılır',
    description: 'İki avtomobil toqquşub, yol bağlanıb.',
    address: 'Sabunçu r., Bakıxanov qəs., əsas yol',
    createdAt: '2026-05-02T18:40:00.000Z',
    createdByMe: true,
    imageUrl: 'https://picsum.photos/seed/problem5/700/450',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Səyyar qəbul elanı',
    message:
      'Nərimanov rayon sakinlərinin nəzərinə! 06.05.2026-cı il tarixdə, saat 15:00-da 202 №-li tam orta məktəbdə (Ş.İ.Xətai prospekti 47) Nərimanov Rayon İcra Hakimiyyəti başçısının rayon sakinləri ilə növbəti səyyar qəbulu keçiriləcəkdir.',
    createdAt: '2026-05-06T12:00:00.000Z',
  },
  {
    id: 'notif_2',
    title: 'Su təchizatı məlumatı',
    message: 'Bu gün 22:00-dan 23:30-a qədər planlı su kəsintisi olacaq.',
    createdAt: '2026-05-05T11:20:00.000Z',
  },
];
