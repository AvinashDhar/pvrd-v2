ALTER TABLE `product_images` MODIFY COLUMN `product_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `banners` ADD `image_key` varchar(255);--> statement-breakpoint
ALTER TABLE `brands` ADD `logo_key` varchar(255);--> statement-breakpoint
ALTER TABLE `categories` ADD `image_key` varchar(255);--> statement-breakpoint
ALTER TABLE `notifications` ADD `image_key` varchar(255);--> statement-breakpoint
ALTER TABLE `product_images` ADD `object_key` varchar(255);--> statement-breakpoint
ALTER TABLE `settings` ADD `logo_key` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `photo_key` varchar(255);