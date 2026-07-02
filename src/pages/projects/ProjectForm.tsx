import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import type { ProjectFormValues } from '@/hooks/useProjectMutations'
import type { Project } from '@/hooks/useProjects'

const STATUS_OPTIONS: { value: Project['status']; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

const baseSchema = {
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']),
}

const createSchema = z.object({
  ...baseSchema,
  project_manager: z.number({ error: 'Project manager is required' }),
})
const editSchema = z.object(baseSchema)

interface ProjectFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<ProjectFormValues>
  onSubmit: (values: ProjectFormValues) => void
  pending: boolean
}

/**
 * Shared create/edit form (PROJ-01/PROJ-04). No progress field — it's
 * read-only server-side (D-02). Create mode requires project_manager (the
 * FK is non-nullable, T-02-20); edit mode omits it — the Team tab (02-07)
 * owns PM reassignment.
 */
export function ProjectForm({ mode, defaultValues, onSubmit, pending }: ProjectFormProps) {
  const { data: users } = useUsers()
  const schema = mode === 'create' ? createSchema : editSchema

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      start_date: null,
      end_date: null,
      status: 'not_started',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === 'create' && (
          <FormField
            control={form.control}
            name="project_manager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project manager</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
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
        )}
        <Button type="submit" disabled={pending}>
          {mode === 'create' ? 'Create Project' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}
