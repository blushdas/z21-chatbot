import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description,
  className 
}) => {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:scale-105 hover:shadow-xl border-primary/20 hover:border-primary/40 group bg-card/50 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col items-start space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="t-h3 group-hover:text-primary transition-colors">{title}</h3>
          <p className="t-body text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
