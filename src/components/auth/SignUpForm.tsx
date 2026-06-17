import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


interface SignUpFormProps {
  onSuccess?: (email: string) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password validation - simple minimum length
  const validatePassword = (password: string) => {
    if (password.length < 6) return ['At least 6 characters'];
    return [];
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Server-side authorization check (covers both authorized_emails and
  // authorized_email_domains). Same edge function the login form uses.
  const validateEmailAuthorization = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-email-domain', {
        body: { email }
      });
      if (error) {
        console.error('Domain validation error:', error);
        return false;
      }
      return data?.isAuthorized === true;
    } catch (err) {
      console.error('Domain validation failed:', err);
      return false;
    }
  };

  // Phone formatting (optional field)
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = `Password must have: ${passwordErrors.join(', ')}`;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Server-side check honors both per-email and per-domain allowlists.
      const isAuthorized = await validateEmailAuthorization(formData.email);
      if (!isAuthorized) {
        toast.error('This email is not authorized to sign up. Please use an approved organization email or contact your administrator.');
        setLoading(false);
        return;
      }

      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email already registered. Please sign in instead.');
        } else {
          toast.error(error.message || 'Sign up failed');
        }
        return;
      }

      // Notify admins of new signup (fire-and-forget, non-blocking)
      supabase.functions.invoke('notify-new-signup', {
        body: {
          user_email: formData.email,
          user_name: formData.name,
          signed_up_at: new Date().toISOString()
        }
      }).catch((notifyError) => {
        console.warn('Failed to send signup notification:', notifyError);
      });

      toast.success('Account created! Please check your email to verify your account.');
      
      if (onSuccess) {
        onSuccess(formData.email);
      } else {
        navigate('/auth/confirmation', { 
          state: { email: formData.email }
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="John Doe"
          className={errors.name ? 'border-destructive' : ''}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Work Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="john@ambassador-enterprises.com"
          className={errors.email ? 'border-destructive' : ''}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Only authorized organization email addresses can sign up
        </p>
      </div>

      {/* Phone Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="(123) 456-7890"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Optional: For account recovery and two-factor authentication
        </p>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Create a strong password"
            className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum 6 characters
        </p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Re-enter your password"
            className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
