'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { agencyConfig } from '@/config/agency';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  // Automatically close mobile menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSolid = scrolled || mobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 motion-safe:transition-colors motion-reduce:transition-none duration-300 ${
        mobileMenuOpen
          ? 'h-[100dvh] bg-limestone-100 flex flex-col md:h-auto'
          : scrolled
            ? 'bg-limestone-100/90 backdrop-blur-md py-4 border-b border-charcoal-800/10 shadow-subtle'
            : 'bg-gradient-to-b from-charcoal-950/75 via-charcoal-900/35 to-transparent py-6 text-limestone-100 lg:py-8'
      }`}
    >
      <div
        className={`w-full max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between ${
          mobileMenuOpen ? 'py-4 border-b border-charcoal-800/10' : ''
        }`}
      >
        {/* Brand Logo & Studio Mark */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className={`group flex flex-col items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-4 ${
            isSolid ? 'focus-visible:ring-offset-limestone-100' : 'focus-visible:ring-offset-charcoal-900'
          }`}
          aria-label="Atelier Estates - Home"
        >
          <span
            className={`font-serif text-2xl lg:text-3xl tracking-tight transition-colors duration-300 ${
              isSolid ? 'text-charcoal-800 group-hover:text-terracotta' : 'text-limestone-100 group-hover:text-white'
            }`}
          >
            Atelier Estates
          </span>
          <span
            className={`text-[10px] uppercase tracking-widestEditorial font-mono -mt-1 transition-colors ${
              isSolid ? 'text-charcoal-500 group-hover:text-charcoal-700' : 'text-limestone-100/75 group-hover:text-limestone-100'
            }`}
          >
            Northup Studio
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:gap-10 md:flex">
          {agencyConfig.navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href) && !link.href.includes('#');

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative text-xs uppercase tracking-wideEditorial transition-colors duration-200 py-1 ${
                  isActive
                    ? 'text-terracotta font-medium'
                    : isSolid
                      ? 'text-charcoal-700 hover:text-charcoal-950'
                      : 'text-limestone-100 hover:text-white drop-shadow-sm'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-terracotta animate-in fade-in" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Advisory CTA */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/contact"
            className={`group inline-flex items-center gap-2 text-xs uppercase tracking-wideEditorial border px-4 py-2 transition-all duration-300 ${
              isSolid
                ? 'text-charcoal-800 border-charcoal-800/30 hover:bg-charcoal-800 hover:text-limestone-100 hover:border-charcoal-800'
                : 'text-limestone-100 border-limestone-100/65 bg-charcoal-900/20 hover:bg-limestone-100 hover:text-charcoal-900 hover:border-limestone-100'
            }`}
          >
            <span>Private Advisory</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className={`md:hidden p-2.5 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
            isSolid ? 'text-charcoal-800 hover:text-terracotta' : 'text-limestone-100 hover:text-white'
          }`}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="md:hidden flex-1 flex flex-col justify-between overflow-y-auto px-6 py-8 bg-limestone-100 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Navigation Links */}
          <nav aria-label="Mobile primary navigation" className="flex flex-col">
            {agencyConfig.navLinks.map((link, idx) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href) && !link.href.includes('#');

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between py-4 border-b border-charcoal-800/10 transition-colors min-h-[52px] ${
                    isActive ? 'text-terracotta font-medium' : 'text-charcoal-800 hover:text-terracotta'
                  }`}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-xs tracking-wider text-charcoal-400 group-hover:text-terracotta transition-colors">
                      {`0${idx + 1}`}
                    </span>
                    <span className="font-serif text-2xl tracking-tight">
                      {link.label}
                    </span>
                  </div>
                  <ArrowUpRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isActive ? 'text-terracotta' : 'text-charcoal-400 group-hover:text-terracotta'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Advisory & Direct Contact Footer */}
          <div className="pt-8 flex flex-col space-y-4">
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-3.5 bg-charcoal-800 text-limestone-100 text-xs uppercase tracking-wideEditorial hover:bg-terracotta transition-colors font-medium min-h-[44px] flex items-center justify-center shadow-subtle"
            >
              <span>Private Advisory Desk</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${agencyConfig.contact.phone.replace(/[^+\d]/g, '')}`}
                className="flex flex-col p-3 bg-limestone-50 border border-charcoal-800/10 text-charcoal-800 hover:border-terracotta/50 transition-colors min-h-[44px]"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-400">Direct Line</span>
                <span className="text-xs font-mono text-charcoal-700 mt-1 truncate">{agencyConfig.contact.phone}</span>
              </a>
              <a
                href={`mailto:${agencyConfig.contact.email}`}
                className="flex flex-col p-3 bg-limestone-50 border border-charcoal-800/10 text-charcoal-800 hover:border-terracotta/50 transition-colors min-h-[44px]"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-400">Concierge</span>
                <span className="text-xs font-mono text-charcoal-700 mt-1 truncate">{agencyConfig.contact.email}</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-charcoal-500">
                Mayfair · Enge · Chelsea
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
