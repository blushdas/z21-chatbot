import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Code, Quote, Underline as UnderlineIcon } from 'lucide-react';
import { canvasExtensions } from '@/lib/canvas/extensions';
import { markdownToTiptap } from '@/lib/canvas/markdownToTiptap';
import { Button } from '@/components/ui/button';

interface Props {
  value: string;
  onChange: (markdown: string, html: string) => void;
}

const ToolbarBtn: React.FC<{ active?: boolean; onClick: () => void; children: React.ReactNode; title: string }> = ({ active, onClick, children, title }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    title={title}
    onClick={onClick}
    className={`h-7 w-7 p-0 ${active ? 'bg-[var(--chat-card)] text-[var(--chat-text)]' : 'text-[var(--chat-muted)]'}`}
  >
    {children}
  </Button>
);

const KnowledgeRichEditor: React.FC<Props> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: canvasExtensions,
    content: markdownToTiptap(value || '') as never,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[160px] px-3 py-2 text-[var(--chat-text)] [&_*]:text-[var(--chat-text)]',
      },
    },
    onUpdate: async ({ editor }) => {
      const html = editor.getHTML();
      const { default: TurndownService } = await import('turndown');
      const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
      onChange(td.turndown(html), html);
    },
  });

  useEffect(() => {
    return () => { editor?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-[var(--chat-border)] bg-[var(--chat-bg)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--chat-border)] px-1 py-1">
        <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-3.5 w-3.5" /></ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-[var(--chat-border)]" />
        <ToolbarBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-[var(--chat-border)]" />
        <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
        <ToolbarBtn title="Code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-3.5 w-3.5" /></ToolbarBtn>
      </div>
      <EditorContent editor={editor} className="max-h-[280px] overflow-y-auto" />
    </div>
  );
};

export default KnowledgeRichEditor;