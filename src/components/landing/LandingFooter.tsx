import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const LandingFooter: React.FC = () => {
  const links = [
    { label: 'Terms of Service', href: '/terms', external: false },
    { label: 'Privacy Policy', href: '/privacy', external: false },
    { label: 'Contact', href: '/contact', external: false },
    { label: 'Ambassador Enterprises', href: 'https://ambassadorenterprises.com', external: true },
  ];

  return (
    <footer>
      {/* Upper section - light background */}
      <div className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="t-h3 text-primary mb-2">Daryle AI</p>
              <p className="t-caption text-muted-foreground italic">Pursuing the Better Way.</p>
            </div>

            <nav className="flex flex-wrap justify-center gap-6">
              {links.map((link) => (
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-body-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="t-body-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Lower section - dark blue copyright */}
      <div className="bg-brand-blue py-6">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl text-center">
          <p className="t-caption text-white">
            © 2025 Daryle AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
