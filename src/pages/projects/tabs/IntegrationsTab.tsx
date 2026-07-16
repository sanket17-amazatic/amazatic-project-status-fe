import { useState } from 'react'
import type { Project } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import {
  useIntegrations,
  useUpsertIntegration,
  useRemoveIntegration,
  useCheckHealth,
  type ProjectIntegration,
} from '@/hooks/useIntegrations'
import { HealthBadge } from '@/components/HealthBadge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { X } from 'lucide-react'
import { ShimmerButton, ShimmerContentBlock } from 'shimmer-effects-react'

/**
 * PROJ-03/ADMIN-02: Jira on/off toggle (D-08, no token entry — Phase 3
 * owns that); Slack is a DISPLAY SHELL ONLY (D-07 — no manual channel entry,
 * channels are auto-discovered once the app is installed in Phase 4/7).
 */
export function IntegrationsTab({ project }: { project: Project }) {
  const role = useAuthStore((state) => state.user?.role)
  const isManagement = role === 'management'
  const projectId = String(project.id)

  const { data: integrations, isLoading: integrationsLoading } = useIntegrations(projectId)
  const upsertIntegration = useUpsertIntegration(projectId)
  const removeIntegration = useRemoveIntegration(projectId)
  const checkHealth = useCheckHealth(projectId)
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null)

  if (integrationsLoading) {
    return (
      <div className="space-y-6 pt-4">
        <ShimmerContentBlock mode="light" items={3} />
      </div>
    )
  }

  const jira = integrations.find((integration) => integration.type === 'jira')
  const slackOwn = integrations.find((integration) => integration.type === 'slack_own')
  const slackClient = integrations.find((integration) => integration.type === 'slack_client')

  function integrationRowActions(integration: ProjectIntegration | undefined) {
    if (!isManagement || !integration) return null
    return (
      <div className="flex items-center gap-2">
        <ShimmerButton mode="light" loading={checkHealth.isPending}>
          <Button
            variant="outline"
            size="sm"
            disabled={checkHealth.isPending}
            onClick={() => checkHealth.mutate(integration.id)}
          >
            Check health
          </Button>
        </ShimmerButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Remove integration"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive hover:bg-slate-100"
              onClick={() => setRemoveTargetId(integration.id)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove integration</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Jira</h3>
          <div className="mt-1">
            <HealthBadge status={jira?.health_status ?? 'not_configured'} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Switch
            checked={jira?.enabled ?? false}
            disabled={!isManagement}
            aria-label="Toggle Jira integration"
            onCheckedChange={(checked) =>
              upsertIntegration.mutate({ id: jira?.id, type: 'jira', enabled: checked })
            }
          />
          {integrationRowActions(jira)}
        </div>
      </div>

      {[
        { type: slackOwn, label: 'Slack (own workspace)' },
        { type: slackClient, label: 'Slack (client workspace)' },
      ].map(({ type: integration, label }) => (
        <div key={label} className="rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{label}</h3>
            <HealthBadge status={integration?.health_status ?? 'not_configured'} />
          </div>
          <p className="mt-2 text-sm text-slate-500">Not installed</p>
          <p className="mt-1 text-xs text-slate-500">
            No channels — channels are auto-discovered once the app is installed in the
            workspace.
          </p>
          <ul className="mt-2 text-sm text-slate-500" aria-label="Channel list">
            {/* Empty stub — real install-detection + channel fetch land in Phase 4/7. */}
          </ul>
          {integrationRowActions(integration)}
        </div>
      ))}

      <Dialog
        open={removeTargetId != null}
        onOpenChange={(open) => !open && setRemoveTargetId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this integration?</DialogTitle>
            <DialogDescription>
              Monitoring config for this integration will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTargetId != null) {
                  removeIntegration.mutate(removeTargetId)
                  setRemoveTargetId(null)
                }
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
