import {
  Prisma,
  PrismaClient,
  DistrictStatus,
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  HistoryActionType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { CATEGORY_TREE, LEGACY_CATEGORY_MAP } from './seed-data/categories';
import {
  ANALYTICS_KEYS,
  MAP_LAYERS,
  PERMISSIONS,
  ROLES,
} from './seed-data/roles-permissions';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'admin123';
const DEMO_PREFIX = '[Nümunə]';

type GeoJsonFeature = {
  type: string;
  properties?: Record<string, unknown>;
  geometry: unknown;
};

type GeoJsonFeatureCollection = {
  type: string;
  features: GeoJsonFeature[];
};

function loadNarimanovGeojson(): GeoJsonFeature {
  const filePath = path.join(
    __dirname,
    '../../frontend/public/narimanov-rayon.geojson',
  );
  const collection = JSON.parse(
    fs.readFileSync(filePath, 'utf-8'),
  ) as GeoJsonFeatureCollection;
  const feature = collection.features.find(
    (f: GeoJsonFeature) =>
      f.properties && (f.properties as { Name?: string }).Name === 'Narimanov',
  );
  if (!feature) {
    throw new Error('Narimanov feature not found in narimanov-rayon.geojson');
  }
  return feature;
}

const NARIMANOV_GEOJSON = loadNarimanovGeojson();

const GEOZONE_ID = '00000000-0000-4000-8000-000000000001';
const MUNICIPALITY_ORG_ID = '00000000-0000-4000-8000-000000000010';
const AZERIQAZ_ORG_ID = '00000000-0000-4000-8000-000000000011';

type LegacyCategory = keyof typeof LEGACY_CATEGORY_MAP;

const DEMO_INCIDENTS: Array<{
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  legacyCategory: LegacyCategory;
  type: IncidentType;
  lat: number;
  lng: number;
  address: string;
  assign?: boolean;
  deadline?: Date;
  slaDueAt?: Date;
  resolvedAt?: Date;
}> = [
  {
    title: `${DEMO_PREFIX} Su borusunda partlayış — Nərimanov pr.`,
    description: 'Girişdə su sıxması. Təcili briqada ərazidədir.',
    status: IncidentStatus.IN_PROGRESS,
    priority: IncidentPriority.CRITICAL,
    legacyCategory: 'WATER',
    type: IncidentType.ACCIDENT,
    lat: 40.4133,
    lng: 49.8561,
    address: 'Nərimanov pr., 87, Nərimanov r-n, Bakı',
    assign: true,
  },
  {
    title: `${DEMO_PREFIX} İşıq dirəkləri yanmır — Bəbək küç.`,
    description: 'Həyətdə 5 işıq dirəyi işləmir. Yeni müraciət.',
    status: IncidentStatus.NEW,
    priority: IncidentPriority.MEDIUM,
    legacyCategory: 'LIGHTING',
    type: IncidentType.COMPLAINT,
    lat: 40.4043,
    lng: 49.8591,
    address: 'Bəbək küç., 45, Nərimanov r-n, Bakı',
  },
  {
    title: `${DEMO_PREFIX} Çuxur — Üzeyir Hacıbəyov küç.`,
    description: 'Dərin çuxur. Zolağın bağlanması razılaşdırılır.',
    status: IncidentStatus.PENDING,
    priority: IncidentPriority.HIGH,
    legacyCategory: 'ROADS',
    type: IncidentType.COMPLAINT,
    lat: 40.4153,
    lng: 49.8491,
    address: 'Üzeyir Hacıbəyov küç., 12, Nərimanov r-n, Bakı',
    assign: true,
  },
  {
    title: `${DEMO_PREFIX} Qaz qoxusu — Təbriz Xanım küç.`,
    description: 'Sakinlər qaz qoxusu barədə məlumat verib. SLA gecikib.',
    status: IncidentStatus.OVERDUE,
    priority: IncidentPriority.CRITICAL,
    legacyCategory: 'GAS',
    type: IncidentType.EMERGENCY,
    lat: 40.4023,
    lng: 49.8481,
    address: 'Təbriz Xanım küç., 28, Nərimanov r-n, Bakı',
    deadline: new Date(Date.now() - 86400000),
    slaDueAt: new Date(Date.now() - 43200000),
  },
  {
    title: `${DEMO_PREFIX} Tullantı daşınıb — Gənclik mkr.`,
    description: 'Konteynerlər boşaldılıb, müraciət bağlanıb.',
    status: IncidentStatus.RESOLVED,
    priority: IncidentPriority.LOW,
    legacyCategory: 'WASTE',
    type: IncidentType.COMPLAINT,
    lat: 40.4123,
    lng: 49.8611,
    address: 'Gənclik mkr., 15, Nərimanov r-n, Bakı',
    resolvedAt: new Date(Date.now() - 3600000),
  },
  {
    title: `${DEMO_PREFIX} Kabel zədələnib — Nərimanov m.`,
    description: 'Qismən elektrik kəsintisi. Təmir davam edir.',
    status: IncidentStatus.IN_PROGRESS,
    priority: IncidentPriority.HIGH,
    legacyCategory: 'ELECTRICITY',
    type: IncidentType.ACCIDENT,
    lat: 40.4063,
    lng: 49.8551,
    address: 'Nərimanov pr., 202, Nərimanov m. yaxınlığı, Bakı',
    assign: true,
  },
  {
    title: `${DEMO_PREFIX} Kafedən səs-küy (arxiv)`,
    description: 'Yoxlama aparılıb, qərar verilib. İş arxivləşdirilib.',
    status: IncidentStatus.ARCHIVED,
    priority: IncidentPriority.LOW,
    legacyCategory: 'OTHER',
    type: IncidentType.COMPLAINT,
    lat: 40.4083,
    lng: 49.8521,
    address: 'Axmed Rəcəbli küç., 8, Nərimanov r-n, Bakı',
    resolvedAt: new Date(Date.now() - 86400000 * 30),
  },
  {
    title: `${DEMO_PREFIX} Uşaq meydançası — yoxlama`,
    description: 'Sınmış yellənçək, müfəttiş yoxlaması lazımdır.',
    status: IncidentStatus.NEW,
    priority: IncidentPriority.MEDIUM,
    legacyCategory: 'OTHER',
    type: IncidentType.INSPECTION,
    lat: 40.411,
    lng: 49.8505,
    address: 'Akademik Xanəli Rzaev küç., 3, Nərimanov r-n, Bakı',
  },
  {
    title: `${DEMO_PREFIX} Qapaqsız manhole — Nərimanov pr.`,
    description: 'Təhlükəli manhole. Anbar qapağının gözlənilməsi.',
    status: IncidentStatus.PENDING,
    priority: IncidentPriority.HIGH,
    legacyCategory: 'ROADS',
    type: IncidentType.EMERGENCY,
    lat: 40.4105,
    lng: 49.854,
    address: 'Nərimanov pr., 156, Nərimanov r-n, Bakı',
    assign: true,
  },
  {
    title: `${DEMO_PREFIX} Pilləkən işıqları dəyişdirilib`,
    description: 'Bütün lampalar dəyişilib, akt imzalanıb.',
    status: IncidentStatus.RESOLVED,
    priority: IncidentPriority.LOW,
    legacyCategory: 'LIGHTING',
    type: IncidentType.COMPLAINT,
    lat: 40.4078,
    lng: 49.8575,
    address: 'Bəbək küç., 102, Nərimanov r-n, Bakı',
    resolvedAt: new Date(),
  },
  {
    title: `${DEMO_PREFIX} Su sayğacı yoxlaması gecikib`,
    description: 'Planlı yoxlama vaxtı keçib.',
    status: IncidentStatus.OVERDUE,
    priority: IncidentPriority.MEDIUM,
    legacyCategory: 'WATER',
    type: IncidentType.INSPECTION,
    lat: 40.4055,
    lng: 49.8518,
    address: 'Hüseyn Cəbbar küç., 22, Nərimanov r-n, Bakı',
    slaDueAt: new Date(Date.now() - 7200000),
    assign: true,
  },
  {
    title: `${DEMO_PREFIX} Sıradan çıxmış işıqfor (arxiv)`,
    description: 'Keçən rübdə təmir edilib.',
    status: IncidentStatus.ARCHIVED,
    priority: IncidentPriority.HIGH,
    legacyCategory: 'ROADS',
    type: IncidentType.ACCIDENT,
    lat: 40.414,
    lng: 49.8488,
    address: 'Nərimanov küç., 5, Nərimanov r-n, Bakı',
    resolvedAt: new Date(Date.now() - 86400000 * 60),
  },
];

async function seedCategories(): Promise<Map<string, string>> {
  const keyToId = new Map<string, string>();

  async function upsertNode(
    node: (typeof CATEGORY_TREE)[number],
    parentId?: string,
  ): Promise<void> {
    const category = await prisma.category.upsert({
      where: { key: node.key },
      update: { name: node.name, parentId, serviceOwner: node.serviceOwner },
      create: {
        key: node.key,
        name: node.name,
        parentId,
        serviceOwner: node.serviceOwner,
      },
    });
    keyToId.set(node.key, category.id);
    for (const child of node.children ?? []) {
      await upsertNode(child, category.id);
    }
  }

  for (const root of CATEGORY_TREE) {
    await upsertNode(root);
  }

  return keyToId;
}

async function seedRolesAndPermissions() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
  }

  for (const role of ROLES) {
    const dbRole = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name, incidentScope: role.incidentScope },
      create: {
        key: role.key,
        name: role.name,
        incidentScope: role.incidentScope,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: dbRole.id } });
    for (const permKey of role.permissions) {
      const perm = await prisma.permission.findUnique({ where: { key: permKey } });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: dbRole.id, permissionId: perm.id },
        });
      }
    }
  }
}

async function resolveDistrictStatus(lat: number, lng: number): Promise<DistrictStatus> {
  const rows = await prisma.$queryRaw<Array<{ within: boolean }>>`
    SELECT ST_Within(
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
      ST_SetSRID(ST_GeomFromGeoJSON(geojson->'geometry'), 4326)
    ) AS within
    FROM geozones
    WHERE id = ${GEOZONE_ID}
  `;
  return rows[0]?.within ? DistrictStatus.WITHIN_DISTRICT : DistrictStatus.OUTSIDE_DISTRICT;
}

async function grantFullAccess(userId: string, categoryIds: string[]) {
  await prisma.userCategoryAccess.deleteMany({ where: { userId } });
  await prisma.userGeozoneAccess.deleteMany({ where: { userId } });
  await prisma.userMapLayerAccess.deleteMany({ where: { userId } });
  await prisma.userAnalyticsAccess.deleteMany({ where: { userId } });

  for (const categoryId of categoryIds) {
    await prisma.userCategoryAccess.create({ data: { userId, categoryId } });
  }
  await prisma.userGeozoneAccess.create({
    data: { userId, geozoneId: GEOZONE_ID },
  });
  for (const layerKey of MAP_LAYERS) {
    await prisma.userMapLayerAccess.create({ data: { userId, layerKey } });
  }
  for (const analyticsKey of ANALYTICS_KEYS) {
    await prisma.userAnalyticsAccess.create({ data: { userId, analyticsKey } });
  }
}

async function grantGasOnlyAccess(userId: string, categoryKeyToId: Map<string, string>) {
  const gasId = categoryKeyToId.get('gas');
  const utilitiesId = categoryKeyToId.get('utilities');
  if (!gasId || !utilitiesId) return;

  await prisma.userCategoryAccess.deleteMany({ where: { userId } });
  await prisma.userGeozoneAccess.deleteMany({ where: { userId } });
  await prisma.userMapLayerAccess.deleteMany({ where: { userId } });
  await prisma.userAnalyticsAccess.deleteMany({ where: { userId } });

  await prisma.userCategoryAccess.createMany({
    data: [
      { userId, categoryId: utilitiesId },
      { userId, categoryId: gasId },
    ],
  });
  await prisma.userGeozoneAccess.create({
    data: { userId, geozoneId: GEOZONE_ID },
  });
  await prisma.userMapLayerAccess.create({
    data: { userId, layerKey: 'gas_incidents' },
  });
  await prisma.userAnalyticsAccess.createMany({
    data: [
      { userId, analyticsKey: 'kpis' },
      { userId, analyticsKey: 'by_category' },
      { userId, analyticsKey: 'gas_statistics' },
      { userId, analyticsKey: 'response_time' },
    ],
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.organization.upsert({
    where: { id: MUNICIPALITY_ORG_ID },
    update: { name: 'Bakı Şəhər İdarəsi', type: 'municipality' },
    create: {
      id: MUNICIPALITY_ORG_ID,
      name: 'Bakı Şəhər İdarəsi',
      type: 'municipality',
    },
  });

  await prisma.organization.upsert({
    where: { id: AZERIQAZ_ORG_ID },
    update: { name: 'Azeriqaz', type: 'utility' },
    create: { id: AZERIQAZ_ORG_ID, name: 'Azeriqaz', type: 'utility' },
  });

  await seedRolesAndPermissions();
  const categoryKeyToId = await seedCategories();
  const allCategoryIds = [...categoryKeyToId.values()];

  const roleMap = Object.fromEntries(
    (await prisma.role.findMany()).map((r) => [r.key, r.id]),
  );

  await prisma.geozone.upsert({
    where: { id: GEOZONE_ID },
    update: {
      name: 'Nərimanov rayonu',
      description: 'Xidmət zonası — Nərimanov, Bakı şəhəri',
      color: '#2563eb',
      geojson: NARIMANOV_GEOJSON as Prisma.InputJsonValue,
    },
    create: {
      id: GEOZONE_ID,
      name: 'Nərimanov rayonu',
      description: 'Xidmət zonası — Nərimanov, Bakı şəhəri',
      color: '#2563eb',
      geojson: NARIMANOV_GEOJSON as Prisma.InputJsonValue,
    },
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@municipal.local' },
      update: {
        name: 'Sistem Admini',
        department: 'İT',
        roleId: roleMap.super_admin,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'admin@municipal.local',
        passwordHash,
        name: 'Sistem Admini',
        roleId: roleMap.super_admin,
        department: 'İT',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'dispatcher@municipal.local' },
      update: {
        name: 'Aynur Dispetçer',
        department: 'Dispatch mərkəzi',
        roleId: roleMap.dispatcher,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'dispatcher@municipal.local',
        passwordHash,
        name: 'Aynur Dispetçer',
        roleId: roleMap.dispatcher,
        department: 'Dispatch mərkəzi',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'executor@municipal.local' },
      update: {
        name: 'Rəşad İcraçı',
        department: 'Kommunal xidmət',
        roleId: roleMap.field_worker,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'executor@municipal.local',
        passwordHash,
        name: 'Rəşad İcraçı',
        roleId: roleMap.field_worker,
        department: 'Kommunal xidmət',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@municipal.local' },
      update: {
        name: 'Leyla Analitik',
        department: 'Analitika',
        roleId: roleMap.analyst,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'analyst@municipal.local',
        passwordHash,
        name: 'Leyla Analitik',
        roleId: roleMap.analyst,
        department: 'Analitika',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'azeriqaz@municipal.local' },
      update: {
        name: 'Kamran Azeriqaz',
        department: 'Qaz xidməti',
        roleId: roleMap.utility_operator,
        organizationId: AZERIQAZ_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'azeriqaz@municipal.local',
        passwordHash,
        name: 'Kamran Azeriqaz',
        roleId: roleMap.utility_operator,
        department: 'Qaz xidməti',
        organizationId: AZERIQAZ_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'viewer@municipal.local' },
      update: {
        name: 'Səid Baxıcı',
        department: 'Monitorinq',
        roleId: roleMap.viewer,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'viewer@municipal.local',
        passwordHash,
        name: 'Səid Baxıcı',
        roleId: roleMap.viewer,
        department: 'Monitorinq',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
  ]);

  const [, dispatcher, executor, , azeriqaz] = users;

  for (const u of users) {
    if (u.email === 'azeriqaz@municipal.local') {
      await grantGasOnlyAccess(u.id, categoryKeyToId);
    } else {
      await grantFullAccess(u.id, allCategoryIds);
    }
  }

  await prisma.incident.deleteMany({
    where: {
      OR: [
        { title: { startsWith: DEMO_PREFIX } },
        { title: { startsWith: '[Демо]' } },
        { title: { startsWith: '[Demo]' } },
      ],
    },
  });

  for (const demo of DEMO_INCIDENTS) {
    const categoryKey = LEGACY_CATEGORY_MAP[demo.legacyCategory];
    const categoryId = categoryKeyToId.get(categoryKey);
    if (!categoryId) continue;

    const isGas = demo.legacyCategory === 'GAS';
    const slaDueAt =
      demo.slaDueAt ??
      new Date(
        Date.now() +
          (demo.priority === IncidentPriority.CRITICAL
            ? 4
            : demo.priority === IncidentPriority.HIGH
              ? 12
              : 24) *
            3600000,
      );

    const districtStatus = await resolveDistrictStatus(demo.lat, demo.lng);
    const incident = await prisma.incident.create({
      data: {
        title: demo.title,
        description: demo.description,
        status: demo.status,
        priority: demo.priority,
        categoryId,
        type: demo.type,
        lat: demo.lat,
        lng: demo.lng,
        address: demo.address,
        geozoneId: districtStatus === DistrictStatus.WITHIN_DISTRICT ? GEOZONE_ID : null,
        districtStatus,
        organizationId: isGas ? AZERIQAZ_ORG_ID : MUNICIPALITY_ORG_ID,
        deadline: demo.deadline,
        slaDueAt,
        resolvedAt: demo.resolvedAt,
        assignedToId: demo.assign ? executor.id : undefined,
        createdById: dispatcher.id,
      },
    });

    await prisma.incidentHistory.create({
      data: {
        incidentId: incident.id,
        actionType: HistoryActionType.CREATED,
        newValue: incident.status,
        createdById: dispatcher.id,
      },
    });

    if (districtStatus === DistrictStatus.OUTSIDE_DISTRICT) {
      await prisma.auditLog.create({
        data: {
          userId: dispatcher.id,
          action: 'INCIDENT_OUTSIDE_DISTRICT',
          resource: 'incident',
          resourceId: incident.id,
          metadata: { lat: demo.lat, lng: demo.lng, seed: true },
        },
      });
    }
  }

  const outsideCategoryId = categoryKeyToId.get('street_dirt');
  if (outsideCategoryId) {
    const outsideLat = 40.365;
    const outsideLng = 49.92;
    const outsideIncident = await prisma.incident.create({
      data: {
        title: `${DEMO_PREFIX} Rayon xaricində zibillik — Bayıl`,
        description: 'Koordinatlar Nərimanov rayonu sərhədinin kənarındadır.',
        status: IncidentStatus.NEW,
        priority: IncidentPriority.MEDIUM,
        categoryId: outsideCategoryId,
        type: IncidentType.COMPLAINT,
        lat: outsideLat,
        lng: outsideLng,
        address: 'Bayıl, Bakı (rayon xaricində)',
        districtStatus: DistrictStatus.OUTSIDE_DISTRICT,
        geozoneId: null,
        organizationId: MUNICIPALITY_ORG_ID,
        slaDueAt: new Date(Date.now() + 24 * 3600000),
        createdById: dispatcher.id,
      },
    });
    await prisma.incidentHistory.create({
      data: {
        incidentId: outsideIncident.id,
        actionType: HistoryActionType.CREATED,
        newValue: outsideIncident.status,
        createdById: dispatcher.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: dispatcher.id,
        action: 'INCIDENT_OUTSIDE_DISTRICT',
        resource: 'incident',
        resourceId: outsideIncident.id,
        metadata: { lat: outsideLat, lng: outsideLng, seed: true },
      },
    });
  }

  console.log(
    `Seed complete: ${DEMO_INCIDENTS.length + 1} demo incidents, ${users.length} users. Password: ${DEFAULT_PASSWORD}`,
  );
  console.log(`Azeriqaz demo: azeriqaz@municipal.local / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
