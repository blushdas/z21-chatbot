import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { DEFAULT_CHAT_CATEGORIES } from '@/lib/chatCategories';

export interface ChatCategory {
  id?: string;
  value: string;
  label: string;
  sort_order?: number;
  is_archived?: boolean;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'category';

/**
 * Per-user chat categories. Falls back to DEFAULT_CHAT_CATEGORIES when the
 * user has no rows. As soon as the user creates/edits, only their rows are used.
 */
export function useUserChatCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ChatCategory[]>(DEFAULT_CHAT_CATEGORIES);
  const [hasCustom, setHasCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCategories(DEFAULT_CHAT_CATEGORIES);
      setHasCustom(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_chat_categories')
      .select('id,value,label,sort_order,is_archived')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });
    setLoading(false);
    if (error) return;
    if (!data || data.length === 0) {
      setCategories(DEFAULT_CHAT_CATEGORIES);
      setHasCustom(false);
    } else {
      setCategories(data.filter((c) => !c.is_archived).map((c) => ({ ...c })));
      setHasCustom(true);
    }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const seedFromDefaults = useCallback(async () => {
    if (!user?.id) return;
    const rows = DEFAULT_CHAT_CATEGORIES.map((c, i) => ({
      user_id: user.id,
      value: c.value,
      label: c.label,
      sort_order: i,
    }));
    await supabase.from('user_chat_categories').upsert(rows, { onConflict: 'user_id,value' });
    await refresh();
  }, [user?.id, refresh]);

  const addCategory = useCallback(async (label: string) => {
    if (!user?.id) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    // If no custom rows yet, seed defaults first so the user keeps them alongside the new one.
    if (!hasCustom) await seedFromDefaults();
    const base = slugify(trimmed);
    let value = base;
    let suffix = 2;
    // unique-ify locally; DB unique constraint will also enforce
    while (categories.some((c) => c.value === value)) {
      value = `${base}_${suffix++}`;
    }
    const nextOrder = (categories[categories.length - 1]?.sort_order ?? categories.length) + 1;
    const { error } = await supabase.from('user_chat_categories').insert({
      user_id: user.id, value, label: trimmed, sort_order: nextOrder,
    });
    if (!error) await refresh();
  }, [user?.id, hasCustom, categories, seedFromDefaults, refresh]);

  const renameCategory = useCallback(async (cat: ChatCategory, newLabel: string) => {
    if (!user?.id) return;
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (!hasCustom) {
      await seedFromDefaults();
    }
    await supabase
      .from('user_chat_categories')
      .update({ label: trimmed })
      .eq('user_id', user.id)
      .eq('value', cat.value);
    await refresh();
  }, [user?.id, hasCustom, seedFromDefaults, refresh]);

  const deleteCategory = useCallback(async (cat: ChatCategory) => {
    if (!user?.id) return;
    if (!hasCustom) await seedFromDefaults();
    await supabase
      .from('user_chat_categories')
      .delete()
      .eq('user_id', user.id)
      .eq('value', cat.value);
    await refresh();
  }, [user?.id, hasCustom, seedFromDefaults, refresh]);

  const reorderCategories = useCallback(async (ordered: ChatCategory[]) => {
    if (!user?.id) return;
    if (!hasCustom) await seedFromDefaults();
    const updates = ordered.map((c, i) =>
      supabase
        .from('user_chat_categories')
        .update({ sort_order: i })
        .eq('user_id', user.id)
        .eq('value', c.value)
    );
    await Promise.all(updates);
    await refresh();
  }, [user?.id, hasCustom, seedFromDefaults, refresh]);

  const resetToDefaults = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from('user_chat_categories').delete().eq('user_id', user.id);
    await refresh();
  }, [user?.id, refresh]);

  return {
    categories,
    loading,
    hasCustom,
    refresh,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    resetToDefaults,
  };
}
