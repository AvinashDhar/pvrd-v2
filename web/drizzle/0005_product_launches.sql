CREATE TABLE `notification_reads` (
	`user_id` varchar(36) NOT NULL,
	`notification_id` varchar(36) NOT NULL,
	`read_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `notification_reads_user_id_notification_id_pk` PRIMARY KEY(`user_id`,`notification_id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD `link_id` varchar(36);--> statement-breakpoint
ALTER TABLE `products` ADD `launched_at` datetime;--> statement-breakpoint
UPDATE `products` SET `launched_at` = `created_at` WHERE `status` = 'active' AND `launched_at` IS NULL;--> statement-breakpoint
ALTER TABLE `notification_reads` ADD CONSTRAINT `notification_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_reads` ADD CONSTRAINT `notification_reads_notification_id_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_link_idx` ON `notifications` (`link_id`);--> statement-breakpoint
CREATE INDEX `products_launched_idx` ON `products` (`launched_at`);