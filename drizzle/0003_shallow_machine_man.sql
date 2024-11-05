DROP INDEX IF EXISTS "Groups_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "Groups_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "Links_id_unique";--> statement-breakpoint
ALTER TABLE `Groups` ALTER COLUMN "deleteddAt" TO "deleteddAt" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_id_unique` ON `Groups` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_token_unique` ON `Groups` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `Links_id_unique` ON `Links` (`id`);--> statement-breakpoint
ALTER TABLE `Links` ALTER COLUMN "deleteddAt" TO "deleteddAt" integer;