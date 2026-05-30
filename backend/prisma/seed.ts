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
      fullName: 'Demo Istifadeci',
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
        title: 'Sehid Eli Qasimovun ailesi ziyaret olunub',
        summary: 'Tarix: 17 may 2026. Nerimanov RIH rehberliyi sehid Eli Qasimovun ailesini ziyaret edib.',
        description:
          'Nerimanov Rayon Icra Hakimiyyetinin bascisi Elgin Hebibullayev, Nerimanov Belediyyesinin sedri Temraz Tagiyev ve Icra Hakimiyyetinin mesul sexsleri Veten Muharibesi sehidi Eli Ibrahim oglu Qasimovun ailesini ziyaret etmis, onun eziz xatiresini hormet ve ehtiramla yad etmisler. Sehid Eli Qasimov Tertar rayonunun Talis kendi ugrunda ve Agdere istiqametinde geden doyuslerde qehremancasina sehid olmusdur. O, olumunden sonra "Suqovusanin azad olunmasina gore", "Igidliye gore" ve "Veten ugrunda" medallari ile teltif edilmisdir. Gorusde sehid ailesine dovlet qaygisinin davam etdiyi bildirilib.',
        imageUrl: 'http://localhost:4000/news/nar1.jpeg',
        publishedAt: new Date('2026-05-17T09:00:00.000Z'),
      },
      {
        title: 'Nerimanov rayonunda seyyar qebullar davam edir',
        summary: 'Tarix: 16 may 2026. RIH bascisi 193 sayli mektebde sakinlerle seyyar gorus-qebul kecirib.',
        description:
          'Nerimanov Rayon Icra Hakimiyyetinin bascisi Elgin Hebibullayev 193 sayli tam orta mektebde sakinlerle seyyar gorus-qebulu kecirmisdir. Gorusde RIHBA-nin mesul sexsleri, erazi icra numayendeleri, belediyye, rayonun idare, muessise ve xidmet sahelerinin rehberleri, hemcinin sakinler istirak etmisler. Sakinler abadliq islerinin aparilmasi, su ve kanalizasiya xetlerinin yenilenmesi, qurumus agaclarin budanmasi ve diger sosial problemlerle bagli muraciet etmisler. Qaldirilan meselelerin helli ucun aidiyyeti qurumlara tapshiriqlar verilib ve icrasi nezarete goturulub.',
        imageUrl: 'http://localhost:4000/news/nar2.jpg',
        publishedAt: new Date('2026-05-16T12:00:00.000Z'),
      },
      {
        title: 'Nerimanov rayonunda 15 May - Beynelxalq Aile Gunu qeyd olunub',
        summary: 'Tarix: 15 may 2026. Aile deyerlerinin tebligi meqsedile rayon tedbiri kecirilib.',
        description:
          'Nerimanov rayonunda "15 May - Beynelxalq Aile Gunu" erefesinde aile deyerlerinin tebligi ve aile institutunun mohkemlendirilmesi meqsedile tedbir kecirilmisdir. Tedbirde agsaqqallar, genc aileler ve rayon ictimaiyyetinin numayendeleri istirak etmisler. Nerimanov Rayon Icra Hakimiyyeti bascisinin muavini Irade Muradova ailenin cemiyyetin esas sutunlarindan biri oldugunu vurgulayib. Tedbir Aile, Qadin ve Usaq Problemleri uzre Dovlet Komitesinin numayendesi Kamila Eliyeva, Nerimanov Rayon Agsaqqallar Surasinin sedri Arif Humbetov ve diger cixislarla davam edib.',
        imageUrl: 'http://localhost:4000/news/nar3.jpg',
        publishedAt: new Date('2026-05-15T10:30:00.000Z'),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        title: 'Seyyar qebul elani',
        message: 'Nerimanov rayonunda novbeti seyyar qebul ucun elani izleyin.',
      },
      {
        title: 'Xeber yenilendi',
        message: 'Xeberler bolmesine yeni materiallar elave olundu.',
      },
    ],
  });

  await prisma.problem.createMany({
    data: [
      {
        title: 'Su tezyiqi zeifdir',
        description: 'Binada su tezyiqi son iki gundur asagidir.',
        address: 'Nerimanov r., Aga Neymetulla kuc. 12',
        category: 'SU',
        priority: 'ORTA',
        status: 'BAXILIR',
        userId: user.id,
      },
      {
        title: 'Yol cuxuru tehlukedir',
        description: 'Esas yolda boyuk cuxur var, masinlara zerer verir.',
        address: 'Yasamal r., Insaatcilar pr. 56',
        category: 'YOL',
        priority: 'YUKSEK',
        status: 'ICRADADIR',
        userId: user.id,
      },
      {
        title: 'Isiq kesintisi',
        description: 'Axsam saatlarinda tez-tez isiq sonur.',
        address: 'Xetai r., Babek pr. 101',
        category: 'ISIQ',
        priority: 'TECILI',
        status: 'YENI',
        userId: user.id,
      },
    ],
  });

  console.log('Seed tamamlandi');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
