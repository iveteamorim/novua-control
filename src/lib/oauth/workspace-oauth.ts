import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type { SourceSystem } from "@/lib/control/types";

type WorkspaceOAuthState = {
  nonce: string;
  provider: SourceSystem;
  workspaceId: string;
  userId: string;
  issuedAt: string;
};

const OAUTH_STATE_DURATION_MS = 1000 * 60 * 10;

function getOAuthSecret() {
  return (
    process.env.NOVUA_CONTROL_AUTH_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "novua-control-dev-secret"
  );
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getOAuthSecret())
    .update(payload)
    .digest("base64url");
}

export function buildOAuthState(input: {
  provider: SourceSystem;
  workspaceId: string;
  userId: string;
}) {
  const payload = encode(
    JSON.stringify({
      ...input,
      nonce: randomUUID(),
      issuedAt: new Date().toISOString(),
    } satisfies WorkspaceOAuthState),
  );

  return `${payload}.${sign(payload)}`;
}

export function parseOAuthState(value: string): WorkspaceOAuthState | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  if (expected.length !== signature.length) {
    return null;
  }

  try {
    const matches = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!matches) {
      return null;
    }

    const state = JSON.parse(decode(payload)) as WorkspaceOAuthState;

    if (
      !state?.provider ||
      !state?.workspaceId ||
      !state?.userId ||
      !state?.issuedAt
    ) {
      return null;
    }

    if (
      Date.now() - new Date(state.issuedAt).getTime() >
      OAUTH_STATE_DURATION_MS
    ) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function buildOAuthRedirectUri(
  origin: string,
  provider: SourceSystem,
) {
  const appUrl = process.env.NOVUA_CONTROL_APP_URL?.trim() || origin;
  return `${appUrl.replace(/\/$/, "")}/api/oauth/${provider}/callback`;
}

export function getOAuthEnv(provider: SourceSystem) {
  if (provider === "github") {
    return {
      clientId: process.env.NOVUA_CONTROL_GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.NOVUA_CONTROL_GITHUB_CLIENT_SECRET ?? "",
    };
  }

  if (provider === "vercel") {
    return {
      clientId: process.env.NOVUA_CONTROL_VERCEL_CLIENT_ID ?? "",
      clientSecret: process.env.NOVUA_CONTROL_VERCEL_CLIENT_SECRET ?? "",
    };
  }

  return {
    clientId: process.env.NOVUA_CONTROL_LINEAR_CLIENT_ID ?? "",
    clientSecret: process.env.NOVUA_CONTROL_LINEAR_CLIENT_SECRET ?? "",
  };
}

export function oauthConfigured(provider: SourceSystem) {
  const env = getOAuthEnv(provider);
  return Boolean(env.clientId && env.clientSecret);
}
