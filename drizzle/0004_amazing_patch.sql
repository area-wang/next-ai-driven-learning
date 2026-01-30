ALTER TABLE `feynman_explanations` RENAME COLUMN "ai_analysis" TO "ai_feedback";--> statement-breakpoint
CREATE TABLE `cornell_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`main_notes` text NOT NULL,
	`cues` text,
	`summary` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `knowledge_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flashcard_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`flashcard_id` text NOT NULL,
	`user_id` text NOT NULL,
	`quality` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	`time_spent` integer,
	FOREIGN KEY (`flashcard_id`) REFERENCES `flashcards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`tags` text,
	`easiness_factor` integer DEFAULT 2500,
	`repetitions` integer DEFAULT 0,
	`interval` integer DEFAULT 0,
	`next_review_at` integer,
	`last_reviewed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `knowledge_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`method_type` text NOT NULL,
	`is_enabled` integer DEFAULT true,
	`config` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `learning_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `note_links` (
	`id` text PRIMARY KEY NOT NULL,
	`from_note_id` text NOT NULL,
	`to_note_id` text NOT NULL,
	`link_type` text DEFAULT 'related',
	`created_at` integer,
	FOREIGN KEY (`from_note_id`) REFERENCES `zettelkasten_notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_note_id`) REFERENCES `zettelkasten_notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pomodoro_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`duration` integer NOT NULL,
	`actual_duration` integer,
	`status` text DEFAULT 'in_progress',
	`session_type` text DEFAULT 'work',
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `knowledge_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content_id` text NOT NULL,
	`review_round` integer NOT NULL,
	`scheduled_at` integer NOT NULL,
	`completed_at` integer,
	`effectiveness` integer,
	`next_review_at` integer,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_id`) REFERENCES `knowledge_contents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `zettelkasten_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `feynman_explanations` ADD `concept` text NOT NULL;--> statement-breakpoint
ALTER TABLE `feynman_explanations` ADD `version` integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE `feynman_explanations` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `feynman_explanations` DROP COLUMN `score`;