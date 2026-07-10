import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import amazaticLogo from '@/assets/login/amazatic-logo.svg'
import diamondGraphic from '@/assets/login/diamond-graphic.png'
import vectorLine from '@/assets/login/vector-line.svg'
import iconAi from '@/assets/login/icon-ai.svg'
import iconEvidence from '@/assets/login/icon-evidence.svg'
import googleG from '@/assets/login/google-g.svg'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/** Figma-specified brand green for this screen only (node 71:3786) — not the
 * app-wide --primary token, which stays blue-600 everywhere else. */
const BRAND_GREEN = '#38C776'

const FEATURES = [
  {
    icon: iconAi,
    title: 'AI Incident Detection',
    description:
      'Automatically identifies engineering incidents, delivery risks, and project anomalies from Slack conversations and Jira activity.',
  },
  {
    icon: iconEvidence,
    title: 'Evidence Collection',
    description:
      'Collects and organizes supporting Slack messages and Jira issues so every incident is backed by clear evidence.',
  },
]

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
    <div className="flex min-h-screen items-stretch bg-white">
      <div
        className="relative hidden w-[45%] min-w-[480px] overflow-hidden lg:block"
        style={{ background: 'linear-gradient(142deg, #081c5d 3%, #142437 102%)' }}
      >
        <img
          src={vectorLine}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 top-4 w-[336px] rotate-180 opacity-80"
        />
        <img
          src={diamondGraphic}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-40px] right-[-40px] size-[300px] -rotate-45 opacity-10"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <img src={amazaticLogo} alt="Amazatic" className="h-11 w-auto" />

          <div className="flex max-w-xl flex-col gap-8">
            <p className="text-[28px] font-semibold leading-snug text-white">
              Enterprise AI that detects project incidents before they become
              delivery risks.
            </p>

            <div className="flex flex-col gap-6">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-3.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                    <img src={feature.icon} alt="" aria-hidden="true" className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-white">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-[19.5px] text-[#cfcfcf]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div
          className="flex w-full max-w-[443px] flex-col items-center gap-5 rounded-lg border border-[#e5e5e5] bg-white p-6"
          style={{ boxShadow: '2px 2px 5.4px 0px rgba(0,0,0,0.1)' }}
        >
          <div className="w-full">
            <h1 className="text-lg font-bold text-[#101828]">
              Sign in with your Amazatic account to continue.
            </h1>
          </div>

          {accessDenied && (
            <Alert variant="destructive" className="w-full">
              <AlertDescription>
                Access restricted. Use your @amazatic.com Google Workspace account to sign in.
              </AlertDescription>
            </Alert>
          )}

          <form
            className="w-full"
            method="post"
            action={`${API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`}
            onSubmit={() => setSubmitting(true)}
          >
            <input type="hidden" name="provider" value="google" />
            <input type="hidden" name="callback_url" value={`${window.location.origin}/`} />
            <input type="hidden" name="process" value="login" />
            <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken ?? ''} />
            <Button
              type="submit"
              disabled={submitting || !csrfToken}
              className="h-[54px] w-full gap-2 rounded-[6px] border bg-white text-[15px] font-semibold tracking-[-0.15px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.03)] hover:bg-white/90"
              style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
            >
              <img src={googleG} alt="" aria-hidden="true" className="size-6" />
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
