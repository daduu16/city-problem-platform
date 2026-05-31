-- CreateEnum
CREATE TYPE "IncidentAssigneeTaskScheduleType" AS ENUM ('FIXED', 'WINDOW');

-- AlterTable
ALTER TABLE "incident_assignee_tasks"
ADD COLUMN "schedule_type" "IncidentAssigneeTaskScheduleType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "estimated_minutes" INTEGER;
