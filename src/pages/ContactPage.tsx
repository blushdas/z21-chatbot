import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const inquiryTypes = [
  { value: 'support', label: 'Support Question' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'message', label: 'Message' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
];

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Daryle AI",
      "email": "info@daryle.ai",
      "url": "https://daryle.ai"
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          inquiryType: formData.inquiryType,
          message: formData.message.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: 'Thank you for reaching out. We\'ll get back to you soon.',
      });

      // Reset form
      setFormData({ name: '', email: '', inquiryType: '', message: '' });
    } catch (error: any) {
      toastError(error, 'Failed to send message', 'Please try again or email us directly at info@daryle.ai');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <SEOHead
        title="Contact Us - Daryle AI | Get in Touch with Our Team"
        description="Have questions about Daryle AI? Need support or have inquiries? Send us a message or email info@daryle.ai. We're here to help."
        keywords="contact Daryle AI, support, customer service, inquiries, info@daryle.ai, get in touch"
        canonicalUrl="/contact"
        schemaData={contactSchema}
      />
      <div className="min-h-screen bg-background">
        <LandingNav />

      {/* Hero Section */}
      <section className="relative pt-44 md:pt-52 pb-20 px-4 overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-blue/90 -mt-[5.5rem] md:-mt-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Have questions about Daryle AI? Need support or have inquiries? We're here to help.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Send us a message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiryType">Inquiry Type</Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                    required
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {inquiryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* Email Contact Info */}
            <div className="space-y-6">
              <Card className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Email us directly</h2>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  Prefer email? Send your questions or inquiries directly to:
                </p>
                
                <a 
                  href="mailto:info@daryle.ai"
                  className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  info@daryle.ai
                </a>
              </Card>

              <Card className="p-6 md:p-8 bg-muted/50">
                <h3 className="font-semibold text-foreground mb-3">Looking for answers?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check out our FAQ page for quick answers to common questions.
                </p>
                <Link to="/faq">
                  <Button variant="outline" className="w-full">
                    View FAQ
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

        <LandingFooter />
      </div>
    </>
  );
};

export default ContactPage;
