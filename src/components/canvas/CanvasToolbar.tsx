import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Link2, Undo2, Redo2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
  editor: Editor | null;
}

const TBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    title={title}
    className={`h-8 w-8 p-0 ${active ? 'bg-accent text-accent-foreground' : ''}`}
  >
    {children}
  </Button>
);

const CanvasToolbar: React.FC<Props> = ({ editor }) => {
  if (!editor) return null;
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const openLinkDialog = () => {
    const existing = (editor.getAttributes('link')?.href as string | undefined) || '';
    setLinkUrl(existing);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const normalized = /^https?:\/\//i.test(url) || url.startsWith('mailto:') || url.startsWith('/')
        ? url
        : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
    }
    setLinkOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkOpen(false);
  };

  return (
    <>
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background/80 px-2 py-1 backdrop-blur">
      <TBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </TBtn>
      <TBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </TBtn>
      <div className="mx-1 h-5 w-px bg-border" />
      <TBtn title="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-4 w-4" />
      </TBtn>
      <TBtn title="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </TBtn>
      <div className="mx-1 h-5 w-px bg-border" />
      <TBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </TBtn>
      <TBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </TBtn>
      <TBtn title="Link" active={editor.isActive('link')} onClick={openLinkDialog}>
        <Link2 className="h-4 w-4" />
      </TBtn>
      <div className="mx-1 h-5 w-px bg-border" />
      <TBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </TBtn>
      <TBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </TBtn>
    </div>

    <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert link</DialogTitle>
          <DialogDescription>Paste or type a URL. Leave empty to remove the link.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
          }}
          placeholder="https://example.com"
        />
        <DialogFooter className="gap-2 sm:gap-2">
          {editor.isActive('link') && (
            <Button variant="ghost" onClick={removeLink} className="text-destructive hover:text-destructive">
              Remove
            </Button>
          )}
          <Button variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
          <Button onClick={applyLink}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CanvasToolbar;