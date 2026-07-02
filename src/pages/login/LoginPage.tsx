import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * D-16: `/login` is the only unauthenticated route. Because allauth is
 * HEADLESS_ONLY, starting Google sign-in is a real form POST to the
 * provider-redirect endpoint (not an anchor href) — a `fetch` cannot follow
 * the cross-origin OAuth redirect, but a native form submit can (T-02-15).
 */
export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const accessDenied = searchParams.get('error') === 'access_denied'

  useEffect(() => {
    // Land the csrftoken cookie the provider-redirect POST needs.
    fetch(`${API_BASE_URL}/_allauth/browser/v1/auth/session`, { credentials: 'include' })
      .catch(() => undefined)
      .finally(() => setCsrfToken(readCookie('csrftoken')))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Amazatic Project Status</CardTitle>
          <CardDescription>Sign in with your Amazatic Google Workspace account.</CardDescription>
        </CardHeader>
        <CardContent>
          {accessDenied && (
            <p className="mb-4 text-sm text-destructive">
              Access restricted. Use your @amazatic.com Google Workspace account to sign in.
            </p>
          )}
          <form
            method="post"
            action={`${API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`}
            onSubmit={() => setSubmitting(true)}
          >
            <input type="hidden" name="provider" value="google" />
            <input type="hidden" name="callback_url" value={`${window.location.origin}/`} />
            <input type="hidden" name="process" value="login" />
            <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken ?? ''} />
            <Button type="submit" className="w-full gap-2" disabled={submitting || !csrfToken}>
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12s3.36-7.27 7.19-7.27c3.08 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.19 2C6.42 2 2.03 6.8 2.03 12s4.39 10 10.16 10c5.05 0 9.81-3.55 9.81-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
