import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

interface Construct {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  state: string;
  created_at: string;
  updated_at: string;
}

interface MobileConstructsCarouselProps {
  constructs: Construct[];
  getConstructImage: (slug: string) => string;
}

const MobileConstructsCarousel: React.FC<MobileConstructsCarouselProps> = ({
  constructs,
  getConstructImage,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragState, setDragState] = useState({ isDragging: false, dragX: 0, dragY: 0, startX: 0, startY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const currentConstruct = constructs[currentIndex];
  const nextConstruct = constructs[currentIndex + 1];
  const previousConstruct = constructs[currentIndex - 1];

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      dragX: 0,
      dragY: 0,
      startX: touch.clientX,
      startY: touch.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    const deltaY = touch.clientY - dragState.startY;
    
    setDragState(prev => ({
      ...prev,
      dragX: deltaX,
      dragY: deltaY,
    }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging) return;

    const threshold = 100;
    const { dragX, dragY } = dragState;

    if (Math.abs(dragX) > threshold) {
      if (dragX > 0) {
        // Swiped right - go to construct
        navigate(`/constructs/${currentConstruct.slug}`);
      } else {
        // Swiped left - next construct
        handleNext();
      }
    } else if (dragY < -threshold) {
      // Swiped up - could be favorite action or quick preview
      navigate(`/constructs/${currentConstruct.slug}`);
    } else {
      // Reset position
      setDragState({ isDragging: false, dragX: 0, dragY: 0, startX: 0, startY: 0 });
    }
  };

  const handleNext = () => {
    if (currentIndex < constructs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back to beginning
    }
    setDragState({ isDragging: false, dragX: 0, dragY: 0, startX: 0, startY: 0 });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(constructs.length - 1); // Loop to end
    }
    setDragState({ isDragging: false, dragX: 0, dragY: 0, startX: 0, startY: 0 });
  };

  const getCardTransform = (offset: number = 0) => {
    if (!dragState.isDragging && offset === 0) {
      return 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
    }
    
    if (dragState.isDragging && offset === 0) {
      const rotation = dragState.dragX * 0.1; // Subtle rotation
      const scale = 1 - Math.abs(dragState.dragX) * 0.0005;
      return `translate3d(${dragState.dragX}px, ${dragState.dragY}px, 0) rotate(${rotation}deg) scale(${Math.max(0.8, scale)})`;
    }

    // Background cards
    const scale = 0.95 - (offset * 0.05);
    const yOffset = offset * 8;
    return `translate3d(0, ${yOffset}px, 0) scale(${scale})`;
  };

  const getSwipeIndicator = () => {
    if (!dragState.isDragging) return null;
    
    const { dragX } = dragState;
    const threshold = 50;
    
    if (dragX > threshold) {
      return (
        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center rounded-lg">
          <div className="bg-blue-500 rounded-full p-3">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      );
    } else if (dragX < -threshold) {
      return (
        <div className="absolute inset-0 bg-gray-500/20 flex items-center justify-center rounded-lg">
          <div className="bg-gray-500 rounded-full p-3">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (constructs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-semibold text-[var(--chat-text)] mb-2">No constructs to explore</h3>
          <p className="text-[var(--chat-muted)]">Check back later for new constructs!</p>
        </div>
      </div>
    );
  }

  if (!currentConstruct) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Progress indicator */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-1">
          {constructs.slice(0, Math.min(5, constructs.length)).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-8 rounded-full transition-all duration-300 ${
                index === currentIndex % 5 ? 'bg-brand-blue' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main card */}
      <Card 
        ref={cardRef}
        className="border-0 shadow-lg cursor-pointer transition-transform duration-300 ease-out"
        style={{ 
          transform: getCardTransform(),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => !dragState.isDragging && navigate(`/constructs/${currentConstruct.slug}`)}
      >
        <CardContent className="p-0">
          {/* Image with proper aspect ratio */}
          <AspectRatio ratio={16 / 10}>
            <img
              src={getConstructImage(currentConstruct.slug)}
              alt={currentConstruct.title}
              className="w-full h-full object-contain rounded-t-lg bg-[var(--ui-bg-hover)]"
            />
          </AspectRatio>
          
          {/* Content below image */}
          <div className="p-4">
            <h3 className="text-xl font-semibold text-brand-blue mb-2 line-clamp-2">
              {currentConstruct.title}
            </h3>
            {currentConstruct.description && (
              <p className="text-[var(--chat-text-secondary)] mb-3 text-sm line-clamp-3">
                {currentConstruct.description}
              </p>
            )}
            {currentConstruct.tags && currentConstruct.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentConstruct.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-[var(--ui-bg-hover)] text-[var(--chat-text)] rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {currentConstruct.tags.length > 3 && (
                  <span className="px-2 py-1 bg-[var(--ui-bg-hover)] text-[var(--chat-text)] rounded-full text-xs font-medium">
                    +{currentConstruct.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Swipe indicator */}
          {getSwipeIndicator()}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <button
          onClick={handlePrevious}
          className="w-12 h-12 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow active:scale-95"
          aria-label="Previous construct"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--chat-text-secondary)]" />
        </button>
        
        <button
          onClick={() => navigate(`/constructs/${currentConstruct.slug}`)}
          className="px-6 py-3 bg-brand-blue text-white rounded-full flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow active:scale-95"
          aria-label="View construct details"
        >
          <Eye className="w-5 h-5" />
          <span className="text-sm font-medium">View Details</span>
        </button>
        
        <button
          onClick={handleNext}
          className="w-12 h-12 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow active:scale-95"
          aria-label="Next construct"
        >
          <ArrowRight className="w-5 h-5 text-[var(--chat-text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

export default MobileConstructsCarousel;