import React from 'react';
import { Sparkles, MapPin, Phone, Mail, Clock, ArrowUp } from 'lucide-react';

export default function Footer({ onBookClick }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#0B1E36] text-white pt-20 pb-10 relative overflow-hidden">
      
      {/* Decorative Orb */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#DFBA84]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/10 text-[#DFBA84]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                DermaCare <span className="text-[#DFBA84]">Luxe</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Mumbai's premier skin &amp; aesthetic medical sanctuary. Board-certified dermatology protocols by Dr. Priya Sharma.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-[#DFBA84]">Navigation</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li><a href="#home" className="hover:text-[#14B8A6] transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-[#14B8A6] transition-colors">About Dr. Priya</a></li>
              <li><a href="#services" className="hover:text-[#14B8A6] transition-colors">Clinical Services</a></li>
              <li><a href="#gallery" className="hover:text-[#14B8A6] transition-colors">Before &amp; After Results</a></li>
              <li><a href="#testimonials" className="hover:text-[#14B8A6] transition-colors">Patient Testimonials</a></li>
              <li><a href="#faq" className="hover:text-[#14B8A6] transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-[#DFBA84]">Clinic Contact</h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                <span>Suite 402, Luxury Medical Heights, Turner Road, Bandra West, Mumbai, Maharashtra 400050</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#14B8A6] shrink-0" />
                <span>+91 91579 31095 / +91 22 2640 9988</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#14B8A6] shrink-0" />
                <span>care@dermacareluxe.com</span>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-[#DFBA84]">Operating Hours</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Mon - Sat:</span>
                <strong className="text-white font-medium">10:00 AM - 08:00 PM</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span>Sunday:</span>
                <span className="text-[#14B8A6]">By Appointment Only</span>
              </div>
            </div>
            <button
              onClick={onBookClick}
              className="w-full py-3 rounded-full bg-[#DFBA84] text-[#0B1E36] font-bold text-xs shadow-lg hover:bg-white transition-all mt-2"
            >
              Book Instant Appointment
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} DermaCare Luxe Skin &amp; Laser Clinic. All rights reserved.
          </div>
          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all flex items-center gap-1.5"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
