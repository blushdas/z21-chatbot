import React from 'react';
import { Link } from 'react-router-dom';
import { Paintbrush, X } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';
import { Button } from '@/components/ui/button';

const DemoBrandBanner: React.FC = () => {
  const { activeBrand, deactivate } = useBrand();
  if (!activeBrand) return null;
  return (
    <div className="sticky top-0 z-40 w-full bg-accent text-accent-foreground border-b border-accent/30">
      <div className="flex items-center justify-between px-4 md:px-6 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Paintbrush className="h-4 w-4" />
          <span>
            Demo brand active: <strong>{activeBrand.name}</strong> ({activeBrand.product_name}) — visible to your session only.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-7 hover:bg-accent-foreground/10">
            <Link to="/admin/white-label">Manage</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={deactivate} className="h-7 hover:bg-accent-foreground/10">
            <X className="h-3.5 w-3.5 mr-1" /> Deactivate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoBrandBanner;