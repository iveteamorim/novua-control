"use server";

import { redirect } from "next/navigation";

import {
  createWorkspaceForUser,
  getWorkspaceContext,
  registerUser,
  signInUser,
} from "@/lib/auth/accounts";
import {
  clearSession,
  createSession,
  requireSession,
} from "@/lib/auth/session";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next") || "/";

  if (!email || !password) {
    errorRedirect("/sign-in", "Email and password are required.");
  }

  const result = await signInUser(email, password);

  if (!result) {
    errorRedirect("/sign-in", "Invalid email or password.");
  }

  await createSession({
    userId: result.user.id,
    workspaceId: result.workspaceId,
    email: result.user.email,
    displayName: result.user.displayName,
  });

  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const displayName = getString(formData, "displayName");
  const workspaceName = getString(formData, "workspaceName");

  if (!email || !password || !workspaceName) {
    errorRedirect(
      "/sign-up",
      "Email, password, and workspace name are required.",
    );
  }

  try {
    const result = await registerUser({
      email,
      password,
      displayName,
      workspaceName,
    });

    await createSession({
      userId: result.user.id,
      workspaceId: result.workspaceId,
      email: result.user.email,
      displayName: result.user.displayName,
    });
  } catch (error) {
    errorRedirect(
      "/sign-up",
      error instanceof Error ? error.message : "Could not create account.",
    );
  }

  redirect("/");
}

export async function createWorkspaceAction(formData: FormData) {
  const workspaceName = getString(formData, "workspaceName");
  const session = await requireSession("/onboarding");

  if (!workspaceName) {
    errorRedirect("/onboarding", "Workspace name is required.");
  }

  const result = await createWorkspaceForUser({
    userId: session.userId,
    workspaceName,
  });
  const context = await getWorkspaceContext(session.userId, result.workspaceId);

  await createSession({
    userId: session.userId,
    workspaceId: result.workspaceId,
    email: session.email,
    displayName: context?.user.displayName ?? session.displayName,
  });

  redirect("/");
}

export async function signOutAction() {
  await clearSession();
  redirect("/sign-in");
}
