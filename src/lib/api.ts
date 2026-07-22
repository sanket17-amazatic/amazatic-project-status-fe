/**
 * CSRF-aware fetch wrapper for the Django/DRF backend.
 *
 * Session auth (allauth headless) + CSRF, no JWT (D-16, CLAUDE.md). Every
 * request sends the session cookie cross-origin (`credentials: "include"`);
 * unsafe methods additionally read the `csrftoken` cookie set by the backend
 * and send it back as `X-CSRFToken`, per Django's double-submit-cookie CSRF
 * scheme.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (UNSAFE_METHODS.has(method)) {
    const csrftoken = readCookie('csrftoken')
    if (csrftoken) {
      headers.set('X-CSRFToken', csrftoken)
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = undefined
    }
    throw new ApiError(response.status, `Request to ${path} failed with ${response.status}`, body)
  }

  return response
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path)
  return parseJson<T>(response)
}

export async function postJson<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  return parseJson<T>(response)
}

export async function patchJson<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method: 'PATCH',
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  return parseJson<T>(response)
}

export async function del<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { method: 'DELETE' })
  return parseJson<T>(response)
}

/** Pulls DRF's `{"detail": "..."}` out of an ApiError body, for surfacing the real backend message in a toast/alert instead of a generic fallback. */
export function apiErrorDetail(error: unknown): string | null {
  if (error instanceof ApiError && error.body && typeof error.body === 'object') {
    const detail = (error.body as Record<string, unknown>).detail
    if (typeof detail === 'string') return detail
  }
  return null
}
