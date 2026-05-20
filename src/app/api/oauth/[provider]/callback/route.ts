import { NextRequest, NextResponse } from "next/server";

import { getOptionalSession } from "@/lib/auth/session";
import { getWorkspaceIntegrationMap, upsertWorkspaceIntegration } from "@/lib/control/store";
import type { SourceSystem } from "@/lib/control/types";
import {
  chooseGitHubRepository,
  chooseLinearTeam,
  chooseVercelProject,
  exchangeGitHubCode,
  exchangeLinearCode,
  exchangeVercelCode,
  mergeGitHubIntegration,
  mergeLinearIntegration,
  mergeVercelIntegration,
} from "@/lib/oauth/provider-clients";
import {
  buildOAuthRedirectUri,
  getOAuthEnv,
  parseOAuthState,
} from "@/lib/oauth/workspace-oauth";

function isProvider(value: string): value is SourceSystem {
  return value === "github" || value === "vercel" || value === "linear";
}

function redirectWithError(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(
      `/settings/integrations?error=${encodeURIComponent(message)}`,
      request.url,
    ),
  );
}

function redirectWithSuccess(request: NextRequest, message: string) {
  return NextResponse.redirect(
    new URL(
      `/settings/integrations?success=${encodeURIComponent(message)}`,
      request.url,
    ),
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;

  if (!isProvider(provider)) {
    return redirectWithError(request, "Unknown OAuth provider.");
  }

  const session = await getOptionalSession();

  if (!session?.workspaceId) {
    return redirectWithError(request, "Sign in again before finishing OAuth.");
  }

  const stateValue = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return redirectWithError(request, `${provider} authorization was cancelled or rejected.`);
  }

  const state = parseOAuthState(stateValue);

  if (
    !state ||
    state.provider !== provider ||
    state.workspaceId !== session.workspaceId ||
    state.userId !== session.userId
  ) {
    return redirectWithError(request, "OAuth state is invalid or expired.");
  }

  if (!code) {
    return redirectWithError(request, "OAuth callback did not include a code.");
  }

  const env = getOAuthEnv(provider);

  if (!env.clientId || !env.clientSecret) {
    return redirectWithError(request, `${provider} OAuth is not configured on this deployment.`);
  }

  const redirectUri = buildOAuthRedirectUri(request.nextUrl.origin, provider);
  const integrationMap = await getWorkspaceIntegrationMap(session.workspaceId);
  const existing = integrationMap[provider];

  try {
    if (provider === "github") {
      const payload = await exchangeGitHubCode({
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        code,
        redirectUri,
      });

      const repository = chooseGitHubRepository(existing, payload.repositories);

      await upsertWorkspaceIntegration(
        mergeGitHubIntegration(existing, {
          workspaceId: session.workspaceId,
          repository,
          token: payload.token,
          tokenType: payload.tokenType,
          accountLogin: payload.accountLogin,
        }),
      );

      return redirectWithSuccess(request, "GitHub connected with OAuth.");
    }

    if (provider === "vercel") {
      const payload = await exchangeVercelCode({
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        code,
        redirectUri,
      });

      const project = chooseVercelProject(existing, payload.projects);

      await upsertWorkspaceIntegration(
        mergeVercelIntegration(existing, {
          workspaceId: session.workspaceId,
          token: payload.token,
          refreshToken: payload.refreshToken,
          expiresAt: payload.expiresAt,
          accountId: payload.accountId,
          accountName: payload.accountName,
          projectId: project?.id ?? "",
          projectName: project?.name ?? null,
          teamId: project?.teamId ?? null,
          teamName: project?.teamName ?? null,
        }),
      );

      return redirectWithSuccess(request, "Vercel connected with OAuth.");
    }

    const payload = await exchangeLinearCode({
      clientId: env.clientId,
      clientSecret: env.clientSecret,
      code,
      redirectUri,
    });

    const team = chooseLinearTeam(existing, payload.teams);

    await upsertWorkspaceIntegration(
      mergeLinearIntegration(existing, {
        workspaceId: session.workspaceId,
        apiKey: payload.apiKey,
        refreshToken: payload.refreshToken,
        expiresAt: payload.expiresAt,
        accountName: payload.accountName,
        teamKey: team?.key ?? "",
        teamName: team?.name ?? null,
      }),
    );

    return redirectWithSuccess(request, "Linear connected with OAuth.");
  } catch (oauthError) {
    const message =
      oauthError instanceof Error
        ? oauthError.message
        : `Could not complete ${provider} OAuth.`;

    return redirectWithError(request, message);
  }
}

