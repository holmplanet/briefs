import { verifyAccessToken } from "@briefs/shared/auth";
import { eveChannel } from "eve/channels/eve";
import { localDev, withAuthChallenges, type AuthFn } from "eve/channels/auth";

const briefsBearerAuth: AuthFn<Request> = withAuthChallenges(async (request) => {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;

  const issuer = (process.env.BRIEFS_OAUTH_ISSUER ?? "http://localhost:8001/oauth").replace(/\/$/, "");
  const token = header.slice(7).trim();
  const claims = await verifyAccessToken(token, process.env.BRIEFS_AUTH_SECRET ?? "dev-briefs-auth-secret", issuer);
  if (!claims) return null;

  return {
    attributes: {
      briefsAccessToken: token,
      email: claims.email ?? "",
    },
    authenticator: "briefs-oauth",
    issuer,
    principalId: claims.sub,
    principalType: "user",
    subject: claims.sub,
  };
}, [{ scheme: "Bearer" }]);

export default eveChannel({
  auth: [briefsBearerAuth, localDev()],
});
