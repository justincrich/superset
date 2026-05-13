ALTER TABLE "automations" ADD COLUMN "agent" text;--> statement-breakpoint
UPDATE "automations" SET "agent" = "agent_config" ->> 'id' WHERE "agent" IS NULL;--> statement-breakpoint
ALTER TABLE "automations" ALTER COLUMN "agent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "automations" DROP COLUMN "agent_config";