import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Filters {
  namespace: string;
  domain: string;
}

interface KnowledgeFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  namespaceLabels: string[];
  domains: string[];
}

const KnowledgeFilters: React.FC<KnowledgeFiltersProps> = ({
  filters,
  onFiltersChange,
  namespaceLabels,
  domains,
}) => {
  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? '' : value
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={filters.namespace || 'all'}
        onValueChange={(value) => updateFilter('namespace', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Source Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Source Types</SelectItem>
          {namespaceLabels.map((label) => (
            <SelectItem key={label} value={label}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.domain || 'all'}
        onValueChange={(value) => updateFilter('domain', value)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Domain" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Domains</SelectItem>
          {domains.map((domain) => (
            <SelectItem key={domain} value={domain}>
              {domain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default KnowledgeFilters;
