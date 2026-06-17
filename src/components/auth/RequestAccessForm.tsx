import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { submitBetaWaitlist } from '@/services/betaWaitlistService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roles = [
  "Team Member",
  "Executive",
  "Family",
  "Investor",
  "Ambassador",
  "Other"
];

interface RequestAccessFormProps {
  onSubmit?: () => void;
  standalone?: boolean;
}

const RequestAccessForm: React.FC<RequestAccessFormProps> = ({ onSubmit, standalone = false }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organization: '',
    role: '',
    reason: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason for requesting access';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitBetaWaitlist({
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        organization: formData.organization.trim() || undefined,
        reason: `[${formData.role}] ${formData.reason.trim()}`
      });
      
      // Fire-and-forget admin notification (no auth required)
      supabase.functions.invoke('notify-waitlist-request', {
        body: {
          name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          organization: formData.organization.trim() || null,
        }
      }).catch(err => console.warn('Notification dispatch failed (non-blocking):', err));
      
      setIsSubmitted(true);
      toast.success('Your request has been submitted!');
      onSubmit?.();
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle2 className="h-16 w-16 text-brand-green mx-auto" />
        <h3 className="text-xl font-semibold text-foreground">Request Submitted!</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Thank you for your interest in Daryle AI. Our team will review your request and reach out when your access is ready.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {standalone && (
        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground">
            Fill out this form to request access to Daryle AI. Our team will review and approve your request.
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Your full name"
          className={errors.fullName ? "border-destructive" : ""}
          disabled={isSubmitting}
        />
        {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className={errors.email ? "border-destructive" : ""}
          disabled={isSubmitting}
        />
        {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="organization">Organization <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          id="organization"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="Your company or organization"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role or Affiliation</Label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`w-full p-2 border rounded-md ${errors.role ? "border-destructive" : "border-input"} bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
          disabled={isSubmitting}
        >
          <option value="" disabled>Select your role...</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        {errors.role && <p className="text-destructive text-xs mt-1">{errors.role}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reason">Why are you requesting access?</Label>
        <Textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="Tell us why you'd like access to Daryle AI..."
          className={errors.reason ? "border-destructive" : ""}
          rows={4}
          disabled={isSubmitting}
        />
        {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason}</p>}
      </div>
      
      <Button
        type="submit"
        className="w-full bg-brand-green hover:bg-brand-green/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Request'
        )}
      </Button>
    </form>
  );
};

export default RequestAccessForm;
