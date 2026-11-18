CREATE TABLE `subcategories` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`description` text,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `subcategories_category_slug_uidx` UNIQUE(`category_id`,`slug`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `subcategory_id` varchar(36);--> statement-breakpoint
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subcategories_category_idx` ON `subcategories` (`category_id`);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_subcategory_id_subcategories_id_fk` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `products_subcategory_idx` ON `products` (`subcategory_id`);