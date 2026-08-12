import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Award, Star } from 'lucide-react';

function StatCounter({ target, suffix = '', label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="text-center sm:text-left">
      <div className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1E36]">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

export default function Hero({ onBookClick, onQuizClick }) {
  return (
    <section id="home" className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 mesh-gradient overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#DFBA84]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-[#14B8A6]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[#DFBA84]/40 shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#DFBA84]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#0B1E36]">
                Science-Backed Aesthetic Perfection
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B1E36] leading-[1.15]">
              Redefine Your Skin's <br />
              <span className="bg-gradient-to-r from-[#0B1E36] via-[#14B8A6] to-[#C59B62] bg-clip-text text-transparent">
                Natural Luminosity
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-light leading-relaxed mx-auto lg:mx-0">
              Welcome to Mumbai's premier clinical sanctuary. Under the scientific care of{' '}
              <strong className="text-[#0B1E36] font-semibold">Dr. Priya Sharma</strong> (MBBS, MD Gold Medalist), we merge US-FDA medical technology with bespoke dermatology protocols.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onBookClick}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-[#0B1E36] to-[#14B8A6] text-white font-semibold text-base px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
              >
                <Calendar className="w-5 h-5 text-[#DFBA84]" />
                Book Consultation
              </button>

              <button
                onClick={onQuizClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/90 text-[#0B1E36] border border-slate-200 font-semibold text-base px-7 py-4 rounded-full shadow-sm hover:border-[#DFBA84] hover:bg-white transition-all"
              >
                Take Skin Assessment
                <ArrowRight className="w-4 h-4 text-[#14B8A6]" />
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-8 border-t border-slate-200/70 grid grid-cols-3 gap-6 max-w-xl mx-auto lg:mx-0">
              <StatCounter target={15000} suffix="+" label="Happy Patients" />
              <StatCounter target={15} suffix="+" label="Years Experience" />
              <StatCounter target={99} suffix="%" label="Clinical Satisfaction" />
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Golden Glow Border */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#DFBA84]/30 via-[#14B8A6]/20 to-[#0B1E36]/10 blur-xl" />

              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white">
                <img
                  src="/images/doctor.png"
                  alt="Dr. Priya Sharma Dermatologist"
                  className="w-full aspect-[4/5] object-cover"
                />

                {/* Glass Floating Badge 1 */}
                <div className="absolute top-6 left-6 glass-card p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="p-2 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B1E36]">MD Gold Medalist</div>
                    <div className="text-[10px] text-slate-500">Board Certified Dermatologist</div>
                  </div>
                </div>

                {/* Glass Floating Badge 2 */}
                <div className="absolute bottom-6 right-6 glass-card p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                  <div className="flex -space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-[#DFBA84] text-[#DFBA84]" />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-[#0B1E36]">4.9/5 Patient Rating</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
