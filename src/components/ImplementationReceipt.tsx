import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BUILD_BRANCH, BUILD_STATUS } from '@/lib/build-info';

const branch = BUILD_BRANCH || 'unknown';
const status = BUILD_STATUS || 'unavailable';
const receiptText = `Branch: ${branch}\nStatus: ${status}`;

const ImplementationReceipt = () => {
  const [copyMessage, setCopyMessage] = React.useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopyMessage('Copied!');
      window.setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage('Copy unavailable');
      window.setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  return (
    <Card className="border-brand-blue/20 bg-white/95">
      <CardHeader>
        <CardTitle className="text-xl text-brand-blue">Implementation Receipt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-medium text-muted-foreground">Branch</dt>
            <dd className="break-all font-mono text-foreground">{branch}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <dt className="font-medium text-muted-foreground">Status</dt>
            <dd className="text-foreground">{status}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Copy receipt to clipboard"
            onClick={handleCopy}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            Copy receipt
          </button>
          {copyMessage && (
            <span className="text-sm font-medium text-muted-foreground" role="status">
              {copyMessage}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImplementationReceipt;
