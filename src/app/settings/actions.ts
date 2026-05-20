"use server";

import { redirect } from "next/navigation";

import { requireWorkspaceSession } from "@/lib/auth/session";
import {
  buildWorkspaceIntegrationId,
  getWorkspaceIntegrationMap,
  removeWorkspaceIntegration,
  upsertWorkspaceIntegration,
} from "@/lib/control/store";
import type {
  SourceSystem,
  WorkspaceIntegrationRecord,
  WorkspaceIntegrationStatus,
} from "@/lib/control/types";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getCheckbox(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "1" || value === "true";
}

function isProvider(value: string): value is SourceSystem {
  return value === "github" || value === "vercel" || value === "linear";
}

function redirectWithMessage(
  type: "success" | "error",
  message: string,
): never {
  redirect(`/settings/integrations?${type}=${encodeURIComponent(message)}`);
}

function buildStatus(
  enabled: boolean,
  configured: boolean,
): WorkspaceIntegrationStatus {
  if (!enabled || !configured) {
    return "not_configured";
  }

  return "connected";
}

function isValidGitHubRepository(repository: string) {
  return /^[^@\s/]+\/[^@\s/]+$/.test(repository);
}

export async function saveWorkspaceIntegrationAction(formData: FormData) {
  const session = await requireWorkspaceSession("/settings/integrations");
  const providerValue = getString(formData, "provider");

  if (!isProvider(providerValue)) {
    redirectWithMessage("error", "Unknown integration provider.");
  }

  const integrationMap = await getWorkspaceIntegrationMap(session.workspaceId);
  const existing = integrationMap[providerValue];
  const enabled = getCheckbox(formData, "enabled");
  const now = new Date().toISOString();

  let integration: WorkspaceIntegrationRecord;

  if (providerValue === "github") {
    const repository =
      getString(formData, "githubRepository") || getString(formData, "repository");
    const nextToken =
      getString(formData, "githubToken") || getString(formData, "token");
    const token =
      nextToken || (existing?.provider === "github" ? existing.token : "");
    const hasValidRepository = isValidGitHubRepository(repository);
    const configured = Boolean(hasValidRepository && token);

    if (enabled && !repository) {
      redirectWithMessage(
        "error",
        "GitHub needs both a repository and token.",
      );
    }

    if (enabled && repository && !hasValidRepository) {
      redirectWithMessage(
        "error",
        "GitHub repository must use owner/repo format.",
      );
    }

    integration = {
      id: buildWorkspaceIntegrationId(session.workspaceId, providerValue),
      workspaceId: session.workspaceId,
      provider: "github",
      repository,
      token,
      enabled,
      status: buildStatus(enabled, configured),
      updatedAt: now,
      lastValidatedAt: configured ? now : null,
      lastError:
        enabled && !configured ? "Missing repository/token or invalid repository format." : null,
    };
  } else if (providerValue === "vercel") {
    const projectId =
      getString(formData, "vercelProjectId") || getString(formData, "projectId");
    const teamId =
      getString(formData, "vercelTeamId") || getString(formData, "teamId") || null;
    const nextToken =
      getString(formData, "vercelToken") || getString(formData, "token");
    const token =
      nextToken || (existing?.provider === "vercel" ? existing.token : "");
    const configured = Boolean(projectId && token);

    if (enabled && !configured) {
      redirectWithMessage(
        "error",
        "Vercel needs both a project ID and token.",
      );
    }

    integration = {
      id: buildWorkspaceIntegrationId(session.workspaceId, providerValue),
      workspaceId: session.workspaceId,
      provider: "vercel",
      token,
      projectId,
      teamId,
      enabled,
      status: buildStatus(enabled, configured),
      updatedAt: now,
      lastValidatedAt: configured ? now : null,
      lastError:
        enabled && !configured ? "Missing project ID or token." : null,
    };
  } else {
    const teamKey =
      getString(formData, "linearTeamKey") || getString(formData, "teamKey");
    const nextApiKey =
      getString(formData, "linearApiKey") || getString(formData, "apiKey");
    const apiKey =
      nextApiKey || (existing?.provider === "linear" ? existing.apiKey : "");
    const configured = Boolean(teamKey && apiKey);

    if (enabled && !configured) {
      redirectWithMessage(
        "error",
        "Linear needs both a team key and API key.",
      );
    }

    integration = {
      id: buildWorkspaceIntegrationId(session.workspaceId, providerValue),
      workspaceId: session.workspaceId,
      provider: "linear",
      apiKey,
      teamKey,
      enabled,
      status: buildStatus(enabled, configured),
      updatedAt: now,
      lastValidatedAt: configured ? now : null,
      lastError:
        enabled && !configured ? "Missing team key or API key." : null,
    };
  }

  await upsertWorkspaceIntegration(integration);
  redirectWithMessage("success", `${providerValue} integration saved.`);
}

export async function disconnectWorkspaceIntegrationAction(formData: FormData) {
  const session = await requireWorkspaceSession("/settings/integrations");
  const providerValue = getString(formData, "provider");

  if (!isProvider(providerValue)) {
    redirectWithMessage("error", "Unknown integration provider.");
  }

  await removeWorkspaceIntegration(session.workspaceId, providerValue);
  redirectWithMessage("success", `${providerValue} integration removed.`);
}
