CREATE TABLE `activity_logs` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`entity_type` varchar(40),
	`entity_id` varchar(64),
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` varchar(36) NOT NULL,
	`admin_id` varchar(36) NOT NULL,
	`token_hash` varchar(128) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` varchar(36) NOT NULL,
	`type` varchar(40) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` varchar(64) NOT NULL,
	`user_id` varchar(36),
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`image_url` text NOT NULL,
	`type` varchar(40) NOT NULL,
	`redirect_url` text,
	`start_at` datetime,
	`end_at` datetime,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`sort_order` int DEFAULT 0,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_categories` (
	`brand_id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	CONSTRAINT `brand_categories_brand_id_category_id_pk` PRIMARY KEY(`brand_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`logo_url` text,
	`description` text,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalogues` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`pdf_url` text,
	`status` varchar(40) NOT NULL DEFAULT 'draft',
	`generated_at` datetime,
	CONSTRAINT `catalogues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`image_url` text,
	`description` text,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`field_schema` json NOT NULL,
	`variant_schema` json NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`type` varchar(40) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`product_id` varchar(36),
	`status` enum('pending','contacted','closed') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_rules` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` enum('earn','redeem') NOT NULL,
	`scope` varchar(40) NOT NULL,
	`target_id` varchar(64),
	`points` int,
	`min_purchase` decimal(12,2),
	`conversion_rate` decimal(12,4),
	`max_redeem_per_order` int,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `loyalty_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_transactions` (
	`id` varchar(36) NOT NULL,
	`wallet_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` varchar(40) NOT NULL,
	`points` int NOT NULL,
	`note` text,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `loyalty_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_wallets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`available` int NOT NULL DEFAULT 0,
	`redeemed` int NOT NULL DEFAULT 0,
	`expired` int NOT NULL DEFAULT 0,
	`updated_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `loyalty_wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `loyalty_wallets_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`image_url` text,
	`type` varchar(40) NOT NULL,
	`audience` varchar(40) NOT NULL,
	`redirect_url` text,
	`status` varchar(40) NOT NULL,
	`scheduled_at` datetime,
	`recipient_count` int DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` varchar(36) NOT NULL,
	`name` varchar(200) NOT NULL,
	`scope` varchar(40) NOT NULL,
	`type` varchar(40) NOT NULL,
	`target_id` varchar(64),
	`start_at` datetime,
	`end_at` datetime,
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36),
	`variant_id` varchar(36),
	`url` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`finish` varchar(120),
	`size` varchar(120),
	`price` decimal(12,2),
	`copy_price_from_parent` boolean DEFAULT false,
	`attributes` json DEFAULT ('{}'),
	`sort_order` int DEFAULT 0,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`brand_id` varchar(36),
	`name` varchar(255) NOT NULL,
	`sku` varchar(64),
	`mrp` decimal(12,2) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`contractor_discount` decimal(5,2),
	`consumer_discount` decimal(5,2),
	`points` int DEFAULT 0,
	`description` text,
	`attributes` json DEFAULT ('{}'),
	`status` enum('active','inactive','hidden') NOT NULL DEFAULT 'active',
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	`updated_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_replies` (
	`id` varchar(36) NOT NULL,
	`review_id` varchar(36) NOT NULL,
	`contractor_id` varchar(36) NOT NULL,
	`body` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	`updated_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `review_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL,
	`consumer_id` varchar(36) NOT NULL,
	`contractor_id` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`status` varchar(40) NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` varchar(32) NOT NULL DEFAULT 'company',
	`company_name` varchar(160) NOT NULL,
	`tagline` varchar(200),
	`email` varchar(255),
	`phone` varchar(40),
	`website` varchar(255),
	`address` text,
	`logo_url` text,
	`social` json DEFAULT ('{}'),
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(255),
	`mobile` varchar(32) NOT NULL,
	`user_type` enum('admin','retailer','contractor','consumer') NOT NULL,
	`city` varchar(120),
	`photo_url` text,
	`status` enum('active','inactive','blocked') NOT NULL DEFAULT 'active',
	`block_reason` text,
	`last_login_at` datetime,
	`created_at` datetime NOT NULL DEFAULT (utc_timestamp()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_categories` ADD CONSTRAINT `brand_categories_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `brand_categories` ADD CONSTRAINT `brand_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `catalogues` ADD CONSTRAINT `catalogues_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_wallet_id_loyalty_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `loyalty_wallets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `loyalty_wallets` ADD CONSTRAINT `loyalty_wallets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_review_id_reviews_id_fk` FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_sessions_admin_idx` ON `admin_sessions` (`admin_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_entity_idx` ON `analytics_events` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_idx` ON `analytics_events` (`type`);--> statement-breakpoint
CREATE INDEX `loyalty_tx_user_idx` ON `loyalty_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_brand_idx` ON `products` (`brand_id`);--> statement-breakpoint
CREATE INDEX `products_sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `users_type_idx` ON `users` (`user_type`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `users_mobile_idx` ON `users` (`mobile`);