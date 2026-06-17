import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from './SectionWrapper';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const BetaSignup: React.FC = () => {
  const navigate = useNavigate();

  const benefits = [
    'Early access to all features',
    'Direct influence on product development',
    'Priority support from our team',
    'Exclusive beta user benefits',
    'Help preserve Daryle\'s legacy'
  ];

  return (
    <SectionWrapper id="beta" background="blue-gradient">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-white/10 text-white rounded-full t-label-sm mb-4">
            Request Access to Beta
          </div>
          <h2 className="t-h1 mb-6">
            Help Shape the Future of Daryle AI.
          </h2>
          <p className="t-body-lg text-white/80 max-w-2xl mx-auto">
            Get early access right now for a limited time. 
            This is your opportunity to experience Daryle AI, provide feedback, and directly influence its development.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl p-8 md:p-12 shadow-2xl hover:border-white/40 transition-colors"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Benefits List */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-6">What You'll Get:</h3>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center md:text-left">
              <div className="bg-white/5 border border-white/20 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium mb-3">
                    Early Access Available Now
                  </div>
                  <p className="text-white/90 text-lg font-semibold mb-2">
                    Join the Beta Today
                  </p>
                  <p className="text-white/70 text-sm">
                    Get exclusive early access and help shape the future of Daryle AI
                  </p>
                </div>
              </div>
              
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="w-full text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-primary group"
              >
                Request Access
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <p className="text-white/60 text-sm mt-4">
                Submit your request and our team will review it promptly
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default BetaSignup;
