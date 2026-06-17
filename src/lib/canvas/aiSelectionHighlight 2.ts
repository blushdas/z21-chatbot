import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const aiSelectionHighlightKey = new PluginKey<{ from: number; to: number } | null>(
  'aiSelectionHighlight',
);

export function aiSelectionHighlightPlugin() {
  return new Plugin<{ from: number; to: number } | null>({
    key: aiSelectionHighlightKey,
    state: {
      init: () => null,
      apply(tr, value) {
        const meta = tr.getMeta(aiSelectionHighlightKey);
        if (meta === null) return null;
        if (meta) return meta as { from: number; to: number };
        if (value) {
          return {
            from: tr.mapping.map(value.from),
            to: tr.mapping.map(value.to),
          };
        }
        return value;
      },
    },
    props: {
      decorations(state) {
        const range = aiSelectionHighlightKey.getState(state);
        if (!range || range.from === range.to) return null;
        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, { class: 'ai-selection-highlight' }),
        ]);
      },
    },
  });
}
