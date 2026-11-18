ALTER TABLE `subcategories` ADD `image_url` text;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `image_key` varchar(255);--> statement-breakpoint
ALTER TABLE `subcategories` ADD `field_schema` json;--> statement-breakpoint
ALTER TABLE `subcategories` ADD `variant_schema` json;--> statement-breakpoint
UPDATE `subcategories` `s`
INNER JOIN `categories` `c` ON `c`.`id` = `s`.`category_id`
SET
	`s`.`field_schema` = `c`.`field_schema`,
	`s`.`variant_schema` = `c`.`variant_schema`
WHERE `s`.`field_schema` IS NULL OR `s`.`variant_schema` IS NULL;--> statement-breakpoint
UPDATE `subcategories`
SET
	`field_schema` = JSON_OBJECT('schemaVersion', 1, 'fields', JSON_ARRAY()),
	`variant_schema` = JSON_ARRAY()
WHERE `field_schema` IS NULL OR `variant_schema` IS NULL;--> statement-breakpoint
ALTER TABLE `subcategories` MODIFY `field_schema` json NOT NULL;--> statement-breakpoint
ALTER TABLE `subcategories` MODIFY `variant_schema` json NOT NULL;
