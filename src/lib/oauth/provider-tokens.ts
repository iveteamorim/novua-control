import { upsertWorkspaceIntegration } from "@/lib/control/store";
import type {
  LinearIntegrationRecord,
  VercelIntegrationRecord,
  WorkspaceIntegrationRecord,
} from "@/lib/control/types";

function isExpired(expiresAt?: string | null) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

async function refreshVercelToken(integration: VercelIntegrationRecord) {
  if (!integration.refreshToken || !isExpired(integration.expiresAt)) {
    return integration;
  }

  const clientId = process.env.NOVUA_CONTROL_VERCEL_CLIENT_ID;
  const clientSecret = process.env.NOVUA_CONTROL_VERCEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return integration;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: integration.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ...integration,
      status: "degraded" as const,
      lastError: `Vercel token refresh failed with ${response.status}.`,
      updatedAt: new Date().toISOString(),
    };
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const next = {
    ...integration,
    token: payload.access_token ?? integration.token,
    refreshToken: payload.refresh_token ?? integration.refreshToken ?? null,
    expiresAt: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : integration.expiresAt ?? null,
    updatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    lastError: null,
  } satisfies VercelIntegrationRecord;

  await upsertWorkspaceIntegration(next);
  return next;
}

async function refreshLinearToken(integration: LinearIntegrationRecord) {
  if (!integration.refreshToken || !isExpired(integration.expiresAt)) {
    return integration;
  }

  const clientId = process.env.NOVUA_CONTROL_LINEAR_CLIENT_ID;
  const clientSecret = process.env.NOVUA_CONTROL_LINEAR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return integration;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: integration.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ...integration,
      status: "degraded" as const,
      lastError: `Linear token refresh failed with ${response.status}.`,
      updatedAt: new Date().toISOString(),
    };
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const next = {
    ...integration,
    apiKey: payload.access_token ?? integration.apiKey,
    refreshToken: payload.refresh_token ?? integration.refreshToken ?? null,
    expiresAt: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : integration.expiresAt ?? null,
    updatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    lastError: null,
  } satisfies LinearIntegrationRecord;

  await upsertWorkspaceIntegration(next);
  return next;
}

export async function getFreshWorkspaceIntegration(
  integration?: WorkspaceIntegrationRecord | null,
) {
  if (!integration) {
    return integration;
  }

  if (integration.provider === "vercel") {
    return refreshVercelToken(integration);
  }

  if (integration.provider === "linear") {
    return refreshLinearToken(integration);
  }

  return integration;
}
