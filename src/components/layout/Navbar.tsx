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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 motion-safe:transition-all motion-reduce:transition-none duration-500 ${
        scrolled
          ? 'bg-limestone-100/90 backdrop-blur-md py-4 border-b border-charcoal-800/10 shadow-subtle'
          : 'bg-gradient-to-b from-charcoal-950/75 via-charcoal-900/35 to-transparent py-6 text-limestone-100 lg:py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo & Studio Mark */}
        <Link
          href="/"
          className={`group flex flex-col items-start focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-4 ${
            scrolled ? 'focus-visible:ring-offset-limestone-100' : 'focus-visible:ring-offset-charcoal-900'
          }`}
          aria-label="Atelier Estates - Home"
        >
          <span className={`font-serif text-2xl lg:text-3xl tracking-tight transition-colors duration-300 ${
            scrolled ? 'text-charcoal-800 group-hover:text-terracotta' : 'text-limestone-100 group-hover:text-white'
          }`}>
            Atelier Estates
          </span>
          <span className={`text-[10px] uppercase tracking-widestEditorial font-mono -mt-1 transition-colors ${
            scrolled ? 'text-charcoal-500 group-hover:text-charcoal-700' : 'text-limestone-100/75 group-hover:text-limestone-100'
          }`}>
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
                    : scrolled
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
              scrolled
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className={`md:hidden p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta ${
            scrolled ? 'text-charcoal-800 hover:text-terracotta' : 'text-limestone-100 hover:text-white'
          }`}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-full max-h-[calc(100vh-100%)] overflow-y-auto bg-limestone-100/98 backdrop-blur-xl border-b border-charcoal-800/15 py-8 px-6 shadow-elevation transition-all animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-6">
            {agencyConfig.navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-lg font-serif text-charcoal-800 hover:text-terracotta transition-colors flex items-center justify-between border-b border-charcoal-800/5 pb-3"
              >
                <span>{link.label}</span>
                <ArrowUpRight className="w-4 h-4 text-charcoal-400" />
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <Link
                href="/contact"
                className="w-full text-center py-3 bg-charcoal-800 text-limestone-100 text-xs uppercase tracking-wideEditorial hover:bg-terracotta transition-colors"
              >
                Private Advisory Desk
              </Link>
              <div className="text-center font-mono text-[10px] text-charcoal-500 uppercase tracking-widest">
                {agencyConfig.contact.phone}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
