CREATE TABLE `user_sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
DROP INDEX `users_mobile_idx` ON `users`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `user_type` enum('retailer','contractor','consumer') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `status` enum('pending','active','inactive','blocked') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_mobile_unique` UNIQUE(`mobile`);--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_sessions_user_idx` ON `user_sessions` (`user_id`);