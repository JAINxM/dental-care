import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What distinguishes DermaCare Luxe from basic aesthetic clinics?',
    a: 'We combine board-certified medical dermatology expertise with world-class, US-FDA approved technologies. We do not use cookie-cutter plans; every chemical formula, laser pulse, and booster injection is mathematically tailored to your individual skin properties.'
  },
  {
    q: 'How long do anti-aging fillers and Botox results last?',
    a: 'Neuromodulators (Botox) typically maintain smooth results for 4 to 6 months. Hyaluronic acid dermal fillers generally retain volume and shape for 9 to 15 months, depending on the dynamic movement of the treated area.'
  },
  {
    q: 'What is the absolute post-care routine for laser treatments?',
    a: 'You must apply our soothing barrier cream, avoid direct sun exposure for 72 hours, and apply a broad-spectrum SPF 50+ mineral sunscreen daily. Avoid exfoliating acids (AHA/BHA/Retinol) for 7 days.'
  },
  {
    q: 'Does it hurt to get PRP or dermal booster micro-injections?',
    a: 'Your comfort is our priority. We apply a premium topical numbing anesthetic cream for 45 minutes prior to any micro-injections, ensuring the experience is virtually painless.'
  }
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] font-semibold text-xs uppercase tracking-widest">
            <HelpCircle className="w-4 h-4" />
            Patient Guidance
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1E36]">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto font-light text-base">
            Everything you need to know about our scientific procedures, safety, and post-care.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#FAF9F6] rounded-2xl border border-slate-200/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left font-serif font-bold text-lg text-[#0B1E36] flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#DFBA84] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-600 font-light leading-relaxed animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
