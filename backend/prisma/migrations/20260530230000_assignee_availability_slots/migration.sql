-- CreateEnum
CREATE TYPE "AssigneeAvailabilityKind" AS ENUM ('WEEKLY', 'DATE');
CREATE TYPE "AssigneeAvailabilitySlotType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "assignee_availability_slots" (
    "id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "kind" "AssigneeAvailabilityKind" NOT NULL,
    "day_of_week" INTEGER,
    "date" DATE,
    "slot_type" "AssigneeAvailabilitySlotType" NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignee_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignee_availability_slots_assignee_id_idx" ON "assignee_availability_slots"("assignee_id");
CREATE INDEX "assignee_availability_slots_assignee_id_kind_idx" ON "assignee_availability_slots"("assignee_id", "kind");
CREATE INDEX "assignee_availability_slots_assignee_id_date_idx" ON "assignee_availability_slots"("assignee_id", "date");

-- AddForeignKey
ALTER TABLE "assignee_availability_slots" ADD CONSTRAINT "assignee_availability_slots_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "category_assignees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
