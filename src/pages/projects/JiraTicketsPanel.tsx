import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useIntegrations, apiErrorDetail } from '@/hooks/useIntegrations'
import { useJiraIssue, useJiraIssueComments, useJiraIssues } from '@/hooks/useJiraIssues'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ShimmerTable } from 'shimmer-effects-react'
import { formatIncidentTimestamp } from '@/lib/format'

function IssueStatusBadge({ status }: { status: string | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      {status ?? 'Unknown'}
    </span>
  )
}

function IssueDetailDialog({
  integrationId,
  issueKey,
  onOpenChange,
}: {
  integrationId: number
  issueKey: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { data: issue, isLoading: issueLoading, isError: issueIsError, error: issueError } =
    useJiraIssue(integrationId, issueKey)
  const { data: commentsData, isLoading: commentsLoading } = useJiraIssueComments(
    integrationId,
    issueKey
  )

  return (
    <Dialog open={issueKey !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {issueLoading && <ShimmerTable mode="light" row={3} col={1} loading={issueLoading} />}

        {issueIsError && (
          <Alert variant="destructive">
            <AlertTitle>{apiErrorDetail(issueError) ?? "Couldn't load this ticket."}</AlertTitle>
          </Alert>
        )}

        {issue && (
          <>
            <DialogHeader>
              <DialogTitle>
                {issue.key} — {issue.summary}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2">
                  <IssueStatusBadge status={issue.status} />
                  <span>{issue.assignee ? `Assigned to ${issue.assignee}` : 'Unassigned'}</span>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                <dt className="text-xs text-slate-500">Reporter</dt>
                <dd className="text-right text-foreground">{issue.reporter ?? '—'}</dd>
                <dt className="text-xs text-slate-500">Priority</dt>
                <dd className="text-right text-foreground">{issue.priority ?? '—'}</dd>
                <dt className="text-xs text-slate-500">Start date</dt>
                <dd className="text-right text-foreground">{issue.start_date ?? '—'}</dd>
                <dt className="text-xs text-slate-500">Due date</dt>
                <dd className="text-right text-foreground">{issue.due_date ?? '—'}</dd>
              </dl>

              {issue.description && (
                <p className="whitespace-pre-wrap text-foreground">{issue.description}</p>
              )}

              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-medium text-slate-500">
                  Comments{commentsData ? ` (${commentsData.total})` : ''}
                </h4>
                {commentsLoading && <p className="mt-2 text-xs text-slate-500">Loading…</p>}
                {commentsData?.comments.length === 0 && (
                  <p className="mt-2 text-xs text-slate-500">No comments.</p>
                )}
                <ul className="mt-2 space-y-2">
                  {commentsData?.comments.map((comment, index) => (
                    <li
                      key={`${comment.created ?? 'nodate'}-${comment.author ?? 'unknown'}-${index}`}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                            aria-hidden="true"
                          >
                            {(comment.author ?? '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium text-foreground">
                            {comment.author ?? 'Unknown'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatIncidentTimestamp(comment.created)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-slate-600">{comment.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Read-only Jira ticket browser — a standalone section next to Incidents,
 * not tucked inside "Manage project" (that disclosure is management-only
 * edit actions; browsing tickets isn't one, and any project member should
 * be able to find it without hunting through a mislabeled toggle).
 *
 * Every list/detail/comment read is a live call to Jira (backend has no
 * local ticket cache), so pagination follows Jira's own opaque
 * `next_page_token` cursor rather than the app's usual numbered-page
 * convention (Pagination component) — "Prev" just steps back through
 * tokens already seen this session instead of re-deriving one.
 */
export function JiraTicketsPanel({ projectId }: { projectId: number }) {
  const projectIdStr = String(projectId)
  const { data: integrations, isLoading: integrationsLoading } = useIntegrations(projectIdStr)
  const jira = integrations.find((integration) => integration.type === 'jira')

  const [pageStack, setPageStack] = useState<(string | null)[]>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [activeIssueKey, setActiveIssueKey] = useState<string | null>(null)

  const jiraId = jira?.enabled ? jira.id : undefined

  // Toggling Jira off/on (or swapping which integration row backs it)
  // invalidates any page_token cursor from the previous session — start
  // the ticket list over rather than replaying a stale token.
  useEffect(() => {
    setPageStack([null])
    setPageIndex(0)
  }, [jiraId])

  const { data, isLoading, isError, error } = useJiraIssues(jiraId, pageStack[pageIndex])

  if (integrationsLoading) {
    return (
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Jira Tickets</h2>
        <ShimmerTable mode="light" row={3} col={5} loading={integrationsLoading} />
      </div>
    )
  }

  if (!jira?.enabled) {
    return (
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Jira Tickets</h2>
        <p className="text-sm text-slate-500">
          Turn on Jira under Manage project → Integrations and save its config to browse tickets
          here.
        </p>
      </div>
    )
  }

  function goNext() {
    if (!data?.next_page_token) return
    const token = data.next_page_token
    setPageStack((stack) => [...stack.slice(0, pageIndex + 1), token])
    setPageIndex((index) => index + 1)
  }

  function goPrev() {
    setPageIndex((index) => Math.max(0, index - 1))
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Jira Tickets</h2>

      {isLoading && <ShimmerTable mode="light" row={5} col={5} loading={isLoading} />}

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>{apiErrorDetail(error) ?? "Couldn't load Jira tickets."}</AlertTitle>
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.issues.map((issue) => (
                <TableRow
                  key={issue.key}
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => setActiveIssueKey(issue.key)}
                >
                  <TableCell className="font-medium text-foreground">{issue.key}</TableCell>
                  <TableCell>{issue.summary}</TableCell>
                  <TableCell>
                    <IssueStatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell>{issue.assignee ?? 'Unassigned'}</TableCell>
                  <TableCell className="text-slate-500">
                    {formatIncidentTimestamp(issue.updated)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data.issues.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              No tickets in this project.
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={pageIndex === 0} onClick={goPrev}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={data.is_last} onClick={goNext}>
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </>
      )}

      {jira && (
        <IssueDetailDialog
          integrationId={jira.id}
          issueKey={activeIssueKey}
          onOpenChange={(open) => !open && setActiveIssueKey(null)}
        />
      )}
    </div>
  )
}
