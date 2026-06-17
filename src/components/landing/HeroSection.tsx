import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-[5.5rem] md:-mt-28"
      style={{ backgroundImage: 'url(/images/hero-fallback.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-fallback.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>

      {/* Blue Transparent Overlay */}
      <div className="absolute inset-0 bg-brand-blue/85" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 max-w-5xl text-center pt-32 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-6 py-3 bg-accent/90 text-primary rounded-full font-semibold mb-6 shadow-lg">
            🚀 Request Access to Beta
          </div>
          <p className="text-xl md:text-2xl text-white/90 mb-2">Daryle AI:</p>
          <h1 className="text-6xl md:text-8xl font-extrabold mb-6 text-white tracking-tight">
            Pursuing the<br />Better Way.
          </h1>
          
          <p className="t-body-lg text-white/90 mb-12 max-w-3xl mx-auto">
            Experience the wisdom, leadership, and legacy of Daryle Doden—now made interactive with an <strong>AI Chatbot</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-primary"
            >
              Get Beta Access
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('launch-video')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch the Launch Video
            </Button>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default HeroSection;
