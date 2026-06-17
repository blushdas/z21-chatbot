import React, { useState, useEffect } from 'react';
import SectionWrapper from './SectionWrapper';
import FeatureCard from './FeatureCard';
import { Brain, History, Shuffle, Tag, Lock, Pin, Star, Save, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const InsideTheExperience: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { src: '/features/feature-1.jpg', alt: 'Conversational Intelligence - Ask questions and get grounded, story-rich responses' },
    { src: '/features/feature-2.jpg', alt: 'Context-Aware Insights - Daryle AI remembers context, helping you go deeper' },
    { src: '/features/feature-3.jpg', alt: 'Mode Switching - Shift between Wisdom, Standard, and Direct Quotes modes' },
    { src: '/features/feature-4.jpg', alt: 'Tag-Based Learning - Responses connect to Project SMART and key principles' },
    { src: '/features/feature-5.jpg', alt: 'Private & Secure - Your conversations are confidential' },
    { src: '/features/feature-6.jpg', alt: 'Search Your Conversations - Find any question or insight instantly' },
    { src: '/features/feature-7.jpg', alt: 'Favorite Key Messages and Pin Important Chats' },
    { src: '/features/feature-8.jpg', alt: 'Organize with Folders and Auto-Save Everything' },
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const features = [
    {
      icon: Brain,
      title: 'Conversational Intelligence',
      description: 'Ask questions and get grounded, story-rich responses based on real materials.'
    },
    {
      icon: History,
      title: 'Context-Aware Insights',
      description: 'Daryle AI remembers context, helping you go deeper over time.'
    },
    {
      icon: Shuffle,
      title: 'Mode Switching',
      description: 'Shift between Coaching, Legacy, and Strategic interactions.'
    },
    {
      icon: Tag,
      title: 'Tag-Based Learning',
      description: 'Every response connects to underlying themes—Project SMART, leadership essentials, and key principles.'
    },
    {
      icon: Lock,
      title: 'Private & Secure',
      description: 'Your conversations are confidential and stored within a closed system.'
    },
    {
      icon: Pin,
      title: 'Pin Important Chats',
      description: 'Keep your most valuable conversations at the top for quick access anytime.'
    },
    {
      icon: Star,
      title: 'Favorite Key Messages',
      description: 'Save specific insights and responses to build your personal wisdom library.'
    },
    {
      icon: Save,
      title: 'Auto-Save Everything',
      description: 'Every conversation is automatically saved so you can pick up right where you left off.'
    },
    {
      icon: FolderOpen,
      title: 'Organize with Folders',
      description: 'Create custom folders to organize conversations by project, topic, or theme.'
    }
  ];

  return (
    <SectionWrapper background="grid">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full t-label-sm mb-4">
          Platform Features
        </div>
        <h2 className="t-h1 mb-6">
          A Platform Designed for Discovery.
        </h2>
      </div>

      {/* Platform Screenshot Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-5xl mx-auto"
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
          <div className="aspect-[16/10] relative">
            <img
              src={slides[currentSlide].src}
              alt={slides[currentSlide].alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-primary rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          
          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Decorative frame */}
          <div className="absolute inset-0 border-8 border-white/50 rounded-2xl pointer-events-none"></div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default InsideTheExperience;
