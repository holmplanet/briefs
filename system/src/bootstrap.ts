import { ActorService, MemoryActorStore, PostgresActorStore } from "./actor/index.js";
import { ActivityService, MemoryActivityStore, PostgresActivityStore } from "./activity/index.js";
import type { BriefsConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { createPool, runMigrations } from "./db.js";
import { ItemService, MemoryItemStore, PostgresItemStore } from "./item/index.js";
import { MemoryAuthStore, PostgresAuthStore, type AuthStore } from "./auth/store.js";
import { ConsoleOtpMailer, ResendOtpMailer, type OtpMailer } from "./auth/mailer.js";

export type AppContext = {
  config: BriefsConfig;
  items: ItemService;
  actors: ActorService;
  activities: ActivityService;
  auth: AuthStore;
  mailer: OtpMailer;
};

export async function bootstrap(): Promise<AppContext> {
  const config = loadConfig();

  if (config.env === "production" && config.otpMailer !== "resend") {
    throw new Error("Production requires BRIEFS_OTP_MAILER=resend");
  }
  if (config.env === "production" && !config.databaseUrl) {
    throw new Error("Production requires BRIEFS_DATABASE_URL for durable OAuth storage");
  }
  if (config.env === "production" && config.authSecret === "dev-briefs-auth-secret") {
    throw new Error("Production requires a non-default BRIEFS_AUTH_SECRET");
  }
  if (config.otpMailer === "resend" && (!config.resendApiKey || !config.emailFrom)) {
    throw new Error("Resend OTP mailer requires BRIEFS_RESEND_API_KEY and BRIEFS_EMAIL_FROM");
  }

  if (config.databaseUrl) {
    const pool = createPool(config.databaseUrl);
    await runMigrations(pool);
    const actors = new ActorService(new PostgresActorStore(pool));
    const activities = new ActivityService(new PostgresActivityStore(pool));
    const itemStore = new PostgresItemStore(pool);
    const items = new ItemService(itemStore, actors, activities);
    const auth = new PostgresAuthStore(pool);
    const mailer = config.otpMailer === "resend" && config.resendApiKey && config.emailFrom
      ? new ResendOtpMailer(config.resendApiKey, config.emailFrom)
      : new ConsoleOtpMailer();
    return { config, actors, activities, items, auth, mailer };
  }

  const actors = new ActorService(new MemoryActorStore());
  const activities = new ActivityService(new MemoryActivityStore());
  const itemStore = new MemoryItemStore();
  const items = new ItemService(itemStore, actors, activities);
  const mailer = config.otpMailer === "resend" && config.resendApiKey && config.emailFrom
    ? new ResendOtpMailer(config.resendApiKey, config.emailFrom)
    : new ConsoleOtpMailer();
  return { config, actors, activities, items, auth: new MemoryAuthStore(), mailer };
}
