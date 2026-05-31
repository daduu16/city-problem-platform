/**
 * Verifies migrations applied and demo data present after init.
 * Exit 0 on success, 1 on failure.
 */
const { PrismaClient } = require('@prisma/client');

const SEED_ASSIGNEE_MARKER_ID = '00000000-0000-4000-8000-000000000201';
const MIN_USERS = 5;
const MIN_ASSIGNEES = 6;
const MIN_CATEGORIES = 20;

async function main() {
  const prisma = new PrismaClient();
  const errors = [];

  try {
    const [userCount, assigneeCount, categoryCount, marker] = await Promise.all([
      prisma.user.count(),
      prisma.categoryAssignee.count(),
      prisma.category.count(),
      prisma.categoryAssignee.findUnique({
        where: { id: SEED_ASSIGNEE_MARKER_ID },
        select: { name: true },
      }),
    ]);

    if (userCount < MIN_USERS) {
      errors.push(`users: expected at least ${MIN_USERS}, got ${userCount}`);
    }
    if (categoryCount < MIN_CATEGORIES) {
      errors.push(
        `categories: expected at least ${MIN_CATEGORIES}, got ${categoryCount}`,
      );
    }
    if (assigneeCount < MIN_ASSIGNEES) {
      errors.push(
        `assignees: expected at least ${MIN_ASSIGNEES}, got ${assigneeCount}`,
      );
    }
    if (!marker) {
      errors.push(
        `assignees: demo executor ${SEED_ASSIGNEE_MARKER_ID} not found`,
      );
    }

    if (errors.length > 0) {
      console.error('[db:verify] FAILED');
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }

    console.log(
      `[db:verify] OK — users=${userCount}, categories=${categoryCount}, assignees=${assigneeCount} (${marker.name})`,
    );
    process.exit(0);
  } catch (err) {
    console.error('[db:verify] FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
