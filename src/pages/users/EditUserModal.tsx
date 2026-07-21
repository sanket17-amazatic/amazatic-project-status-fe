import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_OPTIONS } from '@/lib/roles'
import { useUpdateUser, type OrgUser, type UpdateUserInput } from '@/hooks/useOrgUsers'
import { ShimmerButton } from 'shimmer-effects-react'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.enum(['management', 'pm', 'member'], { error: 'Role is required' }),
})

interface EditUserModalProps {
  user: OrgUser | null
  onOpenChange: (open: boolean) => void
}

/** Users admin page edit flow — mirrors InviteUserModal, minus email (fixed
 * to the Google SSO identity, not editable here). */
export function EditUserModal({ user, onOpenChange }: EditUserModalProps) {
  const updateUser = useUpdateUser(user?.id)
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', role: undefined },
  })

  useEffect(() => {
    if (user) {
      form.reset({ first_name: user.first_name, last_name: user.last_name, role: user.role })
    }
  }, [user, form])

  function handleSubmit(values: UpdateUserInput) {
    updateUser.mutate(values, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled readOnly className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
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
            <div className="flex justify-end">
              <ShimmerButton mode="light" loading={updateUser.isPending}>
                <Button
                  type="submit"
                  disabled={updateUser.isPending}
                  className="bg-[#38C776] text-white hover:bg-[#2fb267]"
                >
                  Save changes
                </Button>
              </ShimmerButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
