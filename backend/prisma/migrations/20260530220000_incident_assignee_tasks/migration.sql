-- CreateEnum
CREATE TYPE "IncidentAssigneeTaskStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "incident_assignee_tasks" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "IncidentAssigneeTaskStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_by" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_assignee_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_assignee_tasks_incident_id_idx" ON "incident_assignee_tasks"("incident_id");
CREATE INDEX "incident_assignee_tasks_assignee_id_idx" ON "incident_assignee_tasks"("assignee_id");
CREATE INDEX "incident_assignee_tasks_starts_at_idx" ON "incident_assignee_tasks"("starts_at");
CREATE INDEX "incident_assignee_tasks_ends_at_idx" ON "incident_assignee_tasks"("ends_at");
CREATE INDEX "incident_assignee_tasks_status_idx" ON "incident_assignee_tasks"("status");

-- AddForeignKey
ALTER TABLE "incident_assignee_tasks" ADD CONSTRAINT "incident_assignee_tasks_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incident_assignee_tasks" ADD CONSTRAINT "incident_assignee_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "category_assignees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incident_assignee_tasks" ADD CONSTRAINT "incident_assignee_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Overlap prevention is enforced in application logic (see IncidentTasksService).
