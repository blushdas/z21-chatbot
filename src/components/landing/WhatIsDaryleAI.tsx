import React from 'react';
import { Button } from '@/components/ui/button';
import SectionWrapper from './SectionWrapper';
import { motion } from 'framer-motion';
import chatInterfacePreview from '@/assets/chat-interface-preview.jpg';

const WhatIsDaryleAI: React.FC = () => {
  const scrollToBeta = () => {
    const element = document.getElementById('beta');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <SectionWrapper id="about" background="gradient">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="t-h1 mb-6">
            A Living Legacy of Leadership
          </h2>
          <p className="t-body-lg text-muted-foreground mb-6">
            Daryle AI is an interactive learning and coaching companion, trained on the writings, 
            conversations, and principles of Daryle Doden. It's not just an app—it's a way to 
            explore leadership, purpose, and wisdom through the voice of someone who lived it.
          </p>
          <Button size="lg" onClick={scrollToBeta}>
            Get Early Access
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Chat Interface Preview */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-4 shadow-2xl">
            <img 
              src={chatInterfacePreview} 
              alt="Daryle AI chat interface showing leadership coaching conversation" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          
          {/* Decorative element */}
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full filter blur-3xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full filter blur-3xl" />
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default WhatIsDaryleAI;
