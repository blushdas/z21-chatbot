import React, { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { canvasExtensions } from '@/lib/canvas/extensions';
import CanvasToolbar from './CanvasToolbar';

interface Props {
  initialContent: unknown;
  onChange: (doc: unknown) => void;
  onEditorReady?: (editor: Editor) => void;
  rightToolbarSlot?: React.ReactNode;
  children?: React.ReactNode;
}

const CanvasEditor: React.FC<Props> = ({ initialContent, onChange, onEditorReady, rightToolbarSlot, children }) => {
  const editor = useEditor({
    extensions: canvasExtensions,
    content: (initialContent as object) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-8 pt-6 pb-48 min-h-[60vh] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_ul_ul]:list-[circle] [&_ul_ul_ul]:list-[square]',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur">
        <CanvasToolbar editor={editor} />
        {rightToolbarSlot}
      </div>
      <div className="relative flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
        {children}
      </div>
    </div>
  );
};

export default CanvasEditor;