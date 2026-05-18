import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "novua_control_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export type AuthSession = {
  userId: string;
  workspaceId: string | null;
  email: string;
  displayName: string;
  expiresAt: string;
};

function getSessionSecret() {
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
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function buildSessionToken(session: AuthSession) {
  const payload = encode(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function parseSessionToken(token: string): AuthSession | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  try {
    if (signature.length !== expected.length) {
      return null;
    }

    const matches = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!matches) {
      return null;
    }

    const session = JSON.parse(decode(payload)) as AuthSession;

    if (!session?.userId || !session?.email || !session?.expiresAt) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function createSession(input: {
  userId: string;
  workspaceId: string | null;
  email: string;
  displayName: string;
}) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const session: AuthSession = { ...input, expiresAt };
  const token = buildSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getOptionalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return parseSessionToken(token);
}

export async function requireSession(next?: string) {
  const session = await getOptionalSession();

  if (!session) {
    const destination = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
    redirect(destination);
  }

  return session;
}

export async function requireWorkspaceSession(next?: string) {
  const session = await requireSession(next);

  if (!session.workspaceId) {
    redirect("/onboarding");
  }

  return session as AuthSession & { workspaceId: string };
}
