import { useState } from 'react'
import { Hash, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SeverityBadge } from '@/components/SeverityBadge'
import { formatIncidentTimestamp } from '@/lib/format'
import { mapAiPriorityToSeverity } from '@/lib/severity'
import { SOURCE_META } from '@/lib/sources'
import type { Incident } from '@/hooks/useIncidents'

interface EvidenceDrawerProps {
  incident: Incident | null
  jiraBaseUrl: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Real data only — no fabricated evidence content. Message tab shows the
 * incident's own message_text/channel_name/created_at, labeled by its real
 * origin (Slack or Teams — see Incident.source); Jira tab lists real
 * jira_ticket_keys, linking out to the project's real jira_base_url. No
 * Email tab — no backing data, same "hide empty tabs" pattern the
 * reference design itself uses.
 */
export function EvidenceDrawer({ incident, jiraBaseUrl, open, onOpenChange }: EvidenceDrawerProps) {
  const [tab, setTab] = useState<'message' | 'jira'>('message')

  if (!incident) return null

  const hasMessage = Boolean(incident.message_text)
  const hasJira = incident.jira_ticket_keys.length > 0
  const messageSourceLabel = SOURCE_META[incident.source].label
  const availableTabs = [
    ...(hasMessage ? (['message'] as const) : []),
    ...(hasJira ? (['jira'] as const) : []),
  ]
  const activeTab = availableTabs.includes(tab) ? tab : availableTabs[0]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setTab('message')
      }}
    >
      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] max-w-[700px] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{incident.ai_summary}</DialogTitle>
            <SeverityBadge severity={mapAiPriorityToSeverity(incident.ai_priority)} />
          </div>
          <DialogDescription>{incident.ai_reasoning}</DialogDescription>
        </DialogHeader>

        {availableTabs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No evidence recorded for this incident.</p>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setTab(value as typeof tab)} className="flex flex-col gap-3">
            <TabsList>
              {hasMessage && <TabsTrigger value="message">{`${messageSourceLabel} Evidence`}</TabsTrigger>}
              {hasJira && <TabsTrigger value="jira">{`Jira Evidence (${incident.jira_ticket_keys.length})`}</TabsTrigger>}
            </TabsList>

            {hasMessage && (
              <TabsContent value="message" className="flex flex-col gap-3">
                <div className="flex w-full flex-col gap-2 rounded-sm border border-border p-3">
                  <div className="flex flex-col gap-2 rounded-md bg-muted p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="size-3 shrink-0 text-foreground" aria-hidden="true" />
                        <p className="text-[13px] font-semibold text-foreground">{incident.channel_name}</p>
                      </div>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatIncidentTimestamp(incident.created_at)}
                      </p>
                    </div>
                    <p className="text-xs leading-normal text-foreground">{`"${incident.message_text}"`}</p>
                  </div>
                </div>
              </TabsContent>
            )}

            {hasJira && (
              <TabsContent value="jira" className="flex flex-col gap-3">
                {incident.jira_ticket_keys.map((key) => (
                  <div
                    key={key}
                    className="flex w-full items-center justify-between rounded-sm border border-border p-3"
                  >
                    <p className="text-[13px] font-medium text-foreground">{`Ticket: ${key}`}</p>
                    {jiraBaseUrl ? (
                      <a
                        href={`${jiraBaseUrl.replace(/\/+$/, '')}/browse/${key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Open in Jira
                        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Jira not connected</span>
                    )}
                  </div>
                ))}
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
