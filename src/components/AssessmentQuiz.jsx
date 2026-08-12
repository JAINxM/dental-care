import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, ArrowRight, Sparkles, Clock, Calendar } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    title: 'Primary Aesthetic / Skin Concern',
    subtitle: 'Select the main area you wish to target for clinical improvement:',
    options: [
      {
        concern: 'Acne & Deep Scars',
        treatment: 'Acne & Scar Treatment',
        duration: '45-60 min',
        code: 'acne',
        desc: 'Pitted scars, active congestion, or stubborn redness.'
      },
      {
        concern: 'Hair Shedding & Baldness',
        treatment: 'Hair Loss Therapy (PRP)',
        duration: '60 min',
        code: 'hair-loss',
        desc: 'Thinning crown, receding hairline, or weak roots.'
      },
      {
        concern: 'Dark Spots & Melasma',
        treatment: 'Pigmentation Correction',
        duration: '45 min',
        code: 'pigmentation',
        desc: 'Patchy cheek melasma, sun freckles, uneven tone.'
      },
      {
        concern: 'Wrinkles & Loss of Volume',
        treatment: 'Anti-Aging & Botox',
        duration: '30 min',
        code: 'botox',
        desc: 'Crow’s feet, forehead furrows, fine lines.'
      }
    ]
  }
];

export default function AssessmentQuiz({ onSelectTreatment }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowResult(false);
  };

  return (
    <section id="assessment" className="py-20 bg-[#FAF9F6] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] font-medium text-xs uppercase tracking-widest">
            <HelpCircle className="w-4 h-4" />
            Personalized Skin Diagnostic
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1E36]">
            Interactive Treatment Recommender
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto font-light text-sm sm:text-base">
            Answer 1 quick question to discover Dr. Priya's recommended medical protocol tailored for your skin type.
          </p>
        </div>

        {/* Quiz Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 relative">
          
          {!showResult ? (
            <div className="space-y-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#14B8A6]">Question 1 of 1</span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#0B1E36] mt-1">
                  What is your primary clinical concern?
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {QUIZ_QUESTIONS[0].options.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => handleSelect(option)}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-[#DFBA84] hover:bg-[#FAF6EE]/50 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-semibold text-base text-[#0B1E36] group-hover:text-[#14B8A6] transition-colors flex items-center justify-between">
                        {option.concern}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#DFBA84]" />
                      </div>
                      <p className="text-xs text-slate-500 mt-2 font-light">{option.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#14B8A6]" />
                      Duration: {option.duration}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#DFBA84] font-bold">Recommended Protocol</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1E36]">
                  {selectedOption.treatment}
                </h3>
                <p className="text-slate-600 text-sm max-w-lg mx-auto">
                  Based on your concern (<strong className="text-[#0B1E36]">{selectedOption.concern}</strong>), Dr. Priya's protocol combines targeted medical therapies to deliver visible restoration.
                </p>
              </div>

              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-[#FAF9F6] border border-slate-200 text-xs font-medium text-slate-700">
                <div>Duration: <strong className="text-[#0B1E36]">{selectedOption.duration}</strong></div>
                <div className="w-px h-4 bg-slate-300" />
                <div>Clinical Efficacy: <strong className="text-[#14B8A6]">97%+</strong></div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => onSelectTreatment(selectedOption.treatment)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0B1E36] text-[#DFBA84] font-semibold text-sm px-8 py-3.5 rounded-full shadow-lg hover:bg-[#14B8A6] hover:text-white transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Book {selectedOption.treatment}
                </button>

                <button
                  onClick={handleReset}
                  className="text-xs font-medium text-slate-500 hover:text-[#0B1E36] underline"
                >
                  Retake Diagnostic
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
