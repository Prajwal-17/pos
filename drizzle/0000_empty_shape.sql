CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`password` text NOT NULL,
	`created_at` integer DEFAULT (unix_timestamp()) NOT NULL,
	`updated_at` integer DEFAULT (unix_timestamp()) NOT NULL
);
