import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useUpdateProject } from '@/hooks/useProjectMutations'

/**
 * Auto-saves on blur, same pattern as PM reassignment/team/integrations on
 * this page — there's no page-level "Update Changes" button because each
 * section already saves for real via its own mutation.
 */
export function ProjectNameField({ projectId, name }: { projectId: number; name: string }) {
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
        onBlur={handleBlur}
        className="h-11 rounded-sm border-border text-sm font-medium"
      />
    </div>
  )
}
