import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateProject } from '@/hooks/useProjectMutations'

const EMAIL_RE = /^\S+@\S+\.\S+$/

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
    setValue(normalized.join(', '))
    if (JSON.stringify(normalized) !== JSON.stringify(clientEmails)) {
      updateProject.mutate({ client_emails: normalized })
    }
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
