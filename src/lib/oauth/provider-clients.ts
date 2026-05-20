import type {
  GitHubIntegrationRecord,
  LinearIntegrationRecord,
  SourceSystem,
  VercelIntegrationRecord,
  WorkspaceIntegrationRecord,
} from "@/lib/control/types";

type GitHubAccessTokenPayload = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GitHubRepo = {
  full_name?: string;
  updated_at?: string;
};

type GitHubUser = {
  login?: string;
};

type VercelTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user_id?: string;
};

type VercelProject = {
  id?: string;
  name?: string;
};

type VercelTeam = {
  id?: string;
  slug?: string;
  name?: string;
};

type LinearTokenPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

type LinearTeamsPayload = {
  data?: {
    viewer?: {
      name?: string | null;
    } | null;
    teams?: {
      nodes?: Array<{
        key?: string | null;
        name?: string | null;
      }>;
    } | null;
  };
  errors?: Array<{
    message?: string | null;
  }>;
};

function sortUpdatedItems<T extends { updated_at?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aValue = new Date(a.updated_at ?? 0).getTime();
    const bValue = new Date(b.updated_at ?? 0).getTime();
    return bValue - aValue;
  });
}

export function buildProviderAuthorizeUrl(input: {
  provider: SourceSystem;
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    state: input.state,
  });

  if (input.provider === "github") {
    params.set("scope", "repo read:user");
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  if (input.provider === "vercel") {
    params.set("response_type", "code");
    params.set("scope", "openid email profile offline_access");
    return `https://vercel.com/oauth/authorize?${params.toString()}`;
  }

  params.set("response_type", "code");
  params.set("scope", "read");
  params.set("prompt", "consent");
  return `https://linear.app/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    code: input.code,
    redirect_uri: input.redirectUri,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub OAuth failed with ${response.status}.`);
  }

  const payload = (await response.json()) as GitHubAccessTokenPayload;

  if (!payload.access_token) {
    throw new Error(payload.error_description || "GitHub did not return an access token.");
  }

  const [userResponse, reposResponse] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${payload.access_token}`,
        "User-Agent": "novua-control",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }),
    fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${payload.access_token}`,
          "User-Agent": "novua-control",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    ),
  ]);

  if (!userResponse.ok || !reposResponse.ok) {
    throw new Error("GitHub OAuth connected, but repo discovery failed.");
  }

  const user = (await userResponse.json()) as GitHubUser;
  const repos = sortUpdatedItems((await reposResponse.json()) as GitHubRepo[]);

  return {
    token: payload.access_token,
    tokenType: payload.token_type ?? "bearer",
    accountLogin: user.login ?? null,
    repositories: repos
      .map((repo) => repo.full_name)
      .filter((repo): repo is string => Boolean(repo)),
  };
}

export async function exchangeVercelCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    code: input.code,
    redirect_uri: input.redirectUri,
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
    throw new Error(`Vercel OAuth failed with ${response.status}.`);
  }

  const payload = (await response.json()) as VercelTokenPayload;

  if (!payload.access_token) {
    throw new Error("Vercel did not return an access token.");
  }

  const accessToken = payload.access_token;
  const [userInfoResponse, teamsResponse, personalProjectsResponse] = await Promise.all([
    fetch("https://api.vercel.com/v2/oauth/userinfo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),
    fetch("https://api.vercel.com/v2/teams?limit=20", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),
    fetch("https://api.vercel.com/v10/projects?limit=20", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }),
  ]);

  if (!userInfoResponse.ok || !teamsResponse.ok || !personalProjectsResponse.ok) {
    throw new Error("Vercel OAuth connected, but project discovery failed.");
  }

  const userInfo = (await userInfoResponse.json()) as {
    user?: {
      id?: string;
      name?: string;
      email?: string;
      username?: string;
    };
  };
  const teamsPayload = (await teamsResponse.json()) as { teams?: VercelTeam[] };
  const personalProjectsPayload = (await personalProjectsResponse.json()) as
    | { projects?: VercelProject[] }
    | VercelProject[];

  const personalProjects = Array.isArray(personalProjectsPayload)
    ? personalProjectsPayload
    : personalProjectsPayload.projects ?? [];

  const teams = teamsPayload.teams ?? [];
  const teamProjects = await Promise.all(
    teams
      .filter((team) => team.id)
      .map(async (team) => {
        const teamId = team.id as string;
        const projectsResponse = await fetch(
          `https://api.vercel.com/v10/projects?limit=20&teamId=${encodeURIComponent(teamId)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          },
        );

        if (!projectsResponse.ok) {
          return [];
        }

        const projectsPayload = (await projectsResponse.json()) as
          | { projects?: VercelProject[] }
          | VercelProject[];
        const projects = Array.isArray(projectsPayload)
          ? projectsPayload
          : projectsPayload.projects ?? [];

        return projects.map((project) => ({
          ...project,
          teamId,
          teamName: team.name ?? team.slug ?? null,
        }));
      }),
  );

  const availableProjects = [
    ...personalProjects.map((project) => ({
      ...project,
      teamId: null,
      teamName: userInfo.user?.name ?? userInfo.user?.username ?? null,
    })),
    ...teamProjects.flat(),
  ];

  return {
    token: accessToken,
    refreshToken: payload.refresh_token ?? null,
    expiresAt: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null,
    accountId: userInfo.user?.id ?? payload.user_id ?? null,
    accountName:
      userInfo.user?.name ?? userInfo.user?.username ?? userInfo.user?.email ?? null,
    projects: availableProjects.filter((project) => project.id && project.name),
  };
}

export async function exchangeLinearCode(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
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
    throw new Error(`Linear OAuth failed with ${response.status}.`);
  }

  const payload = (await response.json()) as LinearTokenPayload;

  if (!payload.access_token) {
    throw new Error("Linear did not return an access token.");
  }

  const teamsResponse = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: payload.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query OAuthTeams {
          viewer {
            name
          }
          teams(first: 20) {
            nodes {
              key
              name
            }
          }
        }
      `,
    }),
    cache: "no-store",
  });

  if (!teamsResponse.ok) {
    throw new Error("Linear OAuth connected, but team discovery failed.");
  }

  const teamsPayload = (await teamsResponse.json()) as LinearTeamsPayload;

  if (teamsPayload.errors?.length) {
    throw new Error(
      teamsPayload.errors[0]?.message || "Linear team discovery failed.",
    );
  }

  return {
    apiKey: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresAt: payload.expires_in
      ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
      : null,
    accountName: teamsPayload.data?.viewer?.name ?? null,
    teams: (teamsPayload.data?.teams?.nodes ?? []).filter(
      (team): team is { key: string; name: string | null } => Boolean(team?.key),
    ),
  };
}

export function chooseGitHubRepository(
  existing: WorkspaceIntegrationRecord | undefined,
  repositories: string[],
) {
  if (existing?.provider === "github" && repositories.includes(existing.repository)) {
    return existing.repository;
  }

  return repositories[0] ?? "";
}

export function chooseVercelProject(
  existing: WorkspaceIntegrationRecord | undefined,
  projects: Array<VercelProject & { teamId?: string | null; teamName?: string | null }>,
) {
  if (existing?.provider === "vercel") {
    const match = projects.find((project) => project.id === existing.projectId);
    if (match) {
      return match;
    }
  }

  return projects[0] ?? null;
}

export function chooseLinearTeam(
  existing: WorkspaceIntegrationRecord | undefined,
  teams: Array<{ key: string; name: string | null }>,
) {
  if (existing?.provider === "linear") {
    const match = teams.find((team) => team.key === existing.teamKey);
    if (match) {
      return match;
    }
  }

  return teams[0] ?? null;
}

export function mergeGitHubIntegration(
  existing: WorkspaceIntegrationRecord | undefined,
  input: {
    workspaceId: string;
    repository: string;
    token: string;
    tokenType: string | null;
    accountLogin: string | null;
  },
) {
  const base = existing?.provider === "github" ? existing : null;
  return {
    ...(base ?? {}),
    id: base?.id ?? `integration-${input.workspaceId}-github`,
    workspaceId: input.workspaceId,
    provider: "github",
    repository: input.repository,
    token: input.token,
    tokenType: input.tokenType,
    accountLogin: input.accountLogin,
    enabled: true,
    status: input.repository && input.token ? "connected" : "degraded",
    updatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    lastError: input.repository ? null : "OAuth connected, but no accessible repositories were found.",
  } satisfies GitHubIntegrationRecord;
}

export function mergeVercelIntegration(
  existing: WorkspaceIntegrationRecord | undefined,
  input: {
    workspaceId: string;
    token: string;
    refreshToken: string | null;
    expiresAt: string | null;
    accountId: string | null;
    accountName: string | null;
    projectId: string;
    projectName: string | null;
    teamId: string | null;
    teamName: string | null;
  },
) {
  const base = existing?.provider === "vercel" ? existing : null;
  return {
    ...(base ?? {}),
    id: base?.id ?? `integration-${input.workspaceId}-vercel`,
    workspaceId: input.workspaceId,
    provider: "vercel",
    token: input.token,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
    projectId: input.projectId,
    projectName: input.projectName,
    teamId: input.teamId,
    accountId: input.accountId,
    accountName: input.teamName ?? input.accountName,
    enabled: true,
    status: input.projectId && input.token ? "connected" : "degraded",
    updatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    lastError: input.projectId ? null : "OAuth connected, but no accessible Vercel projects were found.",
  } satisfies VercelIntegrationRecord;
}

export function mergeLinearIntegration(
  existing: WorkspaceIntegrationRecord | undefined,
  input: {
    workspaceId: string;
    apiKey: string;
    refreshToken: string | null;
    expiresAt: string | null;
    accountName: string | null;
    teamKey: string;
    teamName: string | null;
  },
) {
  const base = existing?.provider === "linear" ? existing : null;
  return {
    ...(base ?? {}),
    id: base?.id ?? `integration-${input.workspaceId}-linear`,
    workspaceId: input.workspaceId,
    provider: "linear",
    apiKey: input.apiKey,
    refreshToken: input.refreshToken,
    expiresAt: input.expiresAt,
    teamKey: input.teamKey,
    teamName: input.teamName,
    accountName: input.accountName,
    enabled: true,
    status: input.teamKey && input.apiKey ? "connected" : "degraded",
    updatedAt: new Date().toISOString(),
    lastValidatedAt: new Date().toISOString(),
    lastError: input.teamKey ? null : "OAuth connected, but no accessible Linear teams were found.",
  } satisfies LinearIntegrationRecord;
}

