import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DemoBrand } from '@/context/BrandContext';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: DemoBrand | null;
  onSaved: () => void;
}

const blank = {
  name: '',
  slug: '',
  product_name: '',
  primary_hsl: '220 90% 56%',
  accent_hsl: '45 95% 55%',
  background_hsl: '',
  foreground_hsl: '',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const BrandFormDialog: React.FC<Props> = ({ open, onOpenChange, initial, onSaved }) => {
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        slug: initial.slug,
        product_name: initial.product_name,
        primary_hsl: initial.primary_hsl,
        accent_hsl: initial.accent_hsl,
        background_hsl: initial.background_hsl ?? '',
        foreground_hsl: initial.foreground_hsl ?? '',
        logo_url: initial.logo_url ?? '',
        logo_dark_url: initial.logo_dark_url ?? '',
        favicon_url: initial.favicon_url ?? '',
      });
    } else {
      setForm(blank);
    }
  }, [initial, open]);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === 'name' && !initial ? { slug: slugify(v) } : {}) }));

  const save = async () => {
    if (!form.name || !form.product_name || !form.primary_hsl || !form.accent_hsl) {
      toast.error('Name, product name, primary and accent are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      product_name: form.product_name,
      primary_hsl: form.primary_hsl,
      accent_hsl: form.accent_hsl,
      background_hsl: form.background_hsl || null,
      foreground_hsl: form.foreground_hsl || null,
      logo_url: form.logo_url || null,
      logo_dark_url: form.logo_dark_url || null,
      favicon_url: form.favicon_url || null,
    };
    const { error } = initial
      ? await supabase.from('demo_brands').update(payload).eq('id', initial.id)
      : await supabase.from('demo_brands').insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial ? 'Brand updated' : 'Brand created');
    onSaved();
    onOpenChange(false);
  };

  const swatch = (hsl: string) => (hsl ? `hsl(${hsl})` : 'transparent');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit brand' : 'New client brand'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Client name" value={form.name} onChange={(v) => update('name', v)} placeholder="Acme Corp" />
          <Field label="Slug" value={form.slug} onChange={(v) => update('slug', v)} placeholder="acme-corp" />
          <Field
            label="Product wordmark"
            value={form.product_name}
            onChange={(v) => update('product_name', v)}
            placeholder="AcmeAI"
            className="col-span-2"
          />
          <ColorField label="Primary (HSL)" value={form.primary_hsl} onChange={(v) => update('primary_hsl', v)} swatch={swatch(form.primary_hsl)} />
          <ColorField label="Accent (HSL)" value={form.accent_hsl} onChange={(v) => update('accent_hsl', v)} swatch={swatch(form.accent_hsl)} />
          <ColorField label="Background (optional)" value={form.background_hsl} onChange={(v) => update('background_hsl', v)} swatch={swatch(form.background_hsl)} />
          <ColorField label="Foreground (optional)" value={form.foreground_hsl} onChange={(v) => update('foreground_hsl', v)} swatch={swatch(form.foreground_hsl)} />
          <Field label="Logo URL (light bg)" value={form.logo_url} onChange={(v) => update('logo_url', v)} placeholder="https://..." className="col-span-2" />
          <Field label="Logo URL (dark bg)" value={form.logo_dark_url} onChange={(v) => update('logo_dark_url', v)} placeholder="https://..." className="col-span-2" />
          <Field label="Favicon URL" value={form.favicon_url} onChange={(v) => update('favicon_url', v)} placeholder="https://..." className="col-span-2" />
        </div>
        <p className="text-xs text-muted-foreground">
          HSL format: three space-separated numbers, e.g. <code>220 90% 56%</code>. Matches the design token convention.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save brand'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, className }) => (
  <div className={className}>
    <Label className="text-xs">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatch: string;
}> = ({ label, value, onChange, swatch }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-md border border-border flex-shrink-0" style={{ background: swatch }} />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="220 90% 56%" />
    </div>
  </div>
);

export default BrandFormDialog;