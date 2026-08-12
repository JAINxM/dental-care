import React, { useState } from 'react';
import { Droplets, Wind, Shield, Zap, Sparkles, Sun, Star, Clock, Calendar, ArrowRight, X, Check } from 'lucide-react';

const SERVICES_DATA = [
  {
    id: 'acne',
    name: 'Acne & Scar Treatment',
    icon: Droplets,
    desc: 'Shatter active acne and stimulate dermis repair using therapeutic gold-standard peels and non-ablative RF microneedling.',
    duration: '45 - 60 min',
    sessions: '3 - 5 Sessions',
    recovery: '1 - 2 Days',
    idealFor: 'Pitted scars, hyperpigmentation, active congestion.',
    category: 'Acne & Scars',
    efficacy: '97%',
    fullDetails: 'Combining medical chemical peeling with high-frequency RF needling targets root causes. Peels clear keratin plugs, while sterile needles stimulate deep fibroblast cells to reconstruct scarred skin, leaving skin smooth and uniform.'
  },
  {
    id: 'hair-loss',
    name: 'Hair Loss Therapy (PRP)',
    icon: Wind,
    desc: 'Clinical autologous growth factors injected into the scalp to restore thinning crown density and reactivate dormant follicles.',
    duration: '60 min',
    sessions: '4 - 6 Sessions',
    recovery: 'Immediate',
    idealFor: 'Weak roots, crown thinning, stress-induced shedding.',
    category: 'Hair Care',
    efficacy: '94%',
    fullDetails: 'PRP concentrates high levels of healing growth factors from your own blood. Under local anesthetic, this gold serum is injected into sparse scalp areas to expand follicle bulbs and extend the active growing phase.'
  },
  {
    id: 'eczema',
    name: 'Skin Allergy & Eczema',
    icon: Shield,
    desc: 'Advanced patch testing, barrier-repair formulas, and tailored immunotherapy protocols to manage chronic dermatitis.',
    duration: '30 min',
    sessions: 'Ongoing',
    recovery: 'None',
    idealFor: 'Extreme flaking, dynamic rashes, histamine triggers.',
    category: 'Allergy',
    efficacy: '98%',
    fullDetails: 'We isolate allergens through clinical patch diagnostics. Our protocols reconstruct damaged moisture barriers using custom emollients, medical light therapy, and advanced biologic creams for severe flares.'
  },
  {
    id: 'laser-resurfacing',
    name: 'Laser Resurfacing',
    icon: Zap,
    desc: 'Fractional CO2 laser grids to vaporize aging skin layers, clear deep expression lines, and shrink enlarged pores.',
    duration: '45 min',
    sessions: '2 - 4 Sessions',
    recovery: '3 - 5 Days',
    idealFor: 'Static wrinkles, sun damage, deep textural pits.',
    category: 'Laser',
    efficacy: '96%',
    fullDetails: 'Our laser sends micro-beams of thermal energy down into the dermis. This vaporizes sun-damaged cells, triggers instant contraction of loose elastin fibers, and remodels complete facial texture.'
  },
  {
    id: 'botox',
    name: 'Anti-Aging & Botox',
    icon: Sparkles,
    desc: 'Gracefully erase expression furrows and plump hollow structural regions using premium FDA neuromodulators.',
    duration: '30 min',
    sessions: '4 - 6 Months',
    recovery: 'Minimal',
    idealFor: 'Crow\'s feet, forehead lines, sunken cheeks.',
    category: 'Anti-Aging',
    efficacy: '99%',
    fullDetails: 'Achieve a well-rested appearance that preserves natural dynamic expressions. We strategically inject premium FDA-approved relaxers and hyaluronic fillers to elevate dynamic muscle planes.'
  },
  {
    id: 'pigmentation',
    name: 'Pigmentation Correction',
    icon: Sun,
    desc: 'Q-Switched Nd:YAG lasers and tailored botanical lighteners to dismantle melasma and sun freckles.',
    duration: '45 min',
    sessions: '4 - 6 Sessions',
    recovery: 'Minimal',
    idealFor: 'Patchy cheek melasma, dark sun spots, uneven tone.',
    category: 'Pigmentation',
    efficacy: '95%',
    fullDetails: 'Our lasers shatter deep hyper-concentrated melanin deposits without overheating the surface skin. We couple this with custom brightening micro-infusions to maintain long-term clarity.'
  },
  {
    id: 'cosmetic',
    name: 'Cosmetic Dermatology',
    icon: Star,
    desc: 'Medical-grade Hydrafacials and direct skin-booster micro-droplets to deliver an ultra-dewy glass skin glow.',
    duration: '75 min',
    sessions: 'Monthly',
    recovery: '12 Hours',
    idealFor: 'Bridal prep, dry dull complexion, glow maintenance.',
    category: 'Cosmetic',
    efficacy: '98%',
    fullDetails: 'This multi-step medical facial uses vortex suction to sweep away impurities, drenching the skin in rich hyaluronic acid, anti-aging peptides, and brightening antioxidants for instant glass-skin radiance.'
  }
];

const CATEGORIES = ['All', 'Acne & Scars', 'Hair Care', 'Laser', 'Anti-Aging', 'Pigmentation', 'Cosmetic'];

export default function Services({ onBookService }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedServiceModal, setSelectedServiceModal] = useState(null);

  const filteredServices = activeCategory === 'All'
    ? SERVICES_DATA
    : SERVICES_DATA.filter(s => s.category === activeCategory);

  return (
    <section id="services" className="py-24 bg-[#FAF9F6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DFBA84]/20 text-[#0B1E36] font-semibold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#C59B62]" />
            Bespoke Treatments
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B1E36]">
            Clinical Excellence &amp; Laser Therapies
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto font-light text-base">
            Every procedure is medically supervised and personalized using state-of-the-art US-FDA certified clinical protocols.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-12 no-select scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#0B1E36] text-[#DFBA84] shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#DFBA84]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const IconComp = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-[#DFBA84]/60 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] text-[#0B1E36] flex items-center justify-center group-hover:bg-[#0B1E36] group-hover:text-[#DFBA84] transition-colors">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#14B8A6] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
                      {service.efficacy} Success
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#0B1E36] group-hover:text-[#14B8A6] transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
                    {service.desc}
                  </p>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Duration</span>
                      <strong className="text-[#0B1E36] font-semibold">{service.duration}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Recovery</span>
                      <strong className="text-[#0B1E36] font-semibold">{service.recovery}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedServiceModal(service)}
                    className="w-1/2 py-2.5 px-4 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#DFBA84] hover:bg-[#FAF6EE] transition-all"
                  >
                    View Protocol
                  </button>
                  <button
                    onClick={() => onBookService(service.name)}
                    className="w-1/2 py-2.5 px-4 rounded-full bg-[#0B1E36] text-[#DFBA84] text-xs font-semibold shadow-md hover:bg-[#14B8A6] hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    Book Now
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Protocol Modal */}
      {selectedServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 relative border border-slate-200 animate-fadeIn">
            <button
              onClick={() => setSelectedServiceModal(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#14B8A6]">Clinical Protocol</span>
              <h3 className="font-serif text-2xl font-bold text-[#0B1E36]">{selectedServiceModal.name}</h3>
            </div>

            <p className="text-sm text-slate-600 font-light leading-relaxed">
              {selectedServiceModal.fullDetails}
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs">
              <div>
                <span className="block text-[10px] uppercase text-slate-400 font-bold">Duration</span>
                <span className="font-semibold text-[#0B1E36]">{selectedServiceModal.duration}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400 font-bold">Sessions</span>
                <span className="font-semibold text-[#0B1E36]">{selectedServiceModal.sessions}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400 font-bold">Recovery</span>
                <span className="font-semibold text-[#0B1E36]">{selectedServiceModal.recovery}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedServiceModal(null)}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const name = selectedServiceModal.name;
                  setSelectedServiceModal(null);
                  onBookService(name);
                }}
                className="px-6 py-2.5 rounded-full bg-[#0B1E36] text-[#DFBA84] font-semibold text-xs shadow-md hover:bg-[#14B8A6] hover:text-white transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                Book This Protocol
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
