import mysql from 'mysql2/promise';

const sql = `
CREATE TABLE IF NOT EXISTS \`auto_mod_settings\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`guildId\` varchar(64) NOT NULL,
  \`antiSpamEnabled\` boolean NOT NULL DEFAULT false,
  \`antiSpamThreshold\` int DEFAULT 5,
  \`antiSpamInterval\` int DEFAULT 5,
  \`antiLinkEnabled\` boolean NOT NULL DEFAULT false,
  \`antiLinkWhitelist\` json,
  \`wordFilterEnabled\` boolean NOT NULL DEFAULT false,
  \`wordFilterList\` json,
  \`antiCapsEnabled\` boolean NOT NULL DEFAULT false,
  \`antiCapsThreshold\` int DEFAULT 70,
  \`punishmentType\` enum('warn','mute','kick','ban') NOT NULL DEFAULT 'warn',
  \`punishmentDuration\` int DEFAULT 10,
  \`logChannelId\` varchar(64),
  \`exemptRoles\` json,
  \`exemptChannels\` json,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`auto_mod_settings_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`auto_mod_settings_guildId_unique\` UNIQUE(\`guildId\`)
)`;

const sql2 = `
CREATE TABLE IF NOT EXISTS \`command_settings\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`guildId\` varchar(64) NOT NULL,
  \`commandName\` varchar(64) NOT NULL,
  \`enabled\` boolean NOT NULL DEFAULT true,
  \`cooldown\` int DEFAULT 0,
  \`requiredRoleId\` varchar(64),
  \`allowedChannels\` json,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`command_settings_id\` PRIMARY KEY(\`id\`)
)`;

const sql3 = `
CREATE TABLE IF NOT EXISTS \`server_logs\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`guildId\` varchar(64) NOT NULL,
  \`eventType\` enum('member_join','member_leave','member_ban','member_unban','message_delete','message_edit','channel_create','channel_delete','role_create','role_delete','voice_join','voice_leave','command_used') NOT NULL,
  \`userId\` varchar(64),
  \`userName\` text,
  \`userAvatar\` text,
  \`targetId\` varchar(64),
  \`targetName\` text,
  \`details\` json,
  \`channelId\` varchar(64),
  \`channelName\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`server_logs_id\` PRIMARY KEY(\`id\`)
)`;

const sql4 = `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`discordId\` varchar(64)`;
const sql5 = `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`avatar\` text`;
const sql6 = `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`accessToken\` text`;
const sql7 = `ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`refreshToken\` text`;

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  for (const [i, s] of [[1,sql],[2,sql2],[3,sql3],[4,sql4],[5,sql5],[6,sql6],[7,sql7]]) {
    try {
      await conn.query(s);
      console.log(`✅ Step ${i} done`);
    } catch (e) {
      console.error(`❌ Step ${i} failed:`, e.message);
    }
  }
  await conn.end();
  console.log('Migration complete');
}

run().catch(e => { console.error(e); process.exit(1); });
