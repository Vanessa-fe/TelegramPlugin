'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm'
          : 'bg-white/80 backdrop-blur-sm'
      } border-b border-[#E9E3EF]`}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-[#1A1523]">
              TelegramPlugin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/pricing"
              className="text-[#6F6E77] hover:text-[#1A1523] font-medium transition-colors duration-150"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-[#6F6E77] hover:text-[#1A1523] font-medium transition-colors duration-150"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              Start free →
            </Link>
          </div>

          {/* Mobile: CTA + Burger */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 text-sm rounded-lg transition-colors duration-150"
            >
              Start
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#6F6E77] hover:text-[#1A1523] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E9E3EF]">
            <div className="flex flex-col gap-4">
              <Link
                href="/pricing"
                className="text-[#6F6E77] hover:text-[#1A1523] font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-[#6F6E77] hover:text-[#1A1523] font-medium py-2 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-lg text-center transition-colors duration-150"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create your account
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
