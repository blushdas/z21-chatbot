import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from './SectionWrapper';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const WhyItMatters: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <SectionWrapper background="gold">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-block px-4 py-2 bg-white/90 text-primary rounded-full t-label-sm mb-4 shadow-sm">
            The Legacy
          </div>
          <h2 className="t-h1 mb-6 text-white">
            Wisdom Made Accessible.
          </h2>
          <p className="t-body-lg text-white/90 mb-12">
            Leaders often fade, but wisdom can live on. Daryle AI exists to extend Daryle's lifelong 
            pursuit of the Better Way—helping others grow in character, chemistry, and competency.
          </p>

          {/* Launch Video */}
          <div id="launch-video" className="relative rounded-2xl overflow-hidden shadow-xl">
            <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
              <iframe
                src="https://player.vimeo.com/video/1143706669?h=1be0a2b134&badge=0&autopause=0&player_id=0&app_id=58479"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                title="Daryle AI - Beta Teaser"
              />
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => navigate('/signup')}
            className="mt-10 bg-primary hover:bg-primary/90 text-white"
          >
            Sign Up for Beta Access
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default WhyItMatters;
