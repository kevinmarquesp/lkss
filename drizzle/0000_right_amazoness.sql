CREATE TABLE `Groups` (
	`id` text(8) NOT NULL,
	`title` text DEFAULT 'Link groups' NOT NULL,
	`token` text(12) NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_id_unique` ON `Groups` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_token_unique` ON `Groups` (`token`);--> statement-breakpoint
CREATE TABLE `Links` (
	`id` text(8) NOT NULL,
	`groupId` text(8),
	`url` text NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`groupId`) REFERENCES `Groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Links_id_unique` ON `Links` (`id`);