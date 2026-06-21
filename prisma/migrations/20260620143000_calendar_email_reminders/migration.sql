ALTER TABLE "CalendarEvent"
ADD COLUMN IF NOT EXISTS "reminderMinutes" INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "CalendarEvent_reminderSentAt_startAt_idx"
ON "CalendarEvent"("reminderSentAt", "startAt");
