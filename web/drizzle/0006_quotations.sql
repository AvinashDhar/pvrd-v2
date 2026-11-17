CREATE TABLE `quotation_bucket_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`variant_id` varchar(36),
	`variant_key` varchar(36) NOT NULL DEFAULT '',
	`quantity` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	`updated_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `quotation_bucket_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotation_bucket_line_idx` UNIQUE(`user_id`,`product_id`,`variant_key`)
);
--> statement-breakpoint
CREATE TABLE `quotation_items` (
	`id` varchar(36) NOT NULL,
	`quotation_id` varchar(36) NOT NULL,
	`product_id` varchar(36),
	`variant_id` varchar(36),
	`product_name` varchar(255) NOT NULL,
	`sku` varchar(64),
	`finish` varchar(120),
	`size` varchar(120),
	`unit` varchar(40),
	`packing` varchar(80),
	`quantity` int NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`price_label` varchar(16) NOT NULL,
	`availability` enum('unspecified','available','limited','unavailable') NOT NULL DEFAULT 'unspecified',
	`lead_time` varchar(120),
	`item_note` text,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `quotation_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotation_messages` (
	`id` varchar(36) NOT NULL,
	`quotation_id` varchar(36) NOT NULL,
	`author_role` enum('user','admin') NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`author_name` varchar(160) NOT NULL,
	`kind` enum('comment','request','accept','decline','close','reopen','availability') NOT NULL,
	`body` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `quotation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotations` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`reference` varchar(20) NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`outcome` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`note` text,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	`updated_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	`closed_at` datetime,
	CONSTRAINT `quotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotations_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
ALTER TABLE `quotation_bucket_items` ADD CONSTRAINT `quotation_bucket_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_bucket_items` ADD CONSTRAINT `quotation_bucket_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_bucket_items` ADD CONSTRAINT `quotation_bucket_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotation_id_quotations_id_fk` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotation_messages` ADD CONSTRAINT `quotation_messages_quotation_id_quotations_id_fk` FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `quotation_bucket_user_idx` ON `quotation_bucket_items` (`user_id`);--> statement-breakpoint
CREATE INDEX `quotation_items_quotation_idx` ON `quotation_items` (`quotation_id`);--> statement-breakpoint
CREATE INDEX `quotation_messages_quotation_idx` ON `quotation_messages` (`quotation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `quotations_user_idx` ON `quotations` (`user_id`);--> statement-breakpoint
CREATE INDEX `quotations_status_idx` ON `quotations` (`status`);--> statement-breakpoint
CREATE INDEX `quotations_created_idx` ON `quotations` (`created_at`);