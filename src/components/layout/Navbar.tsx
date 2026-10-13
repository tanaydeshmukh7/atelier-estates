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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'bg-limestone-100/90 backdrop-blur-md py-4 border-b border-charcoal-800/10 shadow-subtle'
          : 'bg-transparent py-6 lg:py-8'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo & Studio Mark */}
        <Link
          href="/"
          className="group flex flex-col items-start focus:outline-none"
          aria-label="Atelier Estates - Home"
        >
          <span className="font-serif text-2xl lg:text-3xl tracking-tight text-charcoal-800 group-hover:text-terracotta transition-colors duration-300">
            Atelier Estates
          </span>
          <span className="text-[10px] uppercase tracking-widestEditorial text-charcoal-500 font-mono -mt-1 group-hover:text-charcoal-700 transition-colors">
            Northup Studio
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-10">
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
                    : 'text-charcoal-700 hover:text-charcoal-950'
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
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-wideEditorial text-charcoal-800 border border-charcoal-800/30 px-4 py-2 hover:bg-charcoal-800 hover:text-limestone-100 hover:border-charcoal-800 transition-all duration-300"
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
          className="md:hidden p-2 text-charcoal-800 hover:text-terracotta focus:outline-none"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[73px] bg-limestone-100/98 backdrop-blur-xl border-b border-charcoal-800/15 py-8 px-6 shadow-elevation transition-all animate-in slide-in-from-top-4">
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
