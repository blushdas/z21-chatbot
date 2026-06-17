import React from 'react';
import SectionWrapper from './SectionWrapper';
import FeatureCard from './FeatureCard';
import { MessageCircle, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const ModesOfInteraction: React.FC = () => {
  const modes = [
    {
      icon: MessageCircle,
      title: 'Wisdom Mode',
      description: 'Engage in guided reflection and leadership development conversations.'
    },
    {
      icon: TrendingUp,
      title: 'Investor Mode (coming soon)',
      description: 'Explore business philosophy, stewardship, and decision-making frameworks.'
    },
    {
      icon: Users,
      title: 'Ambassador Mode (coming soon)',
      description: 'Understand community impact and purpose-driven collaboration.'
    }
  ];

  return (
    <SectionWrapper id="features" background="gradient">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full t-label-sm mb-4">
          Multiple Modes
        </div>
        <h2 className="t-h1 mb-6">
          Engage with Daryle in Different Modes.
        </h2>
        <p className="t-body-lg text-muted-foreground max-w-3xl mx-auto">
          Daryle AI adapts to your context and intent—whether you need perspective, mentorship, 
          or strategic insight.
        </p>
      </div>

      {/* Mode Switching Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-12 max-w-4xl mx-auto"
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-2xl">
          <img
            src="/features/modes-screenshot.jpg"
            alt="Mode switching interface showing Wisdom Mode, Standard Mode, and Direct Quotes options"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 border-8 border-white/50 rounded-2xl pointer-events-none"></div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <FeatureCard {...mode} />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => window.location.href = '/roadmap'}
          className="min-w-[200px]"
        >
          View Roadmap
        </Button>
        <Button 
          variant="default" 
          size="lg"
          onClick={() => {
            const betaSection = document.getElementById('beta-signup');
            betaSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="min-w-[200px]"
        >
          Sign up for beta access
        </Button>
      </div>
    </SectionWrapper>
  );
};

export default ModesOfInteraction;
