import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import {
  readControlStore,
  writeControlStoreSnapshot,
} from "@/lib/control/store";
import type {
  ControlStore,
  StoredUser,
  WorkspaceMemberRecord,
  WorkspaceRecord,
  WorkspaceRole,
} from "@/lib/control/types";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function hashPassword(password: string) {
  const salt = randomUUID().replace(/-/g, "");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");

  if (stored.length !== candidate.length) {
    return false;
  }

  return timingSafeEqual(stored, candidate);
}

function claimLegacyRecords(store: ControlStore, workspaceId: string) {
  for (const ingestion of store.ingestions) {
    ingestion.workspaceId ??= workspaceId;
  }

  for (const incident of store.incidents) {
    incident.workspaceId ??= workspaceId;
  }

  for (const entry of store.auditTrail) {
    entry.workspaceId ??= workspaceId;
  }

  for (const artifact of store.manualArtifacts) {
    artifact.workspaceId ??= workspaceId;
  }
}

function getUserMemberships(store: ControlStore, userId: string) {
  return store.workspaceMembers.filter((membership) => membership.userId === userId);
}

export async function getUserById(userId: string) {
  const store = await readControlStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export async function getWorkspaceById(workspaceId: string) {
  const store = await readControlStore();
  return store.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}

export async function getWorkspaceContext(
  userId: string,
  requestedWorkspaceId?: string | null,
) {
  const store = await readControlStore();
  const user = store.users.find((candidate) => candidate.id === userId) ?? null;

  if (!user) {
    return null;
  }

  const memberships = getUserMemberships(store, userId);

  if (memberships.length === 0) {
    return {
      user,
      workspace: null,
      membership: null,
    };
  }

  const targetWorkspaceId =
    requestedWorkspaceId ??
    user.defaultWorkspaceId ??
    memberships[0]?.workspaceId ??
    null;

  if (!targetWorkspaceId) {
    return {
      user,
      workspace: null,
      membership: null,
    };
  }

  const membership =
    memberships.find((candidate) => candidate.workspaceId === targetWorkspaceId) ?? null;

  if (!membership) {
    return {
      user,
      workspace: null,
      membership: null,
    };
  }

  const workspace =
    store.workspaces.find((candidate) => candidate.id === targetWorkspaceId) ?? null;

  return {
    user,
    workspace,
    membership,
  };
}

export async function signInUser(email: string, password: string) {
  const store = await readControlStore();
  const normalizedEmail = normalizeEmail(email);
  const user =
    store.users.find((candidate) => candidate.email === normalizedEmail) ?? null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  user.lastSignedInAt = new Date().toISOString();
  await writeControlStoreSnapshot(store);

  const memberships = getUserMemberships(store, user.id);
  const workspaceId =
    user.defaultWorkspaceId ??
    memberships[0]?.workspaceId ??
    null;

  return { user, workspaceId };
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  workspaceName: string;
}) {
  const store = await readControlStore();
  const normalizedEmail = normalizeEmail(input.email);

  if (store.users.some((candidate) => candidate.email === normalizedEmail)) {
    throw new Error("An account with that email already exists.");
  }

  const now = new Date().toISOString();
  const userId = `user_${randomUUID()}`;
  const workspaceId = `ws_${randomUUID()}`;
  const memberId = `member_${randomUUID()}`;
  const workspaceName = normalizeName(input.workspaceName, "Novua Control workspace");

  const user: StoredUser = {
    id: userId,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    displayName: normalizeName(input.displayName, normalizedEmail.split("@")[0] ?? "Owner"),
    defaultWorkspaceId: workspaceId,
    createdAt: now,
    lastSignedInAt: now,
  };

  const workspace: WorkspaceRecord = {
    id: workspaceId,
    name: workspaceName,
    slug: slugify(workspaceName || user.displayName || "workspace"),
    ownerUserId: userId,
    createdAt: now,
  };

  const membership: WorkspaceMemberRecord = {
    id: memberId,
    workspaceId,
    userId,
    role: "owner",
    createdAt: now,
  };

  store.users.push(user);
  store.workspaces.push(workspace);
  store.workspaceMembers.push(membership);

  if (store.workspaces.length === 1) {
    claimLegacyRecords(store, workspaceId);
  }

  await writeControlStoreSnapshot(store);

  return { user, workspaceId };
}

export async function createWorkspaceForUser(input: {
  userId: string;
  workspaceName: string;
  role?: WorkspaceRole;
}) {
  const store = await readControlStore();
  const user = store.users.find((candidate) => candidate.id === input.userId);

  if (!user) {
    throw new Error("Unknown user.");
  }

  const now = new Date().toISOString();
  const workspaceId = `ws_${randomUUID()}`;
  const workspaceName = normalizeName(input.workspaceName, "Novua Control workspace");

  const workspace: WorkspaceRecord = {
    id: workspaceId,
    name: workspaceName,
    slug: slugify(workspaceName || user.displayName || "workspace"),
    ownerUserId: input.userId,
    createdAt: now,
  };

  const membership: WorkspaceMemberRecord = {
    id: `member_${randomUUID()}`,
    workspaceId,
    userId: input.userId,
    role: input.role ?? "owner",
    createdAt: now,
  };

  store.workspaces.push(workspace);
  store.workspaceMembers.push(membership);
  user.defaultWorkspaceId = workspaceId;

  await writeControlStoreSnapshot(store);

  return { workspaceId, workspace };
}
