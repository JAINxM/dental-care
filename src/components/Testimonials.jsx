import React from 'react';
import { Star, Quote, MessageSquare } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Ananya Mehta',
    treatment: 'Acne & Scar Treatment',
    review: 'Dr. Priya transformed my skin! I carried severe scars for 5 years that made me self-conscious. After 4 sessions of RF needling, my skin is smooth, clear, and glowing.',
    initials: 'AM',
    rating: 5
  },
  {
    name: 'Rohan Sharma',
    treatment: 'Hair Loss Therapy (PRP)',
    review: 'Incredibly hygienic clinic and expert medical staff. Dr. Priya explained the science behind scalp growth factors. Visible density restored within 3 months.',
    initials: 'RS',
    rating: 5
  },
  {
    name: 'Priyanka Sen',
    treatment: 'Pigmentation Correction',
    review: 'Post-pregnancy melasma had completely covered my cheekbones. Dr. Priya’s laser protocols cleared it gently without any harsh downtime.',
    initials: 'PS',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#FAF9F6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFBA84]/20 text-[#0B1E36] font-semibold text-xs uppercase tracking-widest">
            <MessageSquare className="w-4 h-4 text-[#C59B62]" />
            Patient Experiences
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B1E36]">
            Words of Trust &amp; Confidence
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto font-light text-base">
            Read authentic reviews from patients who achieved their aesthetic goals at DermaCare Luxe.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between"
            >
              <Quote className="w-10 h-10 text-[#DFBA84]/30 absolute top-6 right-6 pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-1">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#DFBA84] text-[#DFBA84]" />
                  ))}
                </div>

                <p className="text-sm text-slate-700 font-light leading-relaxed italic">
                  "{item.review}"
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#0B1E36] text-[#DFBA84] font-bold text-sm flex items-center justify-center shadow-md">
                  {item.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#0B1E36]">{item.name}</h4>
                  <p className="text-xs text-[#14B8A6] font-medium">{item.treatment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
