import React, { useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import ImplementationReceipt from '@/components/ImplementationReceipt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEOHead
        title="Privacy Policy - Daryle AI | Data Protection & Security"
        description="Daryle AI Privacy Policy. Learn how we protect your data, what information we collect, how it's used, and your privacy rights. Secure, encrypted, confidential."
        keywords="Daryle AI privacy policy, data protection, privacy rights, data security, encryption, confidential conversations"
        canonicalUrl="/privacy-policy"
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
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90">
              Last Updated: November 24, 2025
            </p>
          </div>
        </section>

        <section className="py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <ImplementationReceipt />
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="prose prose-sm max-w-none space-y-6 p-8">
                <p className="text-muted-foreground">
                  Daryle.AI ("we," "us," or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use our platform, and your rights related to that information.
                </p>

                <section>
                  <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                  <p className="text-muted-foreground mb-3">
                    We may collect the following types of information:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Personal Information</strong>: such as your name, email address, organization, phone number, and account credentials when you register, fill out a contact form, or communicate with us.</li>
                    <li><strong>Usage Data</strong>: including your interactions with the platform, conversation history, session data, exit URLs, and preferences.</li>
                    <li><strong>Device and Technical Data</strong>: such as IP address, browser type, operating system, device identifiers, OS type, cookie ID, and crash/error reports.</li>
                    <li><strong>Cookies and Tracking Technologies</strong>: small text files that help us remember your preferences, provide a more individualized user experience, and analyze platform usage. This may include language settings, time on site, pages viewed, and more.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">2. How We Collect Information</h2>
                  <p className="text-muted-foreground mb-3">
                    We may collect your information through:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Direct interactions such as registrations, product requests, and support inquiries.</li>
                    <li>Voluntary submissions through forms, surveys, or sign-ups.</li>
                    <li>Automatic technologies like cookies and analytics tools.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-3">
                    We use your information to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Operate and maintain the platform.</li>
                    <li>Personalize your experience and deliver relevant content.</li>
                    <li>Improve service functionality, security, and AI performance.</li>
                    <li>Respond to your questions or service requests.</li>
                    <li>Communicate with you about updates, offers, and event announcements.</li>
                    <li>Comply with legal obligations and enforce our Terms of Service.</li>
                    <li>Conduct platform usage analysis and improvements.</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    In the event of a business transition involving a substantial portion of our assets, customer information may be among the transferred assets.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">4. Sharing of Information</h2>
                  <p className="text-muted-foreground mb-3">
                    We do not sell your personal data. We may share your information with:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Service Providers</strong>: such as hosting providers, analytics tools, promotional vendors, AI processors, or customer support platforms, bound by confidentiality agreements.</li>
                    <li><strong>Affiliates and Partners</strong>: like Ambassador Enterprises and Doden Legacy Trust, only to support the Service's mission and operation.</li>
                    <li><strong>Third Parties with Your Consent</strong>: such as when you opt in to receive third-party offers or promotional materials.</li>
                    <li><strong>Legal Authorities</strong>: when legally compelled or necessary to protect safety, rights, or comply with regulations.</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    We may also act as an intermediary to share offers or content from trusted partners without directly sharing your information with them.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain personal data as long as your account is active or as needed to fulfill the purposes described in this Policy. Conversation logs may be retained for service operation, safety review, auditability, and analytics. We do not use Ambassador customer content to train public foundation models. Backup copies may persist for a limited time after account deletion.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">5A. Safety Review and Admin Visibility</h2>
                  <p className="text-muted-foreground">
                    Daryle.AI uses automated safety controls to detect potentially unsafe chat content, prompt-injection attempts, sensitive-data exposure, suspicious access, and file-upload risks. Flagged events may be visible to authorized administrators for security review, compliance, support, and incident response. Admin review is role-restricted and recorded in audit logs.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
                  <p className="text-muted-foreground">
                    We use industry-standard safeguards to protect your information. This includes encryption, access controls, security monitoring, and Secure Socket Layer (SSL) certificates for transmitted data. Sensitive data is accessible only to those with authorized rights and who are required to maintain confidentiality. However, no method is completely secure and use of the Service is at your own risk.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    We comply with the Children's Online Privacy Protection Act (COPPA). Daryle.AI is not intended for children under 13. We do not knowingly collect information from individuals under that age. If such data is discovered, it will be deleted promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
                  <p className="text-muted-foreground mb-3">
                    Depending on your jurisdiction, you may have the right to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Access or export your personal data.</li>
                    <li>Correct inaccurate information.</li>
                    <li>Request deletion of your information.</li>
                    <li>Withdraw consent or object to data processing.</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    You can exercise these rights by contacting us at{' '}
                    <a href="mailto:info@daryle.ai" className="text-primary hover:underline">info@daryle.ai</a>. 
                    Verification of your identity may be required to fulfill your request.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
                  <p className="text-muted-foreground">
                    If you are accessing the Service from outside the U.S., please be aware that your information will be transferred to and processed in the United States. We take measures to protect data in accordance with this policy and applicable laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    This policy may be updated periodically. Material changes will be posted on this page or communicated to registered users. Continued use of the Service indicates acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
                  <p className="text-muted-foreground mb-2">
                    For questions, privacy-related concerns, or requests for data removal, please contact:
                  </p>
                  <div className="text-muted-foreground space-y-1">
                    <p>Email: <a href="mailto:info@daryle.ai" className="text-primary hover:underline">info@daryle.ai</a></p>
                    <p>Phone: 260.487.4000</p>
                    <p>Mailing Address: 11020 Diebold Road, Fort Wayne, IN 46845</p>
                  </div>
                </section>

                <section className="border-t pt-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    By using Daryle.AI, you agree to the terms outlined in this Privacy Policy.
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

export default PrivacyPolicyPage;
