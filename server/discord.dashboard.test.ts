import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module to avoid real DB calls
vi.mock("./db", () => ({
  getGuildSettings: vi.fn().mockResolvedValue(null),
  upsertGuildSettings: vi.fn().mockResolvedValue(undefined),
  getAutoModSettings: vi.fn().mockResolvedValue(null),
  upsertAutoModSettings: vi.fn().mockResolvedValue(undefined),
  getSocialNotifications: vi.fn().mockResolvedValue([]),
  createSocialNotification: vi.fn().mockResolvedValue(undefined),
  updateSocialNotification: vi.fn().mockResolvedValue(undefined),
  deleteSocialNotification: vi.fn().mockResolvedValue(undefined),
  getServerLogs: vi.fn().mockResolvedValue([]),
  createServerLog: vi.fn().mockResolvedValue(undefined),
  getCommandSettings: vi.fn().mockResolvedValue([]),
  upsertCommandSetting: vi.fn().mockResolvedValue(undefined),
  getWelcomeMessages: vi.fn().mockResolvedValue(null),
  upsertWelcomeMessages: vi.fn().mockResolvedValue(undefined),
}));

// Mock the discord module
vi.mock("./discord", () => ({
  fetchDiscordGuilds: vi.fn().mockResolvedValue([]),
  fetchGuildDetails: vi.fn().mockResolvedValue({ id: "123", name: "Test Guild" }),
  fetchGuildChannels: vi.fn().mockResolvedValue([]),
  fetchGuildRoles: vi.fn().mockResolvedValue([]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("guilds.list", () => {
  it("returns demo guilds when no Discord access token is present", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const guilds = await caller.guilds.list();
    expect(Array.isArray(guilds)).toBe(true);
    expect(guilds.length).toBeGreaterThan(0);
    expect(guilds[0]).toHaveProperty("id");
    expect(guilds[0]).toHaveProperty("name");
  });
});

describe("settings.get", () => {
  it("returns default settings when none exist in DB", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const settings = await caller.settings.get({ guildId: "test-guild-123" });
    expect(settings).toMatchObject({
      guildId: "test-guild-123",
      prefix: "!",
      language: "en",
      timezone: "UTC",
      botEnabled: true,
    });
  });
});

describe("autoMod.get", () => {
  it("returns default auto mod settings when none exist in DB", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const settings = await caller.autoMod.get({ guildId: "test-guild-123" });
    expect(settings).toMatchObject({
      guildId: "test-guild-123",
      antiSpamEnabled: false,
      antiLinkEnabled: false,
      wordFilterEnabled: false,
      punishmentType: "warn",
    });
  });
});

describe("notifications.list", () => {
  it("returns empty array when no notifications exist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notifications = await caller.notifications.list({ guildId: "test-guild-123" });
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications).toHaveLength(0);
  });
});

describe("logs.list", () => {
  it("returns empty array when no logs exist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.logs.list({ guildId: "test-guild-123", limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toHaveLength(0);
  });
});

describe("commands.list", () => {
  it("returns default commands list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const commands = await caller.commands.list({ guildId: "test-guild-123" });
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
    const helpCmd = commands.find((c) => c.commandName === "help");
    expect(helpCmd).toBeDefined();
    expect(helpCmd?.enabled).toBe(true);
  });
});

describe("messages.get", () => {
  it("returns default welcome message settings when none exist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const msgs = await caller.messages.get({ guildId: "test-guild-123" });
    expect(msgs).toMatchObject({
      guildId: "test-guild-123",
      welcomeEnabled: false,
      goodbyeEnabled: false,
    });
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
