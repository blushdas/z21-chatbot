import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseAdminError, formatAdminErrorMessage } from '@/utils/adminErrorParser';

const schema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  name: z.string().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).default('user'),
});

type FormValues = z.infer<typeof schema>;

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (userId: string) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onCreated }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to create users');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: values,
      });

      if (error) {
        const parsed = await parseAdminError(error);
        const { title, description } = formatAdminErrorMessage(parsed);
        toast.error(title, { description, duration: 8000 });
        return;
      }

      if (data?.error) {
        toast.error('User Creation Failed', { description: data.error });
        return;
      }

      toast.success('User created successfully');
      onCreated?.(data?.userId);
      reset();
      onClose();
    } catch (e: any) {
      console.error('Create user error:', e);
      toast.error('Unexpected Error', {
        description: e.message || 'Something went wrong. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="user@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" type="text" placeholder="Temp password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="Optional" {...register('name')} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={watch('role')} onValueChange={(v) => setValue('role', v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
          <p className="text-xs text-muted-foreground">Share the temporary password with the user. They can change it later.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
