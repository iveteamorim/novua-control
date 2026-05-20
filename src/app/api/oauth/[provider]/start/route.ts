import { NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth/session";
import { buildProviderAuthorizeUrl } from "@/lib/oauth/provider-clients";
import {
  buildOAuthRedirectUri,
  buildOAuthState,
  getOAuthEnv,
} from "@/lib/oauth/workspace-oauth";
import type { SourceSystem } from "@/lib/control/types";

function isProvider(value: string): value is SourceSystem {
  return value === "github" || value === "vercel" || value === "linear";
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;

  if (!isProvider(provider)) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=Unknown%20OAuth%20provider.", request.url),
    );
  }

  const session = await getOptionalSession();

  if (!session?.workspaceId) {
    return NextResponse.redirect(new URL("/sign-in?next=/settings/integrations", request.url));
  }

  const env = getOAuthEnv(provider);

  if (!env.clientId || !env.clientSecret) {
    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=${encodeURIComponent(`${provider} OAuth is not configured on this deployment.`)}`,
        request.url,
      ),
    );
  }

  const redirectUri = buildOAuthRedirectUri(request.nextUrl.origin, provider);
  const state = buildOAuthState({
    provider,
    workspaceId: session.workspaceId,
    userId: session.userId,
  });

  const authorizeUrl = buildProviderAuthorizeUrl({
    provider,
    clientId: env.clientId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}

