import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Settings, Menu, X } from 'lucide-react';

export default function Navbar({ onBookClick, onAdminClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Results', href: '#gallery' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
      <nav className={`max-w-7xl mx-auto rounded-full transition-all duration-500 flex justify-between items-center px-6 sm:px-8 py-3 border ${
        isScrolled 
          ? 'bg-[#0B1E36]/95 backdrop-blur-xl border-white/10 shadow-lg text-white' 
          : 'bg-[#FAF6EE]/90 backdrop-blur-md border-slate-200/50 shadow-sm text-slate-800'
      }`}>
        {/* Brand Logo */}
        <a href="#home" className="flex items-center gap-3 group focus:outline-none">
          <div className={`p-2 rounded-full transition-colors duration-300 ${
            isScrolled ? 'bg-white/10 text-[#DFBA84]' : 'bg-[#0B1E36]/5 text-[#0B1E36]'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className={`font-serif text-lg sm:text-xl font-bold tracking-tight ${
              isScrolled ? 'text-white' : 'text-slate-800'
            }`}>
              DermaCare <span className="text-[#DFBA84]">Luxe</span>
            </span>
            <p className="text-[9px] tracking-[0.2em] text-slate-400 font-sans uppercase font-semibold">
              Skin &amp; Laser Clinic
            </p>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-[#14B8A6] ${
                isScrolled ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onAdminClick}
            title="Admin WhatsApp Settings"
            className={`p-2.5 rounded-full border transition-all ${
              isScrolled
                ? 'border-white/10 text-slate-300 hover:bg-white/10'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onBookClick}
            className="flex items-center gap-2 bg-gradient-to-r from-[#DFBA84] to-[#C59B62] text-[#0B1E36] font-semibold text-sm px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:brightness-105 transition-all"
          >
            <Calendar className="w-4 h-4" />
            Book Consultation
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onBookClick}
            className="bg-[#DFBA84] text-[#0B1E36] font-semibold text-xs px-3.5 py-2 rounded-full"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${isScrolled ? 'text-white' : 'text-slate-800'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-6 rounded-2xl bg-[#0B1E36] text-white shadow-2xl border border-white/10 space-y-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium hover:text-[#DFBA84]"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAdminClick();
              }}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <Settings className="w-4 h-4" />
              WhatsApp Admin Gateway
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
