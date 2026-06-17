import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  csvType: string;
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ open, onOpenChange, onImportComplete }) => {
  const [csvContent, setCsvContent] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error('Please provide CSV content');
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `https://rptccafbujxprahkstmp.supabase.co/functions/v1/import-knowledge-csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvContent }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Import failed');
        setResult({ 
          success: false, 
          csvType: 'unknown',
          totalRows: 0,
          inserted: 0, 
          updated: 0, 
          skipped: 0, 
          errors: [data.error || 'Unknown error'] 
        });
        return;
      }

      setResult({ success: true, ...data });
      toast.success(`${data.csvType} Import Complete`, {
        description: `${data.inserted} new records, ${data.updated} updated`
      });
      
      // Clear form for next import (R2, R3)
      setCsvContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onImportComplete();

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const resetModal = () => {
    setCsvContent('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetModal(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Knowledge CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste content directly. Supports Learning Time transcripts, Project SMART categories, and Daryle's Archives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose CSV File
            </Button>
            {csvContent && (
              <span className="text-sm text-muted-foreground">
                {csvContent.split('\n').length - 1} rows loaded
              </span>
            )}
          </div>

          {/* CSV Content Textarea */}
          <Textarea
            placeholder="Or paste CSV content here..."
            value={csvContent}
            onChange={(e) => { setCsvContent(e.target.value); setResult(null); }}
            rows={10}
            className="font-mono text-xs"
            disabled={isImporting}
          />

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-lg border ${result.success ? 'bg-accent/10 border-accent/30' : 'bg-destructive/10 border-destructive/30'}`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {result.success ? 'Import Successful' : 'Import Failed'}
                  </p>
                  {result.success && (
                    <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      <li>CSV Type: <strong>{result.csvType}</strong></li>
                      <li>Total Rows: {result.totalRows}</li>
                      <li>Inserted: <span className="text-accent font-medium">{result.inserted}</span></li>
                      <li>Updated: <span className="text-primary font-medium">{result.updated}</span></li>
                      <li>Skipped: {result.skipped}</li>
                    </ul>
                  )}
                  {result.errors.length > 0 && (
                    <ul className="text-sm text-destructive mt-2 space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !csvContent.trim()}>
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVModal;
