import { useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/hooks/useProjects'
import { useCanManageProject } from '@/hooks/useCanManageProject'
import {
  useIntegrations,
  useUpsertIntegration,
  useRemoveIntegration,
  useCheckHealth,
  readJiraConfig,
  type ProjectIntegration,
  type JiraConfig,
} from '@/hooks/useIntegrations'
import {
  useTeamsChannels,
  useAddTeamsChannel,
  useRemoveTeamsChannel,
  type TeamsChannel,
} from '@/hooks/useTeamsChannels'
import { useSlackChannels } from '@/hooks/useSlackChannels'
import { HealthBadge } from '@/components/HealthBadge'
import { Chip } from '@/components/Chip'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
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
import { formatRelativeTime } from '@/lib/format'
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
 * Azure AD app registration (client id/secret) plus a "Get link to
 * channel" URL paste that fills team id/tenant id server-side (see
 * teams_integration.services.parse_teams_channel_link) — same convenience
 * the Django admin's ProjectIntegrationAdminForm offers, mirrored here so
 * management doesn't need admin access to connect a project's Teams.
 * Client secret and the channel link are one-shot/write-only fields (never
 * round-tripped by the API) — cleared only once the save actually succeeds
 * (via the `onSuccess` callback passed to `onSave`), not unconditionally
 * right after firing the mutation, so a failed save (e.g. a malformed
 * secret rejected server-side) doesn't also throw away what was typed.
 */
function TeamsConfigForm({
  integration,
  onSave,
  saving,
}: {
  integration: ProjectIntegration
  onSave: (
    fields: {
      teams_client_id: string
      teams_client_secret?: string
      teams_channel_link?: string
    },
    callbacks: { onSuccess: () => void }
  ) => void
  saving: boolean
}) {
  const [clientId, setClientId] = useState(integration.teams_client_id ?? '')
  const [clientSecret, setClientSecret] = useState('')
  const [channelLink, setChannelLink] = useState('')
  const [touched, setTouched] = useState(false)

  const dirty =
    clientId !== (integration.teams_client_id ?? '') || clientSecret !== '' || channelLink !== ''
  const clientIdInvalid = touched && !clientId
  // No existing client id means this connection has never been configured
  // — there's no previously-saved secret for a blank field to fall back
  // to, so a secret must be entered now rather than silently half-
  // configuring the integration (mirrors the placeholder text below).
  const secretRequired = !integration.teams_client_id
  const clientSecretInvalid = touched && secretRequired && !clientSecret

  function handleSave() {
    setTouched(true)
    if (!clientId || (secretRequired && !clientSecret)) return
    onSave(
      {
        teams_client_id: clientId,
        teams_client_secret: clientSecret || undefined,
        teams_channel_link: channelLink || undefined,
      },
      {
        onSuccess: () => {
          setClientSecret('')
          setChannelLink('')
        },
      }
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`teams-client-id-${integration.id}`}>Client ID</Label>
          <Input
            id={`teams-client-id-${integration.id}`}
            placeholder="Azure AD application (client) ID"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="mt-1.5"
          />
          {clientIdInvalid && <p className="mt-1 text-xs text-destructive">Required</p>}
        </div>
        <div>
          <Label htmlFor={`teams-client-secret-${integration.id}`}>Client secret</Label>
          <Input
            id={`teams-client-secret-${integration.id}`}
            type="password"
            autoComplete="off"
            placeholder={
              integration.teams_client_id ? 'Leave blank to keep existing' : 'Azure AD client secret'
            }
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            className="mt-1.5"
          />
          {clientSecretInvalid && <p className="mt-1 text-xs text-destructive">Required</p>}
        </div>
      </div>
      <div>
        <Label htmlFor={`teams-channel-link-${integration.id}`}>Team channel link</Label>
        <Input
          id={`teams-channel-link-${integration.id}`}
          placeholder='Paste a channel’s "Get link to channel" URL to set the team'
          value={channelLink}
          onChange={(event) => setChannelLink(event.target.value)}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-slate-500">
          {integration.teams_team_id
            ? `Connected to team ${integration.teams_team_name || integration.teams_team_id}`
            : 'Not connected to a team yet — paste a channel link above.'}
        </p>
      </div>
      <div className="flex justify-end">
        <ShimmerButton mode="light" loading={saving}>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saving || (touched && secretRequired && !clientSecret)}
            onClick={handleSave}
          >
            Save Teams config
          </Button>
        </ShimmerButton>
      </div>
    </div>
  )
}

/**
 * List/add/enable-toggle/remove for the channels monitored under one Teams
 * connection (see ProjectIntegrationViewSet.teams_channels) — a connection
 * always has its own row even with zero channels, so this renders as soon
 * as the integration row exists, independent of whether team id is set yet.
 */
function TeamsChannelsSection({ integrationId }: { integrationId: number }) {
  const { data: channels, isLoading } = useTeamsChannels(integrationId)
  const addChannel = useAddTeamsChannel(integrationId)
  const removeChannel = useRemoveTeamsChannel(integrationId)
  const [input, setInput] = useState('')
  // Confirm before deleting — unlike a toggle, this isn't reversible from
  // this panel (the channel has to be re-added by link/id from scratch).
  const [removeTarget, setRemoveTarget] = useState<TeamsChannel | null>(null)

  function handleAdd() {
    if (!input.trim()) return
    addChannel.mutate(input, { onSuccess: () => setInput('') })
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="text-xs font-semibold text-slate-500">Teams</p>

      <div className="flex gap-2">
        <Input
          placeholder="Paste the channel link"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1"
        />
        <ShimmerButton mode="light" loading={addChannel.isPending}>
          <Button
            type="button"
            disabled={!input.trim() || addChannel.isPending}
            onClick={handleAdd}
          >
            Add
          </Button>
        </ShimmerButton>
      </div>

      {isLoading ? (
        <ShimmerContentBlock mode="light" items={1} loading />
      ) : channels.length === 0 ? (
        <p className="text-xs text-slate-500">No channels yet — add one above.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => (
            <Chip
              key={channel.id}
              label={`#${channel.channel_name || channel.channel_id}`}
              name={channel.channel_name || channel.channel_id}
              onRemove={() => setRemoveTarget(channel)}
            />
          ))}
        </div>
      )}

      <Dialog open={removeTarget != null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this channel?</DialogTitle>
            <DialogDescription>
              {(removeTarget?.channel_name || removeTarget?.channel_id) ?? 'This channel'} will
              stop being monitored. You can add it back later by link or channel id.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  removeChannel.mutate(removeTarget.id)
                  setRemoveTarget(null)
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

/**
 * Read-only list of channels this project's Slack connection has actually
 * seen messages from (see `ProjectIntegrationViewSet.slack_channels`) — no
 * add/remove here, unlike Teams: Slack has no channel-registry model to
 * manage (D-07 — no manual channel entry), so this is purely a display of
 * what's already been auto-discovered via message history.
 */
function SlackChannelsSection({ integrationId }: { integrationId: number }) {
  const { data: channels, isLoading, isError, refetch } = useSlackChannels(integrationId)

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="text-xs font-semibold text-slate-500">Slack Channel</p>

      {isLoading ? (
        <ShimmerContentBlock mode="light" items={1} loading />
      ) : channels.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <Chip
                key={channel.channel_id}
                label={`#${channel.channel_name || channel.channel_id}`}
              />
            ))}
          </div>
          {isError && (
            <p className="text-xs text-slate-500">
              Couldn't refresh — showing the last-loaded list.{' '}
              <button type="button" onClick={() => refetch()} className="underline">
                Retry
              </button>
            </p>
          )}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load Slack channels.</AlertTitle>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      ) : (
        <p className="text-xs text-slate-500">
          No channels seen yet — they'll appear here once messages come in.
        </p>
      )}
    </div>
  )
}

/**
 * PROJ-03/ADMIN-02: Jira and Teams both get an on/off toggle plus an inline
 * config form (D-08 — Jira's token stays wizard-only, everything else is
 * editable here); Slack is a DISPLAY SHELL ONLY (D-07 — no manual channel
 * entry, channels are auto-discovered once the app is installed in
 * Phase 4/7) — SlackChannelsSection above shows those auto-discovered
 * channels, read-only.
 */
export function IntegrationsTab({ project }: { project: Project }) {
  const { canManage } = useCanManageProject(project)
  const projectId = String(project.id)

  const { data: integrations, isLoading: integrationsLoading } = useIntegrations(projectId)
  const removeIntegration = useRemoveIntegration(projectId)
  const [removeTargetId, setRemoveTargetId] = useState<number | null>(null)

  // One upsert + one row-action check-health + one config-save check-health
  // instance PER integration type — sharing a single instance across cards
  // (or across a card's own row-action vs. config-form buttons) makes
  // saving/probing one integration light up an unrelated button's loading/
  // disabled state too (PR #2 review, then PR #10 review for the
  // cross-card case once Teams grew its own config form).
  const jiraUpsert = useUpsertIntegration(projectId)
  const jiraCheckHealth = useCheckHealth(projectId)
  const jiraConfigHealthCheck = useCheckHealth(projectId)
  const slackCheckHealth = useCheckHealth(projectId)
  const teamsUpsert = useUpsertIntegration(projectId)
  const teamsCheckHealth = useCheckHealth(projectId)
  const teamsConfigHealthCheck = useCheckHealth(projectId)

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
  const teams = integrations.find((integration) => integration.type === 'teams')

  function integrationRowActions(
    integration: ProjectIntegration | undefined,
    checkHealth: ReturnType<typeof useCheckHealth>
  ) {
    if (!canManage || !integration) return null
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
    <div className="grid w-full grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <ConnectedSourceCard
        icon="/icons/source-jira.svg"
        label="Jira"
        description="Sprint, issue & project activity tracking"
        status={
          <>
            <HealthBadge status={jira?.health_status ?? 'not_configured'} />
            <Switch
              checked={jira?.enabled ?? false}
              disabled={!canManage || jiraUpsert.isPending}
              aria-label="Toggle Jira integration"
              onCheckedChange={(checked) =>
                jiraUpsert.mutate({ id: jira?.id, type: 'jira', enabled: checked })
              }
            />
            {integrationRowActions(jira, jiraCheckHealth)}
          </>
        }
      >
        {canManage &&
          (jira?.id ? (
            <JiraConfigForm
              integration={jira}
              saving={jiraUpsert.isPending || jiraConfigHealthCheck.isPending}
              onSave={(config) =>
                jiraUpsert.mutate(
                  { id: jira.id, type: 'jira', config },
                  {
                    onSuccess: () => {
                      toast.success('Jira config saved')
                      jiraConfigHealthCheck.mutate(jira.id)
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
            {integrationRowActions(slackOwn, slackCheckHealth)}
          </>
        }
      >
        {slackOwn?.slack_installed_at ? (
          <>
            <p className="text-sm text-slate-600">
              Installed in{' '}
              <span className="font-medium text-foreground">
                {slackOwn.slack_team_name || 'the Slack workspace'}
              </span>{' '}
              &middot; {formatRelativeTime(slackOwn.slack_installed_at)}
            </p>
            <SlackChannelsSection integrationId={slackOwn.id} />
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500">Not installed</p>
            <p className="text-xs text-slate-500">
              No channels — channels are auto-discovered once the app is installed in the workspace.
            </p>
          </>
        )}
      </ConnectedSourceCard>

      <ConnectedSourceCard
        icon="/icons/source-teams.svg"
        label="Microsoft Teams"
        description="Team collaboration and updates"
        status={
          <>
            <HealthBadge status={teams?.health_status ?? 'not_configured'} />
            <Switch
              checked={teams?.enabled ?? false}
              disabled={!canManage || teamsUpsert.isPending}
              aria-label="Toggle Microsoft Teams integration"
              onCheckedChange={(checked) =>
                teamsUpsert.mutate({ id: teams?.id, type: 'teams', enabled: checked })
              }
            />
            {integrationRowActions(teams, teamsCheckHealth)}
          </>
        }
      >
        {canManage ? (
          teams?.id ? (
            <>
              <TeamsConfigForm
                integration={teams}
                saving={teamsUpsert.isPending || teamsConfigHealthCheck.isPending}
                onSave={(fields, { onSuccess }) =>
                  teamsUpsert.mutate(
                    { id: teams.id, type: 'teams', ...fields },
                    {
                      onSuccess: () => {
                        toast.success('Teams config saved')
                        teamsConfigHealthCheck.mutate(teams.id)
                        onSuccess()
                      },
                    }
                  )
                }
              />
              <TeamsChannelsSection integrationId={teams.id} />
            </>
          ) : (
            <p className="border-t border-border pt-4 text-xs text-slate-500">
              Toggle Microsoft Teams on above to configure its connection.
            </p>
          )
        ) : teams?.teams_team_id ? (
          <p className="text-sm text-slate-600">
            Connected to team{' '}
            <span className="font-medium text-foreground">
              {teams.teams_team_name || teams.teams_team_id}
            </span>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Not connected yet — ask an admin to set up the Teams connection.
          </p>
        )}
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
