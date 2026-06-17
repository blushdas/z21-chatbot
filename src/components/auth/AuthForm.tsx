
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';

interface AuthFormProps {
  isLogin: boolean;
  onToggleMode: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { signIn } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({}); // Clear previous errors
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message?.toLowerCase().includes('invalid login')
          ? 'Incorrect email or password'
          : error.message || 'Sign in failed';
        setErrors((prev) => ({ ...prev, password: msg }));
        return;
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error Message */}
      {errors.general && (
        <div className="bg-[var(--color-error-soft)] border border-[var(--color-error-border)] text-[color:var(--color-error)] px-4 py-3 rounded-md">
          <p className="text-sm">{errors.general}</p>
        </div>
      )}
      
      <div className="space-y-1">
        <Label htmlFor="email" className="text-brand-blue font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`border-brand-blue/30 focus:border-brand-blue focus:ring-brand-blue/20 ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="password" className="text-brand-blue font-medium">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`border-brand-blue/30 focus:border-brand-blue focus:ring-brand-blue/20 pr-10 ${errors.password ? "border-red-500" : ""}`}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-brand-blue/50 hover:text-brand-blue" />
            ) : (
              <Eye className="h-4 w-4 text-brand-blue/50 hover:text-brand-blue" />
            )}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-semibold py-3 h-12 text-base"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue"></div>
            Signing In...
          </div>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
};

export default AuthForm;
