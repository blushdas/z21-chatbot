import React from 'react';
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient' | 'blue' | 'blue-gradient' | 'blue-textured' | 'dots' | 'grid' | 'gold';
  id?: string;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  children, 
  className,
  background = 'white',
  id
}) => {
  const bgClasses = {
    white: 'bg-background',
    gray: 'bg-muted/30',
    gradient: 'bg-gradient-to-b from-background to-muted/30',
    blue: 'bg-[#082646] text-white',
    'blue-gradient': 'bg-gradient-to-br from-[#082646] via-[#0a2f52] to-[#082646] text-white',
    'blue-textured': 'bg-[#082646] text-white relative overflow-hidden',
    dots: 'bg-background relative',
    grid: 'bg-muted/10 relative',
    gold: 'bg-accent text-foreground relative'
  };

  const renderPattern = () => {
    if (background === 'blue-textured') {
      return (
        <>
          {/* Dot pattern overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        </>
      );
    }
    
    if (background === 'dots') {
      return (
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      );
    }

    if (background === 'grid') {
      return (
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      );
    }

    if (background === 'gold') {
      return (
        <>
          {/* More visible dot pattern */}
          <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 2px, transparent 2px)',
              backgroundSize: '30px 30px'
            }}
          />
          {/* Diagonal line pattern for additional texture */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 15px)',
            }}
          />
          {/* Subtle gradient for depth without overwhelming */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-accent/50 to-transparent" />
        </>
      );
    }

    return null;
  };

  return (
    <section 
      id={id}
      className={cn(
        'w-full py-16 md:py-24 relative',
        bgClasses[background],
        className
      )}
    >
      {renderPattern()}
      <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
