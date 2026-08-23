const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const siteUrl = configuredSiteUrl.replace(/\/$/, "");
