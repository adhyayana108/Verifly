import type {
  AdminUserView,
  AnalyticsSummary,
  AuthResponse,
  BulkEvent,
  PublicUser,
  VerificationRecord,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: "That request wasn't valid. Double-check the details and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have access to do that.",
  404: "That wasn't found.",
  409: "That already exists.",
  429: "You've hit today's verification limit.",
  500: "Something went wrong on our end. Try again in a moment.",
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("verifly_token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();

    if (
      body &&
      typeof body.error === "string" &&
      body.error.length > 0
    ) {
      return body.error;
    }
  } catch {
    // Response wasn't JSON.
  }

  return (
    STATUS_FALLBACKS[res.status] ??
    `Request failed (${res.status}).`
  );
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? {
            "Content-Type": "application/json",
          }
        : {}),
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new ApiError(
      res.status,
      await parseErrorBody(res),
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

//Authentication


export function register(input: {
  username: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: {
  username: string;
  password: string;
}) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function me() {
  return request<PublicUser>("/api/auth/me");
}

//Verification


export function verifyDomain(domain: string) {
  return request<VerificationRecord>(
    `/api/verify?domain=${encodeURIComponent(domain)}`,
  );
}

export function getHistory(limit?: number) {
  const qs = limit ? `?limit=${limit}` : "";

  return request<VerificationRecord[]>(
    `/api/history${qs}`,
  );
}

export function getAnalytics() {
  return request<AnalyticsSummary>("/api/analytics");
}

export function getAdminUsers() {
  return request<AdminUserView[]>("/api/admin/users");
}


//Bulk verification

export async function bulkVerify(
  file: File,
  onEvent: (event: BulkEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const form = new FormData();

  form.append("file", file);

  const res = await fetch(
    `${API_BASE}/api/bulk-verify`,
    {
      method: "POST",
      headers: authHeaders(),
      body: form,
      signal,
    },
  );

  if (!res.ok || !res.body) {
    throw new ApiError(
      res.status,
      await parseErrorBody(res),
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    let newlineIndex: number;

    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer
        .slice(0, newlineIndex)
        .trim();

      buffer = buffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      onEvent(
        JSON.parse(line) as BulkEvent,
      );
    }
  }

  const finalLine = buffer.trim();

  if (finalLine) {
    onEvent(
      JSON.parse(finalLine) as BulkEvent,
    );
  }
}


// Health


export function healthz() {
  return request<{ status: string }>(
    "/api/healthz",
  );
}