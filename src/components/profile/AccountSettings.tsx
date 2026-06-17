import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Shield, ShieldCheck, ShieldAlert, Loader2, Check, Pencil, BadgeCheck, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useProfile, evaluatePasswordStrength, isPasswordStrong } from '@/hooks/useProfile';
import { toast } from 'sonner';

/**
 * Consolidated "Account" tab: name, email, phone (optional), password, 2FA.
 * Each section is an editable row. Phone writes to profiles.phone, email goes
 * through supabase.auth.updateUser (triggers verification), password uses the
 * existing useProfile.updatePassword helper, 2FA links to the setup flow.
 */
const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const profileHook = useProfile();

  // Editable fields
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneFromDb, setPhoneFromDb] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // Password change flow
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone verification flow
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submittingCode, setSubmittingCode] = useState(false);

  // 2FA status
  const [twoFactor, setTwoFactor] = useState<{ enabled: boolean; method: string | null }>({
    enabled: false,
    method: null,
  });
  const [loading2fa, setLoading2fa] = useState(true);

  useEffect(() => {
    if (!user) return;
    setName(profileHook.profile.name || user.user_metadata?.name || '');
    setEmail(user.email || '');
  }, [user, profileHook.profile.name]);

  const refresh2FA = useCallback(async () => {
    if (!user) return;
    const { data: tf } = await supabase
      .from('two_factor_settings')
      .select('enabled, method')
      .eq('user_id', user.id)
      .maybeSingle();
    setTwoFactor({ enabled: !!tf?.enabled, method: tf?.method ?? null });
    setLoading2fa(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: profileRow } = await supabase
        .from('profiles').select('phone, phone_verified').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      setPhone(profileRow?.phone ?? '');
      setPhoneFromDb(profileRow?.phone ?? '');
      setPhoneVerified(!!profileRow?.phone_verified);
      await refresh2FA();
    })();
    return () => { cancelled = true; };
  }, [user, refresh2FA]);

  // Auto-refresh 2FA state after user returns from /auth/setup-2fa flow.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => { refresh2FA(); };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh2FA(); };
    const onCustom = () => { refresh2FA(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('2fa:updated', onCustom);

    const channel = supabase
      .channel(`two_factor_settings:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'two_factor_settings', filter: `user_id=eq.${user.id}` },
        () => refresh2FA(),
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('2fa:updated', onCustom);
      supabase.removeChannel(channel);
    };
  }, [user, refresh2FA]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error('Name cannot be empty'); return; }
    await profileHook.updateProfile({ name: trimmed });
    setEditingName(false);
  };

  const saveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/.+@.+\..+/.test(trimmed)) { toast.error('Enter a valid email'); return; }
    await profileHook.updateProfile({ email: trimmed });
    setEditingEmail(false);
  };

  const savePhone = async () => {
    if (!user) return;
    setSavingPhone(true);
    try {
      const value = phone.trim() || null;
      const { error } = await supabase
        .from('profiles')
        .update({ phone: value })
        .eq('id', user.id);
      if (error) throw error;
      setPhoneFromDb(value ?? '');
      setPhoneVerified(false); // trigger clears flag server-side; mirror locally
      setCodeSent(false);
      setCodeInput('');
      toast.success(value ? 'Phone number saved' : 'Phone number cleared');
      setEditingPhone(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneFromDb) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-phone-verification', {
        body: { phone: phoneFromDb },
      });
      if (error) throw error;
      if ((data as any)?.alreadyVerified) {
        setPhoneVerified(true);
        toast.success('Phone is already verified');
        return;
      }
      setSentTo((data as any)?.sentTo ?? null);
      setCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send code');
    } finally {
      setVerifying(false);
    }
  };

  const submitVerificationCode = async () => {
    if (!/^\d{6}$/.test(codeInput)) { toast.error('Enter the 6-digit code'); return; }
    setSubmittingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-phone-code', {
        body: { code: codeInput },
      });
      if (error) throw error;
      if ((data as any)?.verified) {
        setPhoneVerified(true);
        setCodeSent(false);
        setCodeInput('');
        toast.success('Phone number verified');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Invalid code');
    } finally {
      setSubmittingCode(false);
    }
  };

  const Row: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
    icon, label, children,
  }) => (
    <div className="border-b border-[var(--chat-border)] last:border-0 py-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6 space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <User size={16} className="text-brand-yellow" />
        <h2 className="text-base font-semibold text-[var(--chat-text)]">Account</h2>
      </div>
      <p className="text-sm text-[var(--chat-muted)] -mt-3 mb-2">
        Manage how you sign in to Daryle AI.
      </p>

      {/* Name */}
      <Row icon={<User size={11} />} label="Full Name">
        {editingName ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] focus:outline-none focus:border-brand-yellow"
            />
            <button onClick={saveName} disabled={profileHook.loading}
              className="px-3 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50">
              {profileHook.loading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
            <button onClick={() => { setEditingName(false); setName(profileHook.profile.name || ''); }}
              className="px-3 py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)]">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--chat-text)]">{name || '—'}</span>
            <button onClick={() => setEditingName(true)}
              className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1">
              <Pencil size={12} /> Edit
            </button>
          </div>
        )}
      </Row>

      {/* Email */}
      <Row icon={<Mail size={11} />} label="Email Address">
        {(() => {
          const emailConfirmed = !!(user as any)?.email_confirmed_at;
          const pendingEmail: string | null =
            (user as any)?.new_email ||
            (user as any)?.user_metadata?.pending_email ||
            null;
          const hasPendingChange = !!pendingEmail && pendingEmail !== user?.email;

          if (editingEmail && !hasPendingChange) {
            return (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] focus:outline-none focus:border-brand-yellow"
                />
                <button onClick={saveEmail} disabled={profileHook.loading}
                  className="px-3 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50">
                  {profileHook.loading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                </button>
                <button onClick={() => { setEditingEmail(false); setEmail(user?.email || ''); }}
                  className="px-3 py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)]">
                  Cancel
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--chat-text)] truncate">{email || '—'}</p>
                {emailConfirmed ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <BadgeCheck size={11} className="text-emerald-500" />
                    <span className="text-[11px] text-emerald-500">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertCircle size={11} className="text-[color:var(--color-warning)]" />
                    <span className="text-[11px] text-[color:var(--color-warning)]">Not verified</span>
                  </div>
                )}

                {hasPendingChange && (
                  <div className="mt-2 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin text-[color:var(--color-warning)]" />
                      <span className="text-[11px] font-medium text-[color:var(--color-warning)]">
                        Pending verification
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--chat-muted)] mt-1 break-all">
                      Confirmation sent to <span className="text-[var(--chat-text)]">{pendingEmail}</span>.
                      Click the link in that email to complete the change.
                    </p>
                    <button
                      onClick={async () => {
                        if (!pendingEmail) return;
                        const { error } = await supabase.auth.updateUser({ email: pendingEmail });
                        if (error) toast.error(error.message);
                        else toast.success('Confirmation email resent');
                      }}
                      className="mt-1.5 text-[11px] text-brand-yellow hover:text-brand-yellow/80"
                    >
                      Resend confirmation
                    </button>
                  </div>
                )}
              </div>

              {hasPendingChange ? (
                <span
                  title="Confirm the pending change before editing again"
                  className="text-xs text-[var(--chat-muted)] flex items-center gap-1 flex-shrink-0 cursor-not-allowed opacity-60"
                >
                  <Pencil size={12} /> Edit
                </span>
              ) : (
                <button onClick={() => setEditingEmail(true)}
                  className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1 flex-shrink-0">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
          );
        })()}
      </Row>

      {/* Phone */}
      <Row icon={<Phone size={11} />} label="Phone (optional)">
        {editingPhone ? (
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
            />
            <button onClick={savePhone} disabled={savingPhone}
              className="px-3 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50">
              {savingPhone ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
            <button onClick={() => { setEditingPhone(false); setPhone(phoneFromDb); }}
              className="px-3 py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)]">
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-[var(--chat-text)] truncate">
                  {phoneFromDb || <span className="text-[var(--chat-muted)]">Not set</span>}
                </p>
                {phoneFromDb && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {phoneVerified ? (
                      <>
                        <BadgeCheck size={11} className="text-green-500" />
                        <span className="text-[11px] text-green-500">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={11} className="text-amber-500" />
                        <span className="text-[11px] text-amber-500">Not verified</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {phoneFromDb && !phoneVerified && !codeSent && (
                  <button onClick={sendVerificationCode} disabled={verifying}
                    className="text-xs text-brand-blue bg-brand-yellow hover:bg-brand-yellow/90 px-2.5 py-1 rounded-md font-medium disabled:opacity-50 flex items-center gap-1">
                    {verifying ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                    Verify
                  </button>
                )}
                <button onClick={() => setEditingPhone(true)}
                  className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1">
                  <Pencil size={12} /> {phoneFromDb ? 'Edit' : 'Add'}
                </button>
              </div>
            </div>
            {codeSent && (
              <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] p-3 space-y-2">
                <p className="text-xs text-[var(--chat-muted)]">
                  Enter the 6-digit code we sent to <span className="text-[var(--chat-text)]">{sentTo || 'your email'}</span>.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card)] text-sm text-[var(--chat-text)] tracking-[0.4em] text-center focus:outline-none focus:border-brand-yellow"
                  />
                  <button onClick={submitVerificationCode} disabled={submittingCode || codeInput.length !== 6}
                    className="px-3 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50">
                    {submittingCode ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setCodeSent(false); setCodeInput(''); }}
                    className="text-[11px] text-[var(--chat-muted)] hover:text-[var(--chat-text)]">
                    Cancel
                  </button>
                  <button onClick={sendVerificationCode} disabled={verifying}
                    className="text-[11px] text-brand-yellow hover:text-brand-yellow/80">
                    {verifying ? 'Sending…' : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Row>

      {/* Password */}
      <Row icon={<Lock size={11} />} label="Password">
        {showPassword ? (
          (() => {
            const strength = evaluatePasswordStrength(profileHook.newPassword);
            const strong = isPasswordStrong(profileHook.newPassword);
            const matches =
              confirmPassword.length > 0 && confirmPassword === profileHook.newPassword;
            const canSubmit =
              !profileHook.loading &&
              currentPassword.length > 0 &&
              strong &&
              matches &&
              profileHook.newPassword !== currentPassword;
            const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
              <li className="flex items-center gap-1.5 text-[11px]">
                {ok ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <X size={12} className="text-[var(--chat-muted)]" />
                )}
                <span className={ok ? 'text-emerald-500' : 'text-[var(--chat-muted)]'}>
                  {label}
                </span>
              </li>
            );
            return (
              <div className="space-y-2">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  value={profileHook.newPassword}
                  onChange={e => profileHook.setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
                />
                {confirmPassword.length > 0 && !matches && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Passwords do not match
                  </p>
                )}
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                  <Rule ok={strength.length} label="10+ characters" />
                  <Rule ok={strength.upper} label="Uppercase letter" />
                  <Rule ok={strength.lower} label="Lowercase letter" />
                  <Rule ok={strength.number} label="Number" />
                  <Rule ok={strength.symbol} label="Symbol" />
                  <Rule ok={strength.notCommon} label="Not a common password" />
                </ul>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={async () => {
                      const ok = await profileHook.updatePassword(
                        profileHook.newPassword,
                        currentPassword
                      );
                      if (ok) {
                        setShowPassword(false);
                        setCurrentPassword('');
                        setConfirmPassword('');
                      }
                    }}
                    disabled={!canSubmit}
                    className="flex-1 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50">
                    {profileHook.loading ? 'Updating…' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPassword(false);
                      profileHook.setNewPassword('');
                      setCurrentPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)]">
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--chat-text)]">••••••••••</span>
            <button onClick={() => setShowPassword(true)}
              className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1">
              <Pencil size={12} /> Change
            </button>
          </div>
        )}
      </Row>

      {/* 2FA */}
      <Row icon={<Shield size={11} />} label="Two-Factor Authentication">
        {loading2fa ? (
          <div className="text-sm text-[var(--chat-muted)] flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : twoFactor.enabled ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-500" />
              <div>
                <p className="text-sm text-[var(--chat-text)]">Enabled</p>
                <p className="text-[11px] text-[var(--chat-muted)]">
                  Method: {twoFactor.method === 'totp' ? 'Authenticator app' : twoFactor.method === 'email' ? 'Email code' : twoFactor.method ?? 'Unknown'}
                </p>
              </div>
            </div>
            <Link to="/auth/setup-2fa"
              className="text-xs text-brand-yellow hover:text-brand-yellow/80 flex items-center gap-1">
              Manage
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" />
              <div>
                <p className="text-sm text-[var(--chat-text)]">Not enabled</p>
                <p className="text-[11px] text-[var(--chat-muted)]">
                  Add an extra layer of security to your account.
                </p>
              </div>
            </div>
            <Link to="/auth/setup-2fa"
              className="px-3 py-1.5 rounded-lg bg-brand-yellow text-brand-blue text-xs font-medium hover:bg-brand-yellow/90">
              Enable 2FA
            </Link>
          </div>
        )}
      </Row>
    </div>
  );
};

export default AccountSettings;