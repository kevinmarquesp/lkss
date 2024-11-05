ALTER TABLE `Links` RENAME COLUMN "target" TO "url";--> statement-breakpoint
ALTER TABLE `Links` ADD `updatedAt` integer DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Links` ADD `deleteddAt` integer DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Groups` ADD `updatedAt` integer DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Groups` ADD `deleteddAt` integer DEFAULT CURRENT_TIMESTAMP;