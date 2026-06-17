import React, { useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEOHead
        title="Terms of Service - Daryle AI | User Agreement & Beta Program Terms"
        description="Read Daryle AI's Terms of Service. Understand user agreements, beta program terms, acceptable use policies, and your rights as a platform user."
        keywords="Daryle AI terms of service, user agreement, beta terms, acceptable use policy, platform terms"
        canonicalUrl="/terms-of-service"
      />
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        {/* Hero Section - extends behind nav */}
        <section className="relative -mt-14 md:-mt-20 pt-32 md:pt-40 pb-20 px-4 overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-blue/90">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>
          
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-white/90">
              Last Updated: November 24, 2025
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="prose prose-sm max-w-none space-y-6 p-8">
                <p className="text-muted-foreground">
                  Welcome to Daryle.AI ("Service"), operated by or on behalf of the Doden Legacy Trust and/or in partnership with Ambassador Enterprises ("we," "us," or "our"). By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the Service.
                </p>

                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Overview of the Service</h2>
                  <p className="text-muted-foreground">
                    Daryle.AI is an AI-powered platform inspired by the teachings, writings, and principles of Daryle Doden. It is designed to provide conversational insights, mentorship-style guidance, and development tools to individuals seeking personal, professional, and leadership growth.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. Eligibility</h2>
                  <p className="text-muted-foreground">
                    You must be at least 18 years old (or older if required in your jurisdiction) to use the Service. If you are under the age of majority, you must use the Service under the supervision of a parent or legal guardian.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                  <p className="text-muted-foreground">
                    To access certain features, you may be required to register an account. You agree to provide accurate information and to maintain the security of your login credentials. You are responsible for all activities that occur under your account. You agree not to share your credentials with others and to notify us promptly of any unauthorized access or security breach.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
                  <p className="text-muted-foreground mb-3">
                    You agree not to use the Service to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Violate any applicable law or regulation.</li>
                    <li>Infringe intellectual property rights or other rights of any person or entity.</li>
                    <li>Submit harmful, unlawful, abusive, or objectionable content.</li>
                    <li>Interfere with or disrupt the Service's integrity, availability, or performance.</li>
                    <li>Attempt to gain unauthorized access to any portion or feature of the Service.</li>
                    <li>Deploy any automated system (e.g., bots, scrapers) without express permission.</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    We reserve the right to suspend or terminate access and/or remove content that violates these conditions or threatens the platform's safety or integrity.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    The content, structure, and design of the Service—including but not limited to software, training materials, prompts, responses, visuals, brand elements, and documentation—are protected by copyright, trademark, and other intellectual property laws. Daryle.AI, the Daryle Doden name, and related marks are owned by Doden Legacy Trust and/or used under license. You may not copy, reproduce, transmit, modify, distribute, publicly display, or create derivative works from the Service's content without prior written consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. AI Content and Limitations</h2>
                  <p className="text-muted-foreground mb-3">
                    The Service generates outputs using artificial intelligence models trained on licensed content and data reflective of Daryle Doden's teachings. These outputs are intended solely for informational and educational purposes.
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>They do not constitute professional advice.</li>
                    <li>Users must exercise their own judgment before acting on any information provided by the Service.</li>
                    <li>Daryle.AI does not guarantee factual accuracy or uniqueness of AI-generated content.</li>
                    <li>No liability is assumed for reliance on generated responses.</li>
                    <li>Do not use the Service for time-sensitive, critical, or life-altering decisions.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. User Content and Feedback</h2>
                  <p className="text-muted-foreground">
                    You retain ownership of your original inputs into the Service but grant us a non-exclusive, royalty-free, worldwide license to use, store, reproduce, and analyze them for the purpose of operating, improving, and developing the Service. This includes training and evaluation of AI performance. If you submit suggestions or feedback, you agree that we may use them without restriction or compensation.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Privacy</h2>
                  <p className="text-muted-foreground">
                    Your privacy is important to us. Our data collection, use, and retention practices are described in our Privacy Policy, which forms part of these Terms. By using the Service, you consent to the collection of information such as interaction data, device identifiers, usage patterns, and account details, and the sharing of such data with trusted third parties for analytics and operational purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. Payment and Subscriptions (if applicable)</h2>
                  <p className="text-muted-foreground">
                    Access to certain features may require payment or subscription. All fees are stated in U.S. dollars and are non-refundable unless explicitly stated otherwise. We reserve the right to modify pricing and plans with reasonable notice. If you subscribe, you authorize us to charge the applicable fees to your payment method.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
                  <p className="text-muted-foreground">
                    We may suspend or terminate your access at any time with or without notice for violations of these Terms, misuse of the Service, or legal/regulatory reasons. You may terminate your account at any time by contacting us. Upon termination, your rights to access the Service cease immediately. We may retain data as required by law or for internal audit, security, or recordkeeping purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Disclaimers and Limitation of Liability</h2>
                  <p className="text-muted-foreground uppercase text-sm">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL DARYLE.AI, DODEN LEGACY TRUST, AMBASSADOR ENTERPRISES, OR THEIR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">12. Indemnification</h2>
                  <p className="text-muted-foreground">
                    You agree to indemnify, defend, and hold harmless Daryle.AI, Doden Legacy Trust, Ambassador Enterprises, and their officers, employees, contractors, and affiliates from any claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising out of or related to your use or misuse of the Service or your violation of these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">13. Modification of Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify or update these Terms at any time. Material changes will be communicated through the Service or by email. Continued use of the Service after such modifications constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">14. Governing Law and Dispute Resolution</h2>
                  <p className="text-muted-foreground">
                    These Terms are governed by the laws of the State of Indiana, excluding conflict of law principles. Any disputes arising out of or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts located in Indiana. You consent to the jurisdiction and venue of those courts.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">15. Export Compliance and U.S. Use Only</h2>
                  <p className="text-muted-foreground">
                    You agree to comply with all U.S. export control laws. The Service is intended for use by individuals and organizations in the United States. We make no representation that the Service is appropriate or available in other locations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">16. Entire Agreement</h2>
                  <p className="text-muted-foreground">
                    These Terms, along with the Privacy Policy, constitute the entire agreement between you and us concerning the Service and supersede all prior agreements or understandings.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">17. Contact</h2>
                  <p className="text-muted-foreground">
                    For questions or support, contact us at:{' '}
                    <a href="mailto:info@daryle.ai" className="text-primary hover:underline">
                      info@daryle.ai
                    </a>
                  </p>
                </section>

                <section className="border-t pt-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    By using Daryle.AI, you confirm that you have read, understood, and agreed to these Terms of Service.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  );
};

export default TermsOfServicePage;
