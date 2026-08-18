import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateProject } from '@/hooks/useProjectMutations'

/**
 * Auto-saves on blur, same pattern as PM reassignment/team/integrations on
 * this page — there's no page-level "Update Changes" button because each
 * section already saves for real via its own mutation. Always rendered
 * (same layout for every role, matching ClientEmailsField) — `editable`
 * just toggles readOnly + whether blur saves, so non-management viewers
 * still see the same boxed input instead of the section disappearing.
 */
export function ProjectNameField({
  projectId,
  name,
  editable = true,
}: {
  projectId: number
  name: string
  editable?: boolean
}) {
  const updateProject = useUpdateProject(String(projectId))
  const [value, setValue] = useState(name)

  function handleBlur() {
    const trimmed = value.trim()
    if (!trimmed) {
      setValue(name)
      return
    }
    if (trimmed !== name) {
      updateProject.mutate({ name: trimmed })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-black">Project Name</p>
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={editable ? handleBlur : undefined}
        readOnly={!editable}
        className="h-11 rounded-sm border-border text-sm font-medium"
      />
    </div>
  )
}
