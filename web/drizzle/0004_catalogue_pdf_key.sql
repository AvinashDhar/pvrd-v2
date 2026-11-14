ALTER TABLE `catalogues` ADD `pdf_key` varchar(255);--> statement-breakpoint
CREATE INDEX `catalogues_category_idx` ON `catalogues` (`category_id`);