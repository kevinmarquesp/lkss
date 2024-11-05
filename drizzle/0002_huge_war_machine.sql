ALTER TABLE `Groups` ADD `token` text(12) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `Groups_token_unique` ON `Groups` (`token`);