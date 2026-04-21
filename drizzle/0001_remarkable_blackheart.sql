CREATE TABLE `auto_mod_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`antiSpamEnabled` boolean NOT NULL DEFAULT false,
	`antiSpamThreshold` int DEFAULT 5,
	`antiSpamInterval` int DEFAULT 5,
	`antiLinkEnabled` boolean NOT NULL DEFAULT false,
	`antiLinkWhitelist` json DEFAULT ('[]'),
	`wordFilterEnabled` boolean NOT NULL DEFAULT false,
	`wordFilterList` json DEFAULT ('[]'),
	`antiCapsEnabled` boolean NOT NULL DEFAULT false,
	`antiCapsThreshold` int DEFAULT 70,
	`punishmentType` enum('warn','mute','kick','ban') NOT NULL DEFAULT 'warn',
	`punishmentDuration` int DEFAULT 10,
	`logChannelId` varchar(64),
	`exemptRoles` json DEFAULT ('[]'),
	`exemptChannels` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_mod_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `auto_mod_settings_guildId_unique` UNIQUE(`guildId`)
);
--> statement-breakpoint
CREATE TABLE `command_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`commandName` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`cooldown` int DEFAULT 0,
	`requiredRoleId` varchar(64),
	`allowedChannels` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `command_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guild_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`guildName` text,
	`guildIcon` text,
	`ownerId` varchar(64),
	`prefix` varchar(16) NOT NULL DEFAULT '!',
	`language` varchar(16) NOT NULL DEFAULT 'en',
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`adminRoleId` varchar(64),
	`welcomeChannelId` varchar(64),
	`logsChannelId` varchar(64),
	`botEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guild_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `guild_settings_guildId_unique` UNIQUE(`guildId`)
);
--> statement-breakpoint
CREATE TABLE `server_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`eventType` enum('member_join','member_leave','member_ban','member_unban','message_delete','message_edit','channel_create','channel_delete','role_create','role_delete','voice_join','voice_leave','command_used') NOT NULL,
	`userId` varchar(64),
	`userName` text,
	`userAvatar` text,
	`targetId` varchar(64),
	`targetName` text,
	`details` json DEFAULT ('{}'),
	`channelId` varchar(64),
	`channelName` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`platform` enum('youtube','twitch','tiktok') NOT NULL,
	`channelUsername` varchar(128) NOT NULL,
	`channelId` varchar(128),
	`channelDisplayName` text,
	`discordChannelId` varchar(64) NOT NULL,
	`message` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`isLive` boolean NOT NULL DEFAULT false,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `welcome_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guildId` varchar(64) NOT NULL,
	`welcomeEnabled` boolean NOT NULL DEFAULT false,
	`welcomeChannelId` varchar(64),
	`welcomeMessage` text,
	`goodbyeEnabled` boolean NOT NULL DEFAULT false,
	`goodbyeChannelId` varchar(64),
	`goodbyeMessage` text,
	`dmWelcome` boolean NOT NULL DEFAULT false,
	`dmMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `welcome_messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `welcome_messages_guildId_unique` UNIQUE(`guildId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `discordId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `accessToken` text;--> statement-breakpoint
ALTER TABLE `users` ADD `refreshToken` text;