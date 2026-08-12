import React from 'react';
import { Award, GraduationCap, CheckCircle2, Building2 } from 'lucide-react';

const TIMELINE = [
  {
    year: '2005 - 2010',
    title: 'MBBS & MD Dermatology',
    institution: 'Grant Medical College, Mumbai',
    desc: 'Graduated with Gold Medal honors. Specialized in South Asian skin-type laser mechanics and micro-dermatology.'
  },
  {
    year: '2011 - 2012',
    title: 'Fellowship in Cosmetic Dermatology',
    institution: 'University of Miami Miller School of Medicine, USA',
    desc: 'Trained under global leaders in anti-aging injection techniques, skin barrier biology, and laser resurfacing.'
  },
  {
    year: '2014 - Present',
    title: 'Founded DermaCare Luxe',
    institution: 'Bandra West, Mumbai',
    desc: 'Built Mumbai’s award-winning boutique clinical space combining scientific precision with premium luxury comfort.'
  }
];

export default function AboutDoctor() {
  return (
    <section id="about" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Doctor Image & Badges */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="/images/doctor.png"
                alt="Dr. Priya Sharma Dermatologist"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E36]/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <h3 className="font-serif text-2xl font-bold">Dr. Priya Sharma</h3>
                <p className="text-xs text-[#DFBA84] uppercase tracking-wider font-semibold">
                  Founder &amp; Chief Aesthetic Dermatologist
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Bio & Career Timeline */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DFBA84]/20 text-[#0B1E36] font-semibold text-xs uppercase tracking-widest">
                <GraduationCap className="w-4 h-4 text-[#C59B62]" />
                Scientific Expertise
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1E36]">
                Dr. Priya Sharma <span className="text-[#14B8A6]">(MBBS, MD)</span>
              </h2>
              <p className="text-slate-600 font-light text-base leading-relaxed">
                With over 15 years of dedicated medical experience, Dr. Priya Sharma is widely recognized for introducing scientific precision to aesthetic skin and scalp care. She believes in non-invasive, natural-looking enhancements that preserve your individual expression.
              </p>
            </div>

            {/* Highlights */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#14B8A6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[#0B1E36]">Custom Protocols</h4>
                  <p className="text-xs text-slate-500 mt-1">Every chemical & laser pulse is mathematically tailored to your skin.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#14B8A6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[#0B1E36]">US-FDA Approved</h4>
                  <p className="text-xs text-slate-500 mt-1">100% certified clinical equipment & authentic dermal formulations.</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className="font-serif text-xl font-bold text-[#0B1E36] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#DFBA84]" />
                Education &amp; Clinical Journey
              </h3>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {TIMELINE.map((item, idx) => (
                  <div key={idx} className="relative pl-8 group">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#DFBA84] border-2 border-white shadow-sm group-hover:scale-125 transition-transform" />
                    <div className="text-xs font-bold text-[#14B8A6]">{item.year}</div>
                    <div className="font-serif font-bold text-base text-[#0B1E36]">{item.title}</div>
                    <div className="text-xs text-slate-500 font-medium">{item.institution}</div>
                    <p className="text-xs text-slate-600 font-light mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
