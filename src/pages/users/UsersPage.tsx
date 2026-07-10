import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { useOrgUsers, type UserStatus } from '@/hooks/useOrgUsers'
import type { UserRole } from '@/stores/authStore'
import { ROLE_LABELS, ROLE_OPTIONS } from '@/lib/roles'
import { formatRelativeTime } from '@/lib/format'
import { InviteUserModal } from './InviteUserModal'

const PAGE_SIZE = 25

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, role, status])

  const { data, isLoading, isError, error, refetch } = useOrgUsers({ search, role, status, page })
  const users = data?.results ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search users..."
            aria-label="Search users"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={role || 'all'}
            onValueChange={(value) => setRole(value === 'all' ? '' : (value as UserRole))}
          >
            <SelectTrigger className="w-36" aria-label="Filter by role">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || 'all'}
            onValueChange={(value) => setStatus(value === 'all' ? '' : (value as UserStatus))}
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-[#38C776] text-white hover:bg-[#2fb267]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Invite User
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && error?.status === 403 && (
        <Alert variant="destructive">
          <AlertTitle>Management only — you don't have access to the Users page.</AlertTitle>
        </Alert>
      )}

      {isError && error?.status !== 403 && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load users. Check your connection and try again.</AlertTitle>
          <AlertAction>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-100">
                  <TableCell className="font-medium text-foreground">
                    {user.name || user.email}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell>{user.project_count}</TableCell>
                  <TableCell className="capitalize">{user.status}</TableCell>
                  <TableCell className="text-slate-500">
                    {formatRelativeTime(user.last_login)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">
              No users match your filters.
            </p>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
