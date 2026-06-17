import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paintbrush, Plus, Power, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBrand, type DemoBrand } from '@/context/BrandContext';
import BrandFormDialog from '@/components/admin/BrandFormDialog';
import { toast } from 'sonner';

const AdminWhiteLabelPage: React.FC = () => {
  const { activeBrand, activate, deactivate } = useBrand();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DemoBrand | null>(null);

  const { data: brands = [], refetch, isLoading } = useQuery({
    queryKey: ['demo-brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('demo_brands').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DemoBrand[];
    },
  });

  const handleDelete = async (b: DemoBrand) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    const { error } = await supabase.from('demo_brands').delete().eq('id', b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (activeBrand?.id === b.id) deactivate();
    toast.success('Brand deleted');
    refetch();
  };

  return (
    <AdminLayout>
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Paintbrush className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">White-Label Demo</h1>
              <p className="text-sm text-muted-foreground">
                Activate a client brand for your current session only. No other users are affected.
              </p>
            </div>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New brand
          </Button>
        </header>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading brands…</p>
        ) : brands.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4">No brands yet. Create your first demo brand.</p>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> New brand
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {brands.map((b) => {
              const isActive = activeBrand?.id === b.id;
              return (
                <div
                  key={b.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:border-accent/40 transition-colors"
                >
                  <div className="flex gap-1">
                    <div className="h-10 w-10 rounded-md border border-border" style={{ background: `hsl(${b.primary_hsl})` }} />
                    <div className="h-10 w-10 rounded-md border border-border" style={{ background: `hsl(${b.accent_hsl})` }} />
                  </div>
                  {b.logo_url ? (
                    <img src={b.logo_url} alt="" className="h-10 w-auto max-w-[120px] object-contain" />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{b.name}</h3>
                      {isActive && <Badge className="bg-accent text-accent-foreground">Active in this session</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {b.product_name} · {b.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <Button variant="outline" size="sm" onClick={deactivate}>
                        <Power className="h-4 w-4 mr-1" /> Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => activate(b)}>
                        <Power className="h-4 w-4 mr-1" /> Activate
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(b); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-4">
          Brand activation is stored in this browser tab only and clears on sign-out. End users never see the rebrand.
        </p>
      </div>

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={refetch}
      />
    </AdminLayout>
  );
};

export default AdminWhiteLabelPage;