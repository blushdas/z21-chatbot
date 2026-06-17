import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LandingNavProps {
  /** "dark" = white text on transparent (overlay on dark hero, default).
   *  "light" = brand-blue text on offwhite (for light pages like /why). */
  variant?: 'dark' | 'light';
}

const LandingNav: React.FC<LandingNavProps> = ({ variant = 'dark' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Compare', href: '/why' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Contact', href: '/contact' },
    { label: 'Get Beta Access', href: '/signup' },
  ];

  const isLight = variant === 'light';
  const logoSrc = isLight
    ? '/lovable-uploads/Daryle_Logo_Dark.svg'
    : '/lovable-uploads/Daryle_Logo_White.svg';

  const baseText = isLight ? 'text-brand-blue/80' : 'text-white/90';
  const hoverText = isLight ? 'hover:text-brand-blue' : 'hover:text-white';
  const mobileBarBg = isMobileMenuOpen
    ? isLight
      ? 'bg-brand-offwhite backdrop-blur-md shadow-md border-brand-blue/10'
      : 'bg-brand-blue backdrop-blur-md shadow-md border-white/10'
    : 'bg-transparent border-transparent';
  const mobileMenuBorder = isLight ? 'border-brand-blue/10' : 'border-white/10';
  const buttonClasses = isLight
    ? 'border-brand-blue text-brand-blue hover:bg-brand-blue/5'
    : 'border-white text-white hover:bg-white/10';
  const menuButtonText = isLight ? 'text-brand-blue hover:text-brand-blue/70' : 'text-white hover:text-white/80';

  return (
    <nav
      className={cn(
        'relative z-50 border-b transition-all duration-300 pt-4',
        mobileBarBg
      )}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-14 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logoSrc}
              alt="Daryle AI"
              className="h-[43px] md:h-[86px] w-auto transition-all duration-300 hover:opacity-90"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn('t-body-sm transition-colors', baseText, hoverText)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/login">
              <Button variant="outline" className={buttonClasses}>
                Sign In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'md:hidden flex items-center gap-2 px-3 py-2 transition-colors',
              menuButtonText
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <>
                <X className="h-5 w-5" />
                <span className="text-sm font-medium">Close</span>
              </>
            ) : (
              <>
                <Menu className="h-5 w-5" />
                <span className="text-sm font-medium">Menu</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={cn('md:hidden py-4 border-t', mobileMenuBorder)}>
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn('text-left t-body-sm transition-colors', baseText, hoverText)}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/login">
                <Button variant="outline" className={cn('w-full', buttonClasses)}>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNav;
