CREATE TABLE `anonymous_daily_totals` (
	`day` text NOT NULL,
	`metric` text NOT NULL,
	`bucket` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `metric`, `bucket`)
);
