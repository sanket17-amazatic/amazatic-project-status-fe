import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsers } from '@/hooks/useUsers'
import { useCreateProject } from '@/hooks/useProjectMutations'
import { MemberTypeahead } from './MemberTypeahead'
import { ShimmerButton, ShimmerDiv } from 'shimmer-effects-react'

// Same shape check TeamTab.tsx's AssociatedEmailsSection uses for the same
// concept (accounts.AssociatedEmail) — kept in sync for a consistent
// validation story across the create wizard and the post-creation flow.
const EMAIL_RE = /^\S+@\S+\.\S+$/

const wizardSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().nullable(),
    jira_api_token: z.string(),
    project_manager: z.number().optional(),
    member_ids: z.array(z.number()),
    project_manager_email: z.string(),
    member_emails: z.record(z.string(), z.string()),
  })
  .refine((data) => data.project_manager !== undefined, {
    message: 'Project manager is required',
    path: ['project_manager'],
  })
  .superRefine((data, ctx) => {
    if (data.project_manager_email && !EMAIL_RE.test(data.project_manager_email)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid email',
        path: ['project_manager_email'],
      })
    }
    for (const [id, email] of Object.entries(data.member_emails)) {
      if (email && !EMAIL_RE.test(email)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email',
          path: ['member_emails', id],
        })
      }
    }
  })

type WizardValues = z.infer<typeof wizardSchema>

const STEPS: { label: string; fields: (keyof WizardValues)[] }[] = [
  { label: 'Project Details', fields: ['name', 'description', 'start_date', 'end_date'] },
  { label: 'Connect Date Sources', fields: ['jira_api_token'] },
  { label: 'Team Configuration', fields: ['project_manager', 'member_ids'] },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * 3-step project creation wizard (PROJ-01). Each step's own fields are
 * validated via `form.trigger` before advancing, but the whole thing is
 * still one form — the final step's submit fires a single
 * POST /api/projects/ carrying every step's data (backend:
 * ProjectSerializer.create fans jira_api_token/member_ids out to
 * ProjectIntegration/Membership rows in one transaction).
 */
export function ProjectCreateWizard() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { data: users, isLoading: usersLoading } = useUsers()
  const createProject = useCreateProject()

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: todayISO(),
      end_date: null,
      jira_api_token: '',
      project_manager: undefined,
      member_ids: [],
      project_manager_email: '',
      member_emails: {},
    },
  })

  const managerId = form.watch('project_manager')
  const memberIds = form.watch('member_ids')
  const selectedMembers = useMemo(
    () => users.filter((user) => memberIds.includes(user.id)),
    [users, memberIds]
  )

  async function goNext() {
    const valid = await form.trigger(STEPS[step].fields)
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleSubmit(values: WizardValues) {
    const member_emails = Object.fromEntries(
      Object.entries(values.member_emails)
        .filter(([id, email]) => email && values.member_ids.includes(Number(id)))
        .map(([id, email]) => [Number(id), email])
    )
    createProject.mutate(
      {
        name: values.name,
        description: values.description,
        start_date: values.start_date,
        end_date: values.end_date,
        status: 'not_started',
        project_manager: values.project_manager,
        jira_api_token: values.jira_api_token || undefined,
        member_ids: values.member_ids,
        project_manager_email: values.project_manager_email || undefined,
        member_emails: Object.keys(member_emails).length > 0 ? member_emails : undefined,
      },
      { onSuccess: (project) => navigate(`/projects/${project.id}`) }
    )
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (isLastStep) {
                  void form.handleSubmit(handleSubmit)(event)
                } else {
                  void goNext()
                }
              }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <FormField
                  control={form.control}
                  name="jira_api_token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jira API Token (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="off"
                          placeholder="Leave blank to connect Jira later"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="project_manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Manager</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const nextManagerId = Number(value)
                            field.onChange(nextManagerId)
                            // Manager can't also sit in the members list (spec).
                            form.setValue(
                              'member_ids',
                              form.getValues('member_ids').filter((id) => id !== nextManagerId)
                            )
                          }}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a project manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usersLoading ? (
                              <div className="p-2">
                                <ShimmerDiv mode="light" height={32} width="100%" loading />
                              </div>
                            ) : (
                              users.map((user) => (
                                <SelectItem key={user.id} value={String(user.id)}>
                                  {user.name || user.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="project_manager_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project manager&apos;s client workspace email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="pm@client.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="member_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Members</FormLabel>
                        <FormControl>
                          {usersLoading ? (
                            <ShimmerDiv mode="light" height={40} width="100%" loading />
                          ) : (
                            <MemberTypeahead
                              users={users}
                              excludeUserId={managerId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {memberIds.length > 0 && (
                    <div className="space-y-2">
                      <FormLabel>Client workspace emails (optional)</FormLabel>
                      {selectedMembers.map((user) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <span className="w-1/3 shrink-0 truncate text-sm text-muted-foreground">
                            {user.name || user.email}
                          </span>
                          <FormField
                            control={form.control}
                            name={`member_emails.${user.id}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder={`${user.name?.split(' ')[0]?.toLowerCase() || 'member'}@client.com`}
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-center gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 0}
                  className="min-w-32 rounded-full border-[#38C776] text-[#38C776] hover:bg-[#38C776]/10 hover:text-[#38C776]"
                >
                  Back
                </Button>
                <ShimmerButton mode="light" loading={isLastStep && createProject.isPending}>
                  <Button
                    type="submit"
                    disabled={isLastStep && createProject.isPending}
                    className="min-w-32 rounded-full bg-[#38C776] text-white hover:bg-[#2fb267]"
                  >
                    {isLastStep ? 'Create Project' : 'Next'}
                  </Button>
                </ShimmerButton>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

/** Design shows every step in the same completed navy style, regardless of
 * current position — no active/upcoming color distinction (per design). */
function StepIndicator() {
  return (
    <div className="mb-6 flex items-center justify-center gap-4">
      {STEPS.map((item, index) => (
        <div key={item.label} className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-sidebar-foreground">
              {index + 1}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap text-foreground">
              {item.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className="h-px w-10 bg-slate-300" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}
