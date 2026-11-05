import type {
  ApiErrorBody,
  DemoUser,
  Job,
  Template,
  TemplateCategory,
  UploadedAsset,
} from "@/lib/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      fieldErrors?: Record<string, string>;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? 0;
    this.code = options.code ?? "REQUEST_FAILED";
    this.fieldErrors = options.fieldErrors;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  userId?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.userId) {
    headers["X-User-Id"] = options.userId;
  }

  let payload: BodyInit | undefined;
  if (options.body instanceof FormData) {
    payload = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: payload,
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError("无法连接服务，请确认后端已经启动", {
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    const fallback =
      response.status >= 500
        ? "服务暂时不可用，请稍后重试"
        : `请求失败（HTTP ${response.status}）`;
    throw new ApiError(body?.message || fallback, {
      status: response.status,
      code: body?.code || "HTTP_ERROR",
      fieldErrors: body?.fieldErrors,
    });
  }

  return data as T;
}

export function getDemoUsers(signal?: AbortSignal): Promise<DemoUser[]> {
  return request<DemoUser[]>("/api/auth/users", { signal });
}

export function loginDemoUser(userId: string): Promise<DemoUser> {
  return request<DemoUser>("/api/auth/login", {
    method: "POST",
    body: { userId },
  });
}

export function getCurrentUser(userId: string, signal?: AbortSignal): Promise<DemoUser> {
  return request<DemoUser>("/api/auth/me", { userId, signal });
}

export function getCategories(signal?: AbortSignal): Promise<TemplateCategory[]> {
  return request<TemplateCategory[]>("/api/templates/categories", { signal });
}

export function getTemplates(category: string, signal?: AbortSignal): Promise<Template[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return request<Template[]>(`/api/templates${query}`, { signal });
}

export function getTemplate(id: string, signal?: AbortSignal): Promise<Template> {
  return request<Template>(`/api/templates/${encodeURIComponent(id)}`, { signal });
}

export function uploadImage(
  userId: string,
  file: File,
  signal?: AbortSignal,
): Promise<UploadedAsset> {
  const form = new FormData();
  form.append("file", file);
  return request<UploadedAsset>("/api/uploads", {
    method: "POST",
    userId,
    body: form,
    signal,
  });
}

export function createJob(
  userId: string,
  payload: { templateId: string; assetIds: string[] },
): Promise<Job> {
  return request<Job>("/api/jobs", {
    method: "POST",
    userId,
    body: payload,
  });
}

interface GetJobsOptions {
  templateId?: string;
  status?: string;
  limit?: number;
  signal?: AbortSignal;
}

export function getJobs(userId: string, options: GetJobsOptions = {}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (options.templateId) params.set("templateId", options.templateId);
  if (options.status) params.set("status", options.status);
  if (options.limit) params.set("limit", String(options.limit));
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return request<Job[]>(`/api/jobs${suffix}`, {
    userId,
    signal: options.signal,
  });
}

export function deleteJob(userId: string, jobId: string): Promise<void> {
  return request<void>(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
    userId,
  });
}
