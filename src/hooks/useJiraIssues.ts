import { useQuery } from '@tanstack/react-query'
import { getJson } from '@/lib/api'

export interface JiraIssueSummary {
  key: string
  summary: string | null
  status: string | null
  assignee: string | null
  priority: string | null
  updated: string | null
  start_date: string | null
  due_date: string | null
}

export interface JiraIssueDetail extends JiraIssueSummary {
  description: string
  reporter: string | null
}

export interface JiraIssueListResponse {
  next_page_token: string | null
  is_last: boolean
  issues: JiraIssueSummary[]
}

export interface JiraComment {
  author: string | null
  body: string
  created: string | null
}

export interface JiraCommentsResponse {
  total: number
  start_at: number
  max_results: number
  comments: JiraComment[]
}

const PAGE_SIZE = 25

/**
 * Read-only ticket browser (backend `jira/issues*` actions —
 * `_jira_client_for` on ProjectIntegrationViewSet). Every read hits Jira's
 * live API, not cached DB state, so keep results short-lived rather than
 * treating them like normal server-state (no invalidation trigger exists
 * for "Jira changed").
 */
export function useJiraIssues(integrationId: number | undefined, pageToken: string | null) {
  return useQuery({
    queryKey: ['jira-issues', integrationId, pageToken],
    queryFn: () => {
      const params = new URLSearchParams({ max_results: String(PAGE_SIZE) })
      if (pageToken) params.set('page_token', pageToken)
      return getJson<JiraIssueListResponse>(
        `/api/integrations/${integrationId}/jira/issues/?${params.toString()}`
      )
    },
    enabled: integrationId !== undefined,
    staleTime: 30_000,
  })
}

export function useJiraIssue(integrationId: number | undefined, issueKey: string | null) {
  return useQuery({
    queryKey: ['jira-issue', integrationId, issueKey],
    queryFn: () =>
      getJson<JiraIssueDetail>(`/api/integrations/${integrationId}/jira/issues/${issueKey}/`),
    enabled: integrationId !== undefined && issueKey !== null,
    staleTime: 30_000,
  })
}

export function useJiraIssueComments(integrationId: number | undefined, issueKey: string | null) {
  return useQuery({
    queryKey: ['jira-issue-comments', integrationId, issueKey],
    queryFn: () =>
      getJson<JiraCommentsResponse>(
        `/api/integrations/${integrationId}/jira/issues/${issueKey}/comments/?max_results=50`
      ),
    enabled: integrationId !== undefined && issueKey !== null,
    staleTime: 30_000,
  })
}
