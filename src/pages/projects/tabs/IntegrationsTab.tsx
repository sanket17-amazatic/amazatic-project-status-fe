import { useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/hooks/useProjects'
import { useAuthStore } from '@/stores/authStore'
import {
  useIntegrations,
  useUpsertIntegration,
  useRemoveIntegration,
  useCheckHealth,
  readJiraConfig,
  type ProjectIntegration,
  type JiraConfig,
} from '@/hooks/useIntegrations'
import { HealthBadge } from '@/components/HealthBadge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ConnectedSourceCard } from './ConnectedSourceCard'

function baseUrlError(value: string): string | null {
  if (!value) return 'Required'
  if (!/^https?:\/\/.+/.test(value)) return 'Must start with http:// or https://'
  return null
}

function emailError(value: string): string | null {
  if (!value) return 'Required'
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email'
  return null
}

function projectKeyError(value: string): string | null {
  if (!value) return 'Required'
  return null
}

/**
 * Base URL/email/project key for an existing Jira integration row — the
 * fields build_client_from_integration (backend jira_client.py) reads out
 * of `config` to actually call Jira. Token stays wizard-only (D-08); this
 * is the rest of what "Check health" needs to stop 400ing with
 * JiraConfigError.
 */
function JiraConfigForm({
  integration,
  onSave,
  saving,
}: {
  integration: ProjectIntegration
  onSave: (config: JiraConfig) => void
  saving: boolean
}) {
  const saved = readJiraConfig(integration.config ?? {})
  const [baseUrl, setBaseUrl] = useState(saved.jira_base_url ?? '')
  const [email, setEmail] = useState(saved.jira_email ?? '')
  const [projectKey, setProjectKey] = useState(saved.jira_project_key ?? '')
  const [touched, setTouched] = useState(false)

  const dirty =
    baseUrl !== (saved.jira_base_url ?? '') ||
    email !== (saved.jira_email ?? '') ||
    projectKey !== (saved.jira_project_key ?? '')

  const errors = {
    baseUrl: baseUrlError(baseUrl),
    email: emailError(email),
    projectKey: projectKeyError(projectKey),
  }
  const valid = !errors.baseUrl && !errors.email && !errors.projectKey

  function handleSave() {
    setTouched(true)
    if (!valid) return
    onSave({ jira_base_url: baseUrl, jira_email: email, jira_project_key: projectKey })
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
      <div>
        <Label htmlFor={`jira-base-url-${integration.id}`}>Base URL</Label>
        <Input
          id={`jira-base-url-${integration.id}`}
          placeholder="https://yourteam.atlassian.net"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          className="mt-1.5"
        />
        {touched && errors.baseUrl && (
          <p className="mt-1 text-xs text-destructive">{errors.baseUrl}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`jira-email-${integration.id}`}>Account email</Label>
        <Input
          id={`jira-email-${integration.id}`}
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5"
        />
        {touched && errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor={`jira-project-key-${integration.id}`}>Project key</Label>
        <Input
          id={`jira-project-key-${integration.id}`}
          placeholder="PROJ"
          value={projectKey}
          onChange={(event) => setProjectKey(event.target.value.toUpperCase())}
          className="mt-1.5"
        />
        {touched && errors.projectKey && (
          <p className="mt-1 text-xs text-destructive">{errors.projectKey}</p>
        )}
      </div>
      <div className="flex items-end sm:col-span-3 sm:justify-end">
        <ShimmerButton mode="light" loading={saving}>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving || (touched && !valid)}
            onClick={handleSave}
          >
            Save Jira config
          </Button>
        </ShimmerButton>
      </div>
    </div>
  )
}

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
  // Separate instance so the row's standalone "Check health" button doesn't
  // light up the config form's save/spinner state, and vice versa (PR #2 review).
  const configHealthCheck = useCheckHealth(projectId)
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null)

  if (integrationsLoading) {
    return (
      <div className="space-y-4">
        <ShimmerContentBlock mode="light" items={3} loading />
      </div>
    )
  }

  const jira = integrations.find((integration) => integration.type === 'jira')
  // slack_client is intentionally not rendered here — the reference design
  // shows a single "Slack" card, and slack_own is this project's primary
  // workspace connection.
  const slackOwn = integrations.find((integration) => integration.type === 'slack_own')

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
    <div className="flex w-full flex-col gap-4">
      <ConnectedSourceCard
        icon="/icons/source-jira.svg"
        label="Jira"
        description="Sprint, issue & project activity tracking"
        status={
          <>
            <HealthBadge status={jira?.health_status ?? 'not_configured'} />
            <Switch
              checked={jira?.enabled ?? false}
              disabled={!isManagement}
              aria-label="Toggle Jira integration"
              onCheckedChange={(checked) =>
                upsertIntegration.mutate({ id: jira?.id, type: 'jira', enabled: checked })
              }
            />
            {integrationRowActions(jira)}
          </>
        }
      >
        {isManagement &&
          (jira?.id ? (
            <JiraConfigForm
              integration={jira}
              saving={upsertIntegration.isPending || configHealthCheck.isPending}
              onSave={(config) =>
                upsertIntegration.mutate(
                  { id: jira.id, type: 'jira', config },
                  {
                    onSuccess: () => {
                      toast.success('Jira config saved')
                      configHealthCheck.mutate(jira.id)
                    },
                  }
                )
              }
            />
          ) : (
            <p className="border-t border-border pt-4 text-xs text-slate-500">
              Toggle Jira on above to configure its connection.
            </p>
          ))}
      </ConnectedSourceCard>

      <ConnectedSourceCard
        icon="/icons/source-slack.svg"
        label="Slack"
        description="Conversation & collaboration analysis"
        status={
          <>
            <HealthBadge status={slackOwn?.health_status ?? 'not_configured'} />
            {integrationRowActions(slackOwn)}
          </>
        }
      >
        <p className="text-sm text-slate-500">Not installed</p>
        <p className="text-xs text-slate-500">
          No channels — channels are auto-discovered once the app is installed in the workspace.
        </p>
      </ConnectedSourceCard>

      <ConnectedSourceCard
        icon="/icons/source-teams.svg"
        label="Microsoft Teams"
        description="Team collaboration and updates"
        status={
          <Button variant="outline" size="sm" disabled className="h-9 shrink-0 px-3 text-sm">
            Connect
          </Button>
        }
      >
        <p className="text-xs text-slate-500">Coming soon — Microsoft Teams isn't wired up yet.</p>
      </ConnectedSourceCard>

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
