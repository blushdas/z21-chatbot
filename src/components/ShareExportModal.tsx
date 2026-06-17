import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FileText, Mail, AlignLeft, Check, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ShareExportModalProps {
  open: boolean;
  onClose: () => void;
  chatTitle?: string;
}

type Format = 'pdf' | 'email' | 'transcript';
type Layout = 'standard' | 'compact';

const ShareExportModal: React.FC<ShareExportModalProps> = ({ open, onClose, chatTitle }) => {
  const [format, setFormat] = useState<Format>('pdf');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [includeCitations, setIncludeCitations] = useState(false);
  const [layout, setLayout] = useState<Layout>('standard');

  const FORMAT_OPTIONS = [
    { id: 'pdf' as Format, label: 'PDF Document', desc: 'Professional layout, ideal for printing and formal', icon: FileText },
    { id: 'email' as Format, label: 'Direct Email', desc: 'Send a formatted HTML summary directly to...', icon: Mail },
    { id: 'transcript' as Format, label: 'Raw Transcript', desc: 'Plain text format, best for copying into other tools.', icon: AlignLeft },
  ];

  const handleConfirm = () => {
    toast('Export coming soon', {
      description: 'This feature will be available shortly.',
      duration: 3000,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--chat-card)] border border-white/[0.10] text-brand-offwhite max-w-lg p-0 gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Share & Export</DialogTitle>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} className="text-brand-yellow" />
            <span className="font-semibold text-base">Share & Export</span>
          </div>
          <p className="text-sm text-brand-offwhite/50">Export this conversation for your team or personal records.</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Step 1: Format */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-offwhite/40 font-medium mb-3">1. Choose Format</p>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFormat(id)}
                  className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    format === id
                      ? 'border-brand-yellow/60 bg-brand-yellow/10'
                      : 'border-white/[0.08] bg-[var(--chat-card)]/[0.03] hover:border-white/20'
                  }`}
                >
                  {format === id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-yellow flex items-center justify-center">
                      <Check size={10} className="text-brand-blue" />
                    </div>
                  )}
                  <Icon size={18} className={format === id ? 'text-brand-yellow mb-2' : 'text-brand-offwhite/50 mb-2'} />
                  <span className="text-xs font-semibold text-brand-offwhite leading-tight">{label}</span>
                  <span className="text-[10px] text-brand-offwhite/40 mt-1 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Content options */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-offwhite/40 font-medium mb-3">2. Content Options</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--chat-card)]/[0.03] border border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-offwhite">Include Timestamps</p>
                  <p className="text-[11px] text-brand-offwhite/40 mt-0.5">Show exactly when messages were sent.</p>
                </div>
                <button
                  onClick={() => setIncludeTimestamps(!includeTimestamps)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${includeTimestamps ? 'bg-brand-yellow' : 'bg-[var(--chat-card)]/20'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--chat-card)] transition-all ${includeTimestamps ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--chat-card)]/[0.03] border border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand-offwhite">Include Citations</p>
                  <p className="text-[11px] text-brand-offwhite/40 mt-0.5">Append source links for leadership principles.</p>
                </div>
                <button
                  onClick={() => setIncludeCitations(!includeCitations)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${includeCitations ? 'bg-brand-yellow' : 'bg-[var(--chat-card)]/20'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--chat-card)] transition-all ${includeCitations ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Layout */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-offwhite/40 font-medium mb-3">3. Layout Style</p>
            <div className="grid grid-cols-2 gap-2">
              {(['standard', 'compact'] as Layout[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    layout === l
                      ? 'bg-brand-yellow/20 border-brand-yellow/50 text-brand-yellow'
                      : 'border-white/[0.08] text-brand-offwhite/60 hover:text-brand-offwhite hover:border-white/20'
                  }`}
                >
                  {l === 'standard' ? 'Standard flow' : 'Compact grid'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-brand-offwhite/40">Estimated size: ~2.4 MB</span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm text-brand-offwhite/60 hover:text-brand-offwhite transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue text-sm font-semibold transition-colors"
            >
              Confirm Export
              <Download size={14} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareExportModal;
