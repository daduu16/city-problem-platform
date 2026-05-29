import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.problem.deleteMany();
  await prisma.news.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      fullName: 'Demo İstifadəçi',
      email: 'demo@city.az',
      phone: '0500000001',
      finCode: 'AA1BB22',
      passwordHash: await bcrypt.hash('123456', 10),
      emailVerified: true,
    },
  });

  await prisma.news.createMany({
    data: [
      {
        title: 'Şəhərdə yeni park açıldı',
        summary: 'Yeni park sakinlər üçün istirahət məkanı olacaq.',
        description: 'Yeni parkda uşaq zonası, idman sahəsi və velosiped yolu istifadəyə verildi.',
        imageUrl: 'https://picsum.photos/seed/citynews1/800/500',
        publishedAt: new Date('2026-05-06T10:00:00.000Z'),
      },
      {
        title: 'Yolların təmiri sürətlənir',
        summary: 'Əsas küçələrdə asfalt yenilənməsi davam edir.',
        description: 'Təmir işləri mərhələli şəkildə aparılır və alternativ marşrutlardan istifadə tövsiyə olunur.',
        imageUrl: 'https://picsum.photos/seed/citynews2/800/500',
        publishedAt: new Date('2026-05-05T14:30:00.000Z'),
      },
      {
        title: 'İctimai nəqliyyatda yeni marşrut',
        summary: 'Yeni avtobus xətti bir neçə rayonu birləşdirəcək.',
        description: 'Yeni marşrut şəhərin şərq və qərb hissələrini birləşdirir, pik saatlarda sıxlığı azaltmaq üçün planlanıb.',
        imageUrl: 'https://picsum.photos/seed/citynews3/800/500',
        publishedAt: new Date('2026-05-04T08:15:00.000Z'),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        title: 'Səyyar qəbul elanı',
        message:
          'Nərimanov rayon sakinlərinin nəzərinə! 06.05.2026-cı il tarixdə, saat 15:00-da 202 №-li tam orta məktəbdə (Ş.İ.Xətai prospekti 47) Nərimanov Rayon İcra Hakimiyyəti başçısının rayon sakinləri ilə növbəti səyyar qəbulu keçiriləcəkdir.',
      },
      {
        title: 'Su təchizatı məlumatı',
        message: 'Bu gün 22:00-dan 23:30-a qədər planlı su kəsintisi olacaq.',
      },
    ],
  });

  await prisma.problem.createMany({
    data: [
      {
        title: 'Su təzyiqi zəifdir',
        description: 'Binada su təzyiqi son iki gündür aşağıdır.',
        address: 'Nərimanov r., Ağa Neymətulla küç. 12',
        category: 'SU',
        priority: 'ORTA',
        status: 'BAXILIR',
        userId: user.id,
      },
      {
        title: 'Yol çuxuru təhlükə yaradır',
        description: 'Əsas yolda böyük çuxur var, maşınlara zərər verir.',
        address: 'Yasamal r., İnşaatçılar pr. 56',
        category: 'YOL',
        priority: 'YUKSEK',
        status: 'ICRADADIR',
        userId: user.id,
      },
      {
        title: 'İşıq kəsintisi',
        description: 'Axşam saatlarında tez-tez işıq sönür.',
        address: 'Xətai r., Babək pr. 101',
        category: 'ISIQ',
        priority: 'TECILI',
        status: 'YENI',
        userId: user.id,
      },
    ],
  });

  console.log('Seed tamamlandı');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
