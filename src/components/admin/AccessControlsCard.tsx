import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Globe, Loader2, Plus, Trash2, Pencil, Check, ChevronsUpDown, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { COUNTRIES, countryName } from '@/lib/countries';
import { cn } from '@/lib/utils';

type AccessRule = {
  id: string;
  kind: 'ip_cidr' | 'country';
  value: string;
  mode: 'allow' | 'deny';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
};

type BlockEvent = {
  id: string;
  ip: string | null;
  country: string | null;
  endpoint: string;
  blocked_at: string;
  rule_id: string | null;
};

type RuleForm = {
  kind: 'ip_cidr' | 'country';
  value: string;
  mode: 'allow' | 'deny';
  severity: AccessRule['severity'];
  expires_at: string;
  notes: string;
};

const EMPTY_FORM: RuleForm = {
  kind: 'ip_cidr',
  value: '',
  mode: 'deny',
  severity: 'medium',
  expires_at: '',
  notes: '',
};

const SEVERITY_COLORS: Record<AccessRule['severity'], string> = {
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function validateRuleValue(kind: 'ip_cidr' | 'country', value: string): string | null {
  if (!value.trim()) return 'Value is required';
  if (kind === 'country') {
    if (!/^[A-Z]{2}$/.test(value.toUpperCase())) return 'Must be a 2-letter ISO country code (e.g. US, GB)';
  } else {
    const cidr = value.includes('/') ? value : `${value}/32`;
    const [ip, bits] = cidr.split('/');
    const parts = ip.split('.');
    if (parts.length !== 4 || parts.some(p => isNaN(Number(p)) || Number(p) < 0 || Number(p) > 255))
      return 'Invalid IPv4 address';
    const prefix = Number(bits);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return 'CIDR prefix must be 0–32';
  }
  return null;
}

const AccessControlsCard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // Master toggle
  const { data: toggleSetting, isLoading: toggleLoading } = useQuery({
    queryKey: ['platform-setting', 'access_controls_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'access_controls_enabled')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isEnabled = (toggleSetting?.value as { enabled?: boolean } | null)?.enabled !== false;

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: { enabled } })
        .eq('key', 'access_controls_enabled');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'access_controls_enabled'] });
      toast({ title: 'Setting updated', description: `Access controls ${isEnabled ? 'disabled' : 'enabled'}.` });
    },
    onError: (err) => toastError(err, 'Error', 'Failed to update setting.'),
  });

  // Rules list
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['access-control-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_control_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AccessRule[];
    },
  });

  // Recent blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['access-block-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_block_events')
        .select('*')
        .order('blocked_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BlockEvent[];
    },
    refetchInterval: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Omit<RuleForm, 'expires_at'> & { expires_at: string | null; id?: string }) => {
      if (payload.id) {
        const { error } = await supabase
          .from('access_control_rules')
          .update({ kind: payload.kind, value: payload.value, mode: payload.mode, severity: payload.severity, expires_at: payload.expires_at, notes: payload.notes || null })
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('access_control_rules').insert({
          kind: payload.kind,
          value: payload.kind === 'country' ? payload.value.toUpperCase() : payload.value,
          mode: payload.mode,
          severity: payload.severity,
          expires_at: payload.expires_at,
          notes: payload.notes || null,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control-rules'] });
      setDialogOpen(false);
      setEditingRule(null);
      setForm(EMPTY_FORM);
      toast({ title: 'Rule saved' });
    },
    onError: (err) => toastError(err, 'Error', 'Failed to save rule.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('access_control_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-control-rules'] });
      setDeleteTarget(null);
      toast({ title: 'Rule deleted' });
    },
    onError: (err) => toastError(err, 'Error', 'Failed to delete rule.'),
  });

  const activeToggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('access_control_rules').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-control-rules'] }),
    onError: (err) => toastError(err, 'Error', 'Failed to update rule.'),
  });

  function openAdd() {
    setEditingRule(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(rule: AccessRule) {
    setEditingRule(rule);
    setForm({
      kind: rule.kind,
      value: rule.value,
      mode: rule.mode,
      severity: rule.severity,
      expires_at: rule.expires_at ? rule.expires_at.slice(0, 10) : '',
      notes: rule.notes ?? '',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSave() {
    const err = validateRuleValue(form.kind, form.value);
    if (err) { setFormError(err); return; }
    setFormError(null);
    saveMutation.mutate({
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      id: editingRule?.id,
    });
  }

  return (
    <>
      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/40 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-lg">IP & Country Access Controls</CardTitle>
              <CardDescription>Restrict platform access by IP address (CIDR) or country</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="access-controls-toggle" className="text-base font-medium">
                Enable access controls
              </Label>
              <p className="text-sm text-muted-foreground">
                Master switch — disable to bypass all rules instantly without deleting them
              </p>
            </div>
            {toggleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="access-controls-toggle"
                checked={isEnabled}
                onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                disabled={toggleMutation.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Access Rules</CardTitle>
              <CardDescription>Deny-list wins. Allow-list applies when any allow rule exists for that dimension.</CardDescription>
            </div>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading rules...
            </div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules configured. Add one to start enforcing access controls.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(active) => activeToggleMutation.mutate({ id: rule.id, active })}
                    disabled={activeToggleMutation.isPending}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-medium truncate">
                        {rule.kind === 'country' ? `${rule.value} — ${countryName(rule.value)}` : rule.value}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {rule.kind === 'ip_cidr' ? 'IP/CIDR' : 'Country'}
                      </Badge>
                      <Badge className={`text-xs shrink-0 ${rule.mode === 'deny' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'} border-0`}>
                        {rule.mode}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[rule.severity]}`}>
                        {rule.severity}
                      </span>
                      {!rule.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                      {rule.expires_at && new Date(rule.expires_at) < new Date() && (
                        <span className="text-xs text-muted-foreground">(expired)</span>
                      )}
                    </div>
                    {rule.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{rule.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(rule.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Blocks</CardTitle>
          <CardDescription>Last 50 blocked requests — refreshes every 30 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          {blocksLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocks recorded yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground shrink-0 w-28">
                    {format(new Date(b.blocked_at), 'MM/dd HH:mm:ss')}
                  </span>
                  <span className="font-mono text-xs truncate flex-1">{b.ip ?? '—'}</span>
                  <span className="text-xs shrink-0 w-8">{b.country ?? '—'}</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">{b.endpoint}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingRule(null); setForm(EMPTY_FORM); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Access Rule'}</DialogTitle>
            <DialogDescription>
              Deny rules block matching requests. Allow rules require the request to match when any allow rule exists for that dimension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={(v) => setForm(f => ({ ...f, kind: v as RuleForm['kind'], value: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip_cidr">IP / CIDR</SelectItem>
                    <SelectItem value="country">Country (ISO-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm(f => ({ ...f, mode: v as RuleForm['mode'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deny">Deny</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{form.kind === 'ip_cidr' ? 'IP / CIDR (e.g. 192.168.1.0/24)' : 'Country'}</Label>
              {form.kind === 'country' ? (
                <CountryCombobox
                  value={form.value}
                  onChange={(code) => { setForm(f => ({ ...f, value: code })); setFormError(null); }}
                  invalid={!!formError}
                />
              ) : (
                <Input
                  value={form.value}
                  onChange={(e) => { setForm(f => ({ ...f, value: e.target.value })); setFormError(null); }}
                  placeholder="192.168.1.0/24"
                  className={formError ? 'border-destructive' : ''}
                />
              )}
              {formError && <p className="text-xs text-destructive">{formError}</p>}
              {form.kind === 'country' && form.mode === 'allow' && (
                <div className="flex gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 rounded-md p-2 mt-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Adding an allow rule for a country means <strong>only allowed countries</strong> can access the platform. All other countries will be blocked.</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm(f => ({ ...f, severity: v as RuleForm['severity'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expires (optional)</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Block Russia per security policy" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingRule ? 'Save Changes' : 'Add Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rule?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. The rule will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccessControlsCard;

function CountryCombobox({ value, onChange, invalid }: { value: string; onChange: (code: string) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = value ? COUNTRIES.find(c => c.code === value.toUpperCase()) : null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', invalid && 'border-destructive', !selected && 'text-muted-foreground')}
        >
          {selected ? `${selected.name} (${selected.code})` : 'Select a country...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country or code..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => { onChange(c.code); setOpen(false); }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selected?.code === c.code ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
