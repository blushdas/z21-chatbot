import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MetricSparkline from './MetricSparkline';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  color?: string;
  count?: number;
  sparklineData?: number[];
  variant?: 'featured' | 'secondary';
  actionLabel?: string;
  isLoading?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  link,
  color = 'text-accent',
  count,
  sparklineData,
  variant = 'featured',
  actionLabel = 'View All',
  isLoading = false,
}) => {
  const isFeatured = variant === 'featured';

  return (
    <Link to={link} className="block group">
      <Card
        className={cn(
          'h-full transition-all duration-200 hover:shadow-lg border-border',
          'hover:border-accent/30 hover:scale-[1.02]',
          isFeatured ? 'p-0' : 'p-0'
        )}
      >
        <CardHeader className={cn('pb-2', isFeatured ? 'pt-5 px-5' : 'pt-4 px-4')}>
          <div className="flex items-start justify-between">
            <div
              className={cn(
                'rounded-lg flex items-center justify-center',
                'bg-accent/10',
                isFeatured ? 'w-12 h-12' : 'w-10 h-10'
              )}
            >
              <Icon className={cn(color, isFeatured ? 'w-6 h-6' : 'w-5 h-5')} />
            </div>
            {count !== undefined && (
              <span
                className={cn(
                  'font-bold text-foreground',
                  isFeatured ? 'text-2xl' : 'text-xl'
                )}
              >
                {isLoading ? '—' : count.toLocaleString()}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn(isFeatured ? 'px-5 pb-5' : 'px-4 pb-4')}>
          <h3
            className={cn(
              'font-heading font-semibold text-foreground',
              isFeatured ? 'text-lg mb-1' : 'text-base mb-0.5'
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-muted-foreground',
              isFeatured ? 'text-sm mb-4' : 'text-xs mb-3'
            )}
          >
            {description}
          </p>

          {/* Sparkline for featured cards */}
          {isFeatured && sparklineData && sparklineData.length > 0 && (
            <div className="mb-4">
              <MetricSparkline data={sparklineData} height={40} />
            </div>
          )}

          {/* Action button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'p-0 h-auto font-medium text-accent hover:text-accent/80 hover:bg-transparent',
              'group-hover:underline',
              isFeatured ? 'text-sm' : 'text-xs'
            )}
          >
            {actionLabel}
            <ArrowRight
              className={cn(
                'ml-1 transition-transform group-hover:translate-x-1',
                isFeatured ? 'h-4 w-4' : 'h-3 w-3'
              )}
            />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FeatureCard;
