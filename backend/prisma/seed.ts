import {
  Prisma,
  PrismaClient,
  DistrictStatus,
  IncidentStatus,
  IncidentPriority,
  HistoryActionType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { CATEGORY_TREE } from './seed-data/categories';
import {
  attachOpsToGroups,
  groupDescription,
  type SeededReportGroup,
} from './seed-data/demo-report-groups';
import { buildDemoOperatorIncidents } from './seed-data/demo-operator-incidents';
import {
  buildDemoReports,
  type CitizenReporterKey,
  SEED_DESCRIPTION_TAG,
} from './seed-data/demo-reports';
import { groupReports, primaryReport } from './seed-data/group-reports';
import { centroidFromCoordinates } from '../src/incidents/incident-proximity';
import {
  buildOperatorIncidentTimelineSeed,
  buildReportGroupTimelineSeed,
  reportGroupTitle,
  reportGroupType,
  type TimelineActorKey,
} from './seed-data/incident-timeline-seed';
import {
  ANALYTICS_KEYS,
  MAP_LAYERS,
  PERMISSIONS,
  ROLES,
} from './seed-data/roles-permissions';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'admin123';
const LEGACY_DEMO_PREFIXES = ['[Nümunə]', '[Демо]', '[Demo]'];

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
    '../data/narimanov-district/boundary.geojson',
  );
  const collection = JSON.parse(
    fs.readFileSync(filePath, 'utf-8'),
  ) as GeoJsonFeatureCollection;
  const feature = collection.features[0];
  if (!feature) {
    throw new Error(
      'Narimanov boundary missing; run npm run district:extract in backend',
    );
  }
  return feature;
}

const NARIMANOV_GEOJSON = loadNarimanovGeojson();

const GEOZONE_ID = '00000000-0000-4000-8000-000000000001';
const MUNICIPALITY_ORG_ID = '00000000-0000-4000-8000-000000000010';
const AZERIQAZ_ORG_ID = '00000000-0000-4000-8000-000000000011';

function slaHours(priority: IncidentPriority): number {
  switch (priority) {
    case IncidentPriority.CRITICAL:
      return 4;
    case IncidentPriority.HIGH:
      return 12;
    case IncidentPriority.MEDIUM:
      return 24;
    default:
      return 48;
  }
}

function createdAtFromDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + (daysAgo % 10), (daysAgo * 7) % 60, 0, 0);
  return d;
}

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
    prisma.user.upsert({
      where: { email: 'citizen1@municipal.local' },
      update: {
        name: 'Nərgiz Əliyeva',
        department: 'Sakin',
        roleId: roleMap.viewer,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'citizen1@municipal.local',
        passwordHash,
        name: 'Nərgiz Əliyeva',
        roleId: roleMap.viewer,
        department: 'Sakin',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'citizen2@municipal.local' },
      update: {
        name: 'Elvin Məmmədov',
        department: 'Sakin',
        roleId: roleMap.viewer,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'citizen2@municipal.local',
        passwordHash,
        name: 'Elvin Məmmədov',
        roleId: roleMap.viewer,
        department: 'Sakin',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
    prisma.user.upsert({
      where: { email: 'citizen3@municipal.local' },
      update: {
        name: 'Günel Həsənova',
        department: 'Sakin',
        roleId: roleMap.viewer,
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
      create: {
        email: 'citizen3@municipal.local',
        passwordHash,
        name: 'Günel Həsənova',
        roleId: roleMap.viewer,
        department: 'Sakin',
        organizationId: MUNICIPALITY_ORG_ID,
        defaultGeozoneId: GEOZONE_ID,
      },
    }),
  ]);

  const [, dispatcher, executor, , azeriqaz] = users;

  const citizenReporterIds: Record<CitizenReporterKey, string> = {
    citizen1: users.find((u) => u.email === 'citizen1@municipal.local')!.id,
    citizen2: users.find((u) => u.email === 'citizen2@municipal.local')!.id,
    citizen3: users.find((u) => u.email === 'citizen3@municipal.local')!.id,
  };

  const resolveTimelineActorId = (actor: TimelineActorKey): string => {
    if (actor === 'dispatcher') return dispatcher.id;
    if (actor === 'executor') return executor.id;
    if (actor === 'utility') return azeriqaz.id;
    return citizenReporterIds[actor];
  };

  for (const u of users) {
    if (u.email === 'azeriqaz@municipal.local') {
      await grantGasOnlyAccess(u.id, categoryKeyToId);
    } else {
      await grantFullAccess(u.id, allCategoryIds);
    }
  }

  const seedIncidentWhere = {
    description: { contains: '[seed:v' },
  };

  await prisma.incidentReport.deleteMany({
    where: { incident: seedIncidentWhere },
  });
  await prisma.incidentComment.deleteMany({
    where: { incident: seedIncidentWhere },
  });
  await prisma.incidentHistory.deleteMany({
    where: { incident: seedIncidentWhere },
  });
  await prisma.attachment.deleteMany({
    where: { incident: seedIncidentWhere },
  });
  await prisma.incident.deleteMany({
    where: {
      OR: [
        seedIncidentWhere,
        ...LEGACY_DEMO_PREFIXES.map((prefix) => ({
          title: { startsWith: prefix },
        })),
      ],
    },
  });

  let seededCount = 0;
  let reportRows = 0;

  async function seedTimeline(
    incidentId: string,
    createdAt: Date,
    timeline: ReturnType<typeof buildReportGroupTimelineSeed>,
  ) {
    for (const entry of timeline) {
      const eventAt = new Date(createdAt.getTime() + entry.offsetMs);
      const actorId = resolveTimelineActorId(entry.actor);

      if (entry.actionType === HistoryActionType.COMMENT && entry.newValue) {
        await prisma.incidentComment.create({
          data: {
            incidentId,
            authorId: actorId,
            body: entry.newValue,
            createdAt: eventAt,
          },
        });
      }

      await prisma.incidentHistory.create({
        data: {
          incidentId,
          actionType: entry.actionType,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          createdById: actorId,
          createdAt: eventAt,
        },
      });
    }
  }

  async function seedReportGroup(group: SeededReportGroup) {
    const lead = primaryReport(group);
    const categoryId = categoryKeyToId.get(lead.categoryKey);
    if (!categoryId) {
      console.warn(`Skip seed group — unknown category: ${lead.categoryKey}`);
      return;
    }

    const subcategoryId = lead.subcategoryKey
      ? categoryKeyToId.get(lead.subcategoryKey)
      : undefined;

    const createdAt = createdAtFromDaysAgo(lead.daysAgo);
    const { ops } = group;
    const slaDueAt = new Date(
      createdAt.getTime() + slaHours(ops.priority) * 3600000,
    );

    let districtStatus =
      ops.districtStatus ?? (await resolveDistrictStatus(group.centroid.lat, group.centroid.lng));

    if (ops.districtStatus === DistrictStatus.OUTSIDE_DISTRICT) {
      districtStatus = DistrictStatus.OUTSIDE_DISTRICT;
    }

    const isResolved =
      ops.status === IncidentStatus.RESOLVED ||
      ops.status === IncidentStatus.ARCHIVED;
    const isOverdue = ops.status === IncidentStatus.OVERDUE;

    const resolvedAt = isResolved
      ? new Date(createdAt.getTime() + 8 * 3600000)
      : undefined;

    const effectiveSlaDueAt = isOverdue
      ? new Date(Date.now() - 3 * 3600000)
      : slaDueAt;

    const incident = await prisma.incident.create({
      data: {
        title: reportGroupTitle(group),
        description: groupDescription(group),
        status: ops.status,
        priority: ops.priority,
        categoryId,
        subcategoryId,
        type: reportGroupType(group),
        lat: group.centroid.lat,
        lng: group.centroid.lng,
        address: lead.address,
        geozoneId:
          districtStatus === DistrictStatus.WITHIN_DISTRICT ? GEOZONE_ID : null,
        districtStatus,
        organizationId:
          ops.organization === 'azeriqaz'
            ? AZERIQAZ_ORG_ID
            : MUNICIPALITY_ORG_ID,
        slaDueAt: effectiveSlaDueAt,
        deadline: isOverdue ? effectiveSlaDueAt : undefined,
        resolvedAt,
        assignedToId: ops.assign ? executor.id : undefined,
        createdById: dispatcher.id,
        createdAt,
        updatedAt: resolvedAt ?? createdAt,
      },
    });

    seededCount++;

    const sortedReports = [...group.reports].sort((a, b) => a.daysAgo - b.daysAgo);
    for (const r of sortedReports) {
      const reportAt = createdAtFromDaysAgo(r.daysAgo);
      await prisma.incidentReport.create({
        data: {
          incidentId: incident.id,
          reporterId: citizenReporterIds[r.reporterKey],
          title: r.title,
          message: r.message,
          lat: r.lat,
          lng: r.lng,
          address: r.address,
          createdAt: reportAt,
        },
      });
      reportRows++;
    }

    const centroid = centroidFromCoordinates(sortedReports);
    if (centroid) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { lat: centroid.lat, lng: centroid.lng },
      });
    }

    const timeline = buildReportGroupTimelineSeed(group);
    await seedTimeline(incident.id, createdAt, timeline);

    if (districtStatus === DistrictStatus.OUTSIDE_DISTRICT) {
      await prisma.auditLog.create({
        data: {
          userId: dispatcher.id,
          action: 'INCIDENT_OUTSIDE_DISTRICT',
          resource: 'incident',
          resourceId: incident.id,
          metadata: { lat: group.centroid.lat, lng: group.centroid.lng, seed: true },
        },
      });
    }
  }

  const reportGroups = attachOpsToGroups(groupReports(buildDemoReports()));
  for (const group of reportGroups) {
    await seedReportGroup(group);
  }

  for (const demo of buildDemoOperatorIncidents()) {
    const categoryId = categoryKeyToId.get(demo.categoryKey);
    if (!categoryId) continue;

    const subcategoryId = demo.subcategoryKey
      ? categoryKeyToId.get(demo.subcategoryKey)
      : undefined;

    const createdAt = createdAtFromDaysAgo(demo.daysAgo);
    const slaDueAt = new Date(
      createdAt.getTime() + slaHours(demo.priority) * 3600000,
    );

    let districtStatus =
      demo.districtStatus ?? (await resolveDistrictStatus(demo.lat, demo.lng));

    const isResolved =
      demo.status === IncidentStatus.RESOLVED ||
      demo.status === IncidentStatus.ARCHIVED;
    const isOverdue = demo.status === IncidentStatus.OVERDUE;
    const resolvedAt = isResolved
      ? new Date(createdAt.getTime() + 8 * 3600000)
      : undefined;
    const effectiveSlaDueAt = isOverdue
      ? new Date(Date.now() - 3 * 3600000)
      : slaDueAt;

    const incident = await prisma.incident.create({
      data: {
        title: demo.title,
        description: demo.description,
        status: demo.status,
        priority: demo.priority,
        categoryId,
        subcategoryId,
        type: demo.type,
        lat: demo.lat,
        lng: demo.lng,
        address: demo.address,
        geozoneId:
          districtStatus === DistrictStatus.WITHIN_DISTRICT ? GEOZONE_ID : null,
        districtStatus,
        organizationId:
          demo.organization === 'azeriqaz'
            ? AZERIQAZ_ORG_ID
            : MUNICIPALITY_ORG_ID,
        slaDueAt: effectiveSlaDueAt,
        deadline: isOverdue ? effectiveSlaDueAt : undefined,
        resolvedAt,
        assignedToId: demo.assign ? executor.id : undefined,
        createdById: dispatcher.id,
        createdAt,
        updatedAt: resolvedAt ?? createdAt,
      },
    });

    seededCount++;

    if (demo.lateReports?.length) {
      for (const r of demo.lateReports) {
        const reportAt = createdAtFromDaysAgo(r.daysAgo);
        await prisma.incidentReport.create({
          data: {
            incidentId: incident.id,
            reporterId: citizenReporterIds[r.reporterKey],
            title: r.title,
            message: r.message,
            lat: r.lat,
            lng: r.lng,
            address: r.address,
            createdAt: reportAt,
          },
        });
        reportRows++;
      }

      const centroid = centroidFromCoordinates(demo.lateReports);
      if (centroid) {
        await prisma.incident.update({
          where: { id: incident.id },
          data: { lat: centroid.lat, lng: centroid.lng },
        });
      }
    }

    const timeline = buildOperatorIncidentTimelineSeed(demo);
    await seedTimeline(incident.id, createdAt, timeline);
  }

  console.log(
    `Seed complete: ${seededCount} incidents, ${reportRows} citizen reports, ${users.length} users. Password: ${DEFAULT_PASSWORD}`,
  );
  console.log(`Azeriqaz demo: azeriqaz@municipal.local / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
