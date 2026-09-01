export function buildPendingOtpRedirect(nextPath: string): string {
  return `/login?otp=sent&next=${encodeURIComponent(nextPath)}`;
}
