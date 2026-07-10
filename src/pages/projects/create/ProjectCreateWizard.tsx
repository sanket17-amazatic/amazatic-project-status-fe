import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'
import { useUsers } from '@/hooks/useUsers'
import { useCreateProject } from '@/hooks/useProjectMutations'
import { MemberTypeahead } from './MemberTypeahead'

const wizardSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().nullable(),
    jira_api_token: z.string(),
    project_manager: z.number().optional(),
    member_ids: z.array(z.number()),
  })
  .refine((data) => data.project_manager !== undefined, {
    message: 'Project manager is required',
    path: ['project_manager'],
  })

type WizardValues = z.infer<typeof wizardSchema>

const STEPS: { label: string; fields: (keyof WizardValues)[] }[] = [
  { label: 'Project Info', fields: ['name', 'description', 'start_date', 'end_date'] },
  { label: 'Jira Integration', fields: ['jira_api_token'] },
  { label: 'Team', fields: ['project_manager', 'member_ids'] },
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
  const { data: users } = useUsers()
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
    },
  })

  const managerId = form.watch('project_manager')

  async function goNext() {
    const valid = await form.trigger(STEPS[step].fields)
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleSubmit(values: WizardValues) {
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
      },
      { onSuccess: (project) => navigate(`/projects/${project.id}`) }
    )
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create Project</CardTitle>
        <StepIndicator step={step} />
      </CardHeader>
      <CardContent>
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
                      <FormLabel>Project manager</FormLabel>
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
                          {users.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="member_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team members</FormLabel>
                      <FormControl>
                        <MemberTypeahead
                          users={users}
                          excludeUserId={managerId}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                Back
              </Button>
              <Button type="submit" disabled={isLastStep && createProject.isPending}>
                {isLastStep ? 'Create Project' : 'Next'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mt-2 flex items-center">
      {STEPS.map((item, index) => (
        <div key={item.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                index <= step ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-400'
              )}
            >
              {index < step ? <Check className="size-4" aria-hidden="true" /> : index + 1}
            </div>
            <span
              className={cn(
                'text-xs whitespace-nowrap',
                index <= step ? 'text-foreground' : 'text-slate-400'
              )}
            >
              {item.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn('mx-2 h-px flex-1', index < step ? 'bg-primary' : 'bg-slate-200')} />
          )}
        </div>
      ))}
    </div>
  )
}
