const DAILY_SOURCE_URL = "https://github.com/holmplanet/briefs/tree/main/client/web/flight-spike";

export function dailyUrl() {
  return process.env.NEXT_PUBLIC_DAILY_URL ?? DAILY_SOURCE_URL;
}
