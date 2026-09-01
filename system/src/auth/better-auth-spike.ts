import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { emailOTP, jwt } from "better-auth/plugins";
import type { Pool } from "pg";

export type BetterAuthSpikeConfig = {
  issuer: string;
  secret: string;
  allowedEmails: string[];
  mcpResource: string;
  apiResource: string;
  sendOtp: (email: string, otp: string) => Promise<void>;
};

/**
 * Creates the isolated Better Auth provider used by the validation branch.
 *
 * This is intentionally not mounted by the production System app yet. The
 * branch first proves schema generation, issuer routing, and identity claims
 * before replacing the existing Briefs OAuth implementation.
 */
export function createBetterAuthSpike(pool: Pool, config: BetterAuthSpikeConfig) {
  return betterAuth({
    database: pool,
    baseURL: config.issuer,
    basePath: "/oauth",
    secret: config.secret,
    trustedOrigins: [config.issuer],
    plugins: [
      jwt(),
      emailOTP({
        disableSignUp: false,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed",
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== "sign-in") {
            throw new Error(`Unexpected Better Auth OTP type: ${type}`);
          }
          if (!config.allowedEmails.includes(email.trim().toLowerCase())) {
            throw new Error("Email is not authorized for this Briefs account");
          }
          await config.sendOtp(email, otp);
        },
      }),
      mcp({
        loginPage: "/login",
        consentPage: "/consent",
        resource: config.mcpResource,
        resources: [config.mcpResource, config.apiResource],
        clientRegistrationDefaultResources: [config.mcpResource, config.apiResource],
        clientRegistrationAllowedResources: [config.mcpResource, config.apiResource],
        scopes: ["openid", "email", "profile", "offline_access"],
        grantTypes: ["authorization_code", "refresh_token"],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
      }),
    ],
  });
}
