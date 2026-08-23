const isProduction = process.env.NODE_ENV === "production";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (isProduction ? "https://briefs.holmplanet.com" : "http://localhost:3001");

export const siteUrl = configuredSiteUrl.replace(/\/$/, "");

export const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL ?? (isProduction ? undefined : "http://localhost:3000");
