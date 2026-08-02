import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

import type { McpAuthConfig } from "../../config.js";

export type McpToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function createUserIdResolver(config: McpAuthConfig) {
  return (extra: McpToolExtra, requestedUserId?: string): string => {
    const authUserId = extra.authInfo?.extra?.userId;
    if (typeof authUserId === "string") {
      if (requestedUserId && requestedUserId !== authUserId) {
        throw new Error("userId does not match authenticated user");
      }
      return authUserId;
    }

    if (config.enabled) {
      throw new Error("Authentication required");
    }

    return requestedUserId ?? "default";
  };
}
