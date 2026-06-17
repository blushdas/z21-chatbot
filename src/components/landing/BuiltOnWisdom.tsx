import React from 'react';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from './SectionWrapper';
import { FileText, BookOpen, GraduationCap, Mail, Shield, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const BuiltOnWisdom: React.FC = () => {
  const navigate = useNavigate();
  
  const sources = [
    { 
      icon: BookOpen, 
      label: 'Project SMART', 
      description: '1,000+ internal articles, frameworks, and reflections documenting the pursuit of the Better Way.' 
    },
    { 
      icon: FileText, 
      label: 'Leadership Notes', 
      description: 'Handwritten insights, letters, and decades of personal guidance on Character, Chemistry, and Competency.' 
    },
    { 
      icon: GraduationCap, 
      label: 'Learning Time Transcripts', 
      description: 'Interactive sessions and reflections from years of teaching and leadership formation within Ambassador Enterprises.' 
    },
    { 
      icon: Mail, 
      label: 'Email Conversations', 
      description: 'Verified correspondence and strategic discussions capturing authentic, real-world leadership decision-making.' 
    },
    { 
      icon: Shield, 
      label: 'Ambassador & Doden Legacy Trust Documents', 
      description: 'Core organizational philosophies, mission statements, and guiding frameworks that define the enterprise approach.' 
    },
    { 
      icon: Megaphone, 
      label: 'Speaking Notes, Presentations & Newsletters', 
      description: 'Messages, talks, and internal newsletters that embody Daryle\'s voice and legacy—shared across generations of leaders.' 
    }
  ];

  return (
    <SectionWrapper background="blue-textured">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-block px-4 py-2 bg-white/10 text-white rounded-full t-label-sm mb-4">
            Real Wisdom
          </div>
          <h2 className="t-h1 mb-6">
            Trained on the Source.
          </h2>
          <p className="t-body-lg text-white/80 mb-12">
            Every response from Daryle AI is grounded in authentic, first-hand materials that capture 
            Daryle Doden's leadership, faith, and philosophy. The model draws from decades of real-world 
            experience, reflection, and mentorship—curated and approved through the Ambassador and Doden 
            Legacy Trust archives.
          </p>

          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <img 
              src="/features/trained-on-source-screenshot.jpg" 
              alt="Daryle AI interface showing a response about Project SMART"
              className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl"
            />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {sources.map((source, index) => (
              <motion.div
                key={source.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-lg p-6 hover:shadow-xl hover:border-white/30 hover:bg-white/10 transition-all group">
                  <div className="p-3 rounded-lg bg-white/10 w-fit mx-auto mb-4 group-hover:bg-white/20 transition-colors">
                    <source.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="t-h3 mb-3 text-white">{source.label}</h3>
                  <p className="t-body-sm text-white/70 leading-relaxed">{source.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="min-w-[200px]"
            >
              Sign Up for Beta Access
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/faq')}
              className="min-w-[200px] bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              View FAQ
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

export default BuiltOnWisdom;
