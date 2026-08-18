import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateProject } from '@/hooks/useProjectMutations'

// Reasonably strict (not full RFC 5322) — rejects the shapes Django's
// EmailValidator also rejects (multiple @, consecutive/leading/trailing
// dots in either the local part or domain) so a client-side "looks valid"
// match doesn't get a surprise 400 back from Project.client_emails'
// server-side validation. Not exhaustive — the server stays the
// authoritative validator either way.
const EMAIL_RE = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/

function parseEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

/**
 * Client Emails — recipient list for this project's client-facing status
 * emails (Project.client_emails). Same comma-separated-text-box UI as the
 * Figma reference, auto-saves on blur like ProjectNameField (no page-level
 * "Update Changes" button on this page — see ProjectSettingsPage).
 * Management-only write, matching ProjectSerializer's IsManagementOrReadOnly
 * gate; everyone else sees the same box read-only.
 */
export function ClientEmailsField({
  projectId,
  clientEmails,
  editable,
}: {
  projectId: number
  clientEmails: string[]
  editable: boolean
}) {
  const updateProject = useUpdateProject(String(projectId))
  const [value, setValue] = useState(clientEmails.join(', '))
  const [error, setError] = useState<string | null>(null)

  function handleBlur() {
    const parsed = parseEmails(value)
    const invalid = parsed.filter((email) => !EMAIL_RE.test(email))
    if (invalid.length > 0) {
      setError(`Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`)
      return
    }
    setError(null)
    const normalized = parsed.map((email) => email.toLowerCase())
    const savedValue = clientEmails.join(', ')
    if (JSON.stringify(normalized) === JSON.stringify(clientEmails)) {
      setValue(savedValue)
      return
    }
    setValue(normalized.join(', '))
    updateProject.mutate(
      { client_emails: normalized },
      {
        // Reflects the server's response (post-dedupe/normalize), not just
        // what was locally typed — the backend's own validator dedupes
        // independently of parseEmails above, so "a@b.com, a@b.com" must
        // end up showing the deduped list the server actually saved.
        onSuccess: (updated) => setValue((updated.client_emails ?? []).join(', ')),
        // useUpdateProject's own onError already toasts a generic failure —
        // this just also rolls the input back to the last known-saved
        // value, since a failed PATCH must not leave the field showing an
        // unsaved value as if it had been saved.
        onError: () => setValue(savedValue),
      }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-black">Client Emails</p>
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          if (error) setError(null)
        }}
        onBlur={editable ? handleBlur : undefined}
        readOnly={!editable}
        placeholder="client1@bossolighting.com, client2@bossolighting.com"
        className="h-11 rounded-sm border-border text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
