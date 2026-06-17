import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail } from 'lucide-react';

const BetaConfirmationPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Welcome to the Beta - Daryle AI';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="t-h1 mb-4"
        >
          Welcome to the Beta Waitlist!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="t-body-lg text-muted-foreground mb-8"
        >
          Thank you for your interest in Daryle AI. You're now on the waitlist for our beta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border-2 border-border rounded-xl p-8 mb-8 text-left"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="t-h3 mb-2">What's Next?</h3>
              <p className="t-body text-muted-foreground">
                We'll send you an email confirmation shortly. As we approach launch, 
                you'll receive updates on:
              </p>
            </div>
          </div>

          <ul className="space-y-3 ml-16">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="t-body">Early access invitations</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="t-body">Beta testing opportunities</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="t-body">Platform updates and new features</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="t-body">Your chance to shape the future of Daryle AI</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button 
            size="lg"
            onClick={() => navigate('/landing')}
          >
            Return to Homepage
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="t-body-sm text-muted-foreground mt-8"
        >
          Didn't receive a confirmation email? Check your spam folder or contact us for assistance.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default BetaConfirmationPage;
