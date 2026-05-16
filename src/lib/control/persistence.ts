import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import WebSocket from "ws";

type StoreBackend = "file" | "supabase";

const DEFAULT_BUCKET = "novua-control";
const DEFAULT_OBJECT_PATH = "control-store.json";

let cachedClient: ReturnType<typeof createClient> | null = null;
let ensuredBucket: Promise<void> | null = null;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
}

function getSupabaseServiceRole() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

function getSupabaseBucket() {
  return process.env.NOVUA_CONTROL_SUPABASE_BUCKET ?? DEFAULT_BUCKET;
}

function getSupabaseObjectPath() {
  return process.env.NOVUA_CONTROL_SUPABASE_OBJECT ?? DEFAULT_OBJECT_PATH;
}

function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRole());
}

function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(getSupabaseUrl()!, getSupabaseServiceRole()!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        transport: WebSocket as unknown as WebSocketLikeConstructor,
      },
    });
  }

  return cachedClient;
}

function isNotFoundError(error: { message?: string; statusCode?: string | number }) {
  return (
    error.statusCode === 404 ||
    error.statusCode === "404" ||
    /not found/i.test(error.message ?? "")
  );
}

async function ensureSupabaseBucket() {
  if (!hasSupabaseConfig()) {
    return;
  }

  if (!ensuredBucket) {
    ensuredBucket = (async () => {
      const client = getSupabaseClient();
      const bucketName = getSupabaseBucket();

      const { data, error } = await client.storage.listBuckets();

      if (error) {
        throw error;
      }

      const exists = data.some(
        (bucket) => bucket.id === bucketName || bucket.name === bucketName,
      );

      if (exists) {
        return;
      }

      const { error: createError } = await client.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: "1MB",
      });

      if (createError && !/already exists/i.test(createError.message)) {
        throw createError;
      }
    })();
  }

  await ensuredBucket;
}

async function readLocalStoreText(localPath: string) {
  try {
    return await readFile(localPath, "utf8");
  } catch {
    return null;
  }
}

async function writeLocalStoreText(localPath: string, content: string) {
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, content, "utf8");
}

async function readSupabaseStoreText() {
  await ensureSupabaseBucket();

  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(getSupabaseBucket())
    .download(getSupabaseObjectPath());

  if (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }

  return data.text();
}

async function writeSupabaseStoreText(content: string) {
  await ensureSupabaseBucket();

  const client = getSupabaseClient();
  const payload = new Blob([content], { type: "application/json" });
  const { error } = await client.storage
    .from(getSupabaseBucket())
    .upload(getSupabaseObjectPath(), payload, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw error;
  }
}

export function getControlStoreBackend(): StoreBackend {
  return hasSupabaseConfig() ? "supabase" : "file";
}

export async function readControlStoreText(localPath: string) {
  if (getControlStoreBackend() === "file") {
    return readLocalStoreText(localPath);
  }

  const remote = await readSupabaseStoreText();

  if (remote !== null) {
    return remote;
  }

  if (process.env.VERCEL) {
    return null;
  }

  const local = await readLocalStoreText(localPath);

  if (local !== null) {
    await writeSupabaseStoreText(local);
  }

  return local;
}

export async function writeControlStoreText(localPath: string, content: string) {
  if (getControlStoreBackend() === "supabase") {
    await writeSupabaseStoreText(content);

    if (!process.env.VERCEL) {
      await writeLocalStoreText(localPath, content);
    }

    return;
  }

  await writeLocalStoreText(localPath, content);
}
