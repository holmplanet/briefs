import { ActorService, MemoryActorStore, PostgresActorStore } from "./actor/index.js";
import { ActivityService, MemoryActivityStore, PostgresActivityStore } from "./activity/index.js";
import type { BriefsConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { createPool, runMigrations } from "./db.js";
import { ItemService, MemoryItemStore, PostgresItemStore } from "./item/index.js";
import { MemoryAuthStore, PostgresAuthStore, type AuthStore } from "./auth/store.js";
import { ConsoleOtpMailer, ResendOtpMailer, type OtpMailer } from "./auth/mailer.js";
import { BriefService, MemoryBriefStore, PostgresBriefStore } from "./brief/index.js";
import { createBetterAuthSpike } from "./auth/better-auth-spike.js";

export type AppContext = {
  config: BriefsConfig;
  items: ItemService;
  actors: ActorService;
  activities: ActivityService;
  auth: AuthStore;
  betterAuth?: ReturnType<typeof createBetterAuthSpike>;
  mailer: OtpMailer;
  briefs: BriefService;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.env === "production" && config.otpMailer !== "resend") {
    throw new Error("Production requires OTP_MAILER=resend");
  }
  if (config.env === "production" && !config.databaseUrl) {
    throw new Error("Production requires DATABASE_URL for durable OAuth storage");
  }
  if (config.authProvider === "better-auth" && !config.databaseUrl) {
    throw new Error("Better Auth requires DATABASE_URL for durable authentication storage");
  }
  if (config.env === "production" && config.oauthAllowedRedirectUris.length === 0) {
    throw new Error("Production requires OAUTH_ALLOWED_REDIRECT_URIS for dynamic OAuth clients");
  }
  if (config.env === "production" && config.authSecret === "dev-briefs-auth-secret") {
    throw new Error("Production requires a non-default AUTH_SECRET");
  }
  if (config.env === "production" && config.authProvider === "better-auth") {
    if (!process.env.OAUTH_ISSUER) throw new Error("Production Better Auth requires OAUTH_ISSUER");
    if (new URL(config.oauthIssuer).protocol !== "https:") {
      throw new Error("Production Better Auth requires OAUTH_ISSUER to use HTTPS");
    }
    for (const [name, value] of [["MCP_RESOURCE", config.mcpResource], ["API_RESOURCE", config.apiResource]] as const) {
      if (!process.env[name]) throw new Error(`Production Better Auth requires ${name}`);
      if (new URL(value).protocol !== "https:") throw new Error(`Production Better Auth requires ${name} to use HTTPS`);
    }
  }
  if (config.otpMailer === "resend" && (!config.resendApiKey || !config.emailFrom)) {
    throw new Error("Resend OTP mailer requires RESEND_API_KEY and EMAIL_FROM");
  }

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    const actors = new ActorService(new PostgresActorStore(pool));
    const activities = new ActivityService(new PostgresActivityStore(pool));
    const itemStore = new PostgresItemStore(pool);
    const items = new ItemService(itemStore, actors, activities);
    const auth = new PostgresAuthStore(pool);
    const briefs = new BriefService(new PostgresBriefStore(pool));
    const mailer = config.otpMailer === "resend" && config.resendApiKey && config.emailFrom
      ? new ResendOtpMailer(config.resendApiKey, config.emailFrom)
      : new ConsoleOtpMailer();
    const betterAuth = config.authProvider === "better-auth"
      ? createBetterAuthSpike(pool, {
        issuer: config.oauthIssuer,
        loginPage: config.authLoginUrl,
        consentPage: config.authConsentUrl,
        secret: config.authSecret,
        allowedEmails: config.oauthAllowedEmails,
        mcpResource: config.mcpResource,
        apiResource: config.apiResource,
        sendOtp: (email, code) => mailer.sendOtp(email, code),
      })
      : undefined;
    if (betterAuth) await (await betterAuth.$context).runMigrations();
    return { config, actors, activities, items, auth, betterAuth, mailer, briefs };
  }

  const actors = new ActorService(new MemoryActorStore());
  const activities = new ActivityService(new MemoryActivityStore());
  const itemStore = new MemoryItemStore();
  const items = new ItemService(itemStore, actors, activities);
  const mailer = config.otpMailer === "resend" && config.resendApiKey && config.emailFrom
    ? new ResendOtpMailer(config.resendApiKey, config.emailFrom)
    : new ConsoleOtpMailer();
  return { config, actors, activities, items, auth: new MemoryAuthStore(), mailer, briefs: new BriefService(new MemoryBriefStore()) };
}
