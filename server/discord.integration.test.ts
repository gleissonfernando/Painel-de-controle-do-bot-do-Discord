import { describe, expect, it, beforeAll } from "vitest";
import {
  fetchGuildDetails,
  fetchGuildChannels,
  fetchGuildRoles,
} from "./discord";

describe("Discord API Integration", () => {
  const guildId = process.env.VITE_DISCORD_GUILD_ID || "1474167739391410320";

  it(
    "should fetch guild details from Discord API",
    async () => {
      const guild = await fetchGuildDetails(guildId);
      expect(guild).toBeDefined();
      expect(guild).toHaveProperty("id");
      expect(guild).toHaveProperty("name");
      expect(guild.id).toBe(guildId);
    },
    { timeout: 10000 }
  );

  it(
    "should fetch guild channels from Discord API",
    async () => {
      const channels = await fetchGuildChannels(guildId);
      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);
      // Verify channel structure
      if (channels.length > 0) {
        expect(channels[0]).toHaveProperty("id");
        expect(channels[0]).toHaveProperty("name");
        expect(channels[0]).toHaveProperty("type");
      }
    },
    { timeout: 10000 }
  );

  it(
    "should fetch guild roles from Discord API",
    async () => {
      const roles = await fetchGuildRoles(guildId);
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      // Verify role structure
      if (roles.length > 0) {
        expect(roles[0]).toHaveProperty("id");
        expect(roles[0]).toHaveProperty("name");
        expect(roles[0]).toHaveProperty("color");
      }
    },
    { timeout: 10000 }
  );
});
