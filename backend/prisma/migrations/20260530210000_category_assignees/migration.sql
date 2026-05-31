-- CreateEnum
CREATE TYPE "CategoryAssigneeKind" AS ENUM ('TEAM', 'PERSON');

-- CreateTable
CREATE TABLE "category_assignees" (
    "id" TEXT NOT NULL,
    "kind" "CategoryAssigneeKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "organization_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_assignee_categories" (
    "assignee_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "category_assignee_categories_pkey" PRIMARY KEY ("assignee_id","category_id")
);

-- CreateIndex
CREATE INDEX "category_assignees_kind_idx" ON "category_assignees"("kind");

-- CreateIndex
CREATE INDEX "category_assignees_is_active_idx" ON "category_assignees"("is_active");

-- AddForeignKey
ALTER TABLE "category_assignees" ADD CONSTRAINT "category_assignees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_assignee_categories" ADD CONSTRAINT "category_assignee_categories_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "category_assignees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_assignee_categories" ADD CONSTRAINT "category_assignee_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
