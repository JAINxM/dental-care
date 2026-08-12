import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, ChevronsLeftRight, Layers } from 'lucide-react';

const GALLERY_DATA = [
  {
    id: 1,
    title: 'Severe Inflammatory Acne Scars',
    category: 'Acne & Scars',
    desc: 'Treated over 4 sessions of non-ablative RF Microneedling and Mandelic peels.',
    beforeImg: '/images/acne_before.png',
    afterImg: '/images/acne_after.png',
    beforeLabel: 'Active redness & texture',
    afterLabel: 'Completely smoothed glass skin'
  },
  {
    id: 2,
    title: 'Melasma & Sun Spot Correction',
    category: 'Pigmentation',
    desc: 'Cleared using Q-Switched Nd:YAG laser toning and botanical micro-infusions.',
    beforeImg: '/images/melasma_before.png',
    afterImg: '/images/melasma_after.png',
    beforeLabel: 'Patchy cheek melasma',
    afterLabel: 'Bright, uniform radiant glow'
  }
];

export default function BeforeAfterSlider() {
  const [activeCase, setActiveCase] = useState(GALLERY_DATA[0]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  }, [isDragging, handleMove]);

  const handleStart = () => setIsDragging(true);
  const handleStop = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleStop);
      window.addEventListener('touchend', handleStop);
    }
    return () => {
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchend', handleStop);
    };
  }, [isDragging]);

  return (
    <section id="gallery" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] font-semibold text-xs uppercase tracking-widest">
            <Layers className="w-4 h-4" />
            Verified Clinical Results
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B1E36]">
            Real Patient Transformations
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto font-light text-base">
            Drag the golden slider to compare untreated skin condition with post-protocol clinical restoration.
          </p>
        </div>

        {/* Case Switcher Tabs */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {GALLERY_DATA.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveCase(item);
                setSliderPosition(50);
              }}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all ${
                activeCase.id === item.id
                  ? 'bg-[#0B1E36] text-[#DFBA84] shadow-md'
                  : 'bg-[#FAF9F6] text-slate-600 border border-slate-200 hover:border-[#DFBA84]'
              }`}
            >
              {item.category}: {item.title}
            </button>
          ))}
        </div>

        {/* Interactive Comparison Slider */}
        <div className="max-w-4xl mx-auto">
          <div 
            ref={containerRef} 
            className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl select-none touch-none cursor-ew-resize border border-[#DFBA84]/30 z-10 no-select bg-slate-900"
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* Before View (Bottom Layer) */}
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={activeCase.beforeImg} 
                alt="Before treatment" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-[#0B1E36]/10" />
              <span className="absolute bottom-5 left-5 bg-[#0B1E36]/90 text-white font-sans font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-md">
                Before: {activeCase.beforeLabel}
              </span>
            </div>

            {/* After View (Top Layer - Dynamic Width Clip) */}
            <div 
              className="absolute inset-0 overflow-hidden border-r-2 border-[#DFBA84] select-none z-10" 
              style={{ width: `${sliderPosition}%` }}
            >
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
              >
                <img 
                  src={activeCase.afterImg} 
                  alt="After treatment" 
                  className="w-full h-full object-cover" 
                />
                <span className="absolute bottom-5 left-5 bg-[#14B8A6]/95 text-white font-sans font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-md">
                  After: {activeCase.afterLabel}
                </span>
              </div>
            </div>

            {/* Golden Tactile Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#DFBA84] via-white to-[#DFBA84] flex items-center justify-center z-30 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-white text-[#0B1E36] border-2 border-[#DFBA84] shadow-xl flex items-center justify-center pointer-events-auto hover:scale-110 active:scale-95 transition-transform">
                <ChevronsLeftRight className="w-5 h-5 text-[#DFBA84]" />
              </div>
            </div>

          </div>

          <div className="mt-6 text-center text-xs text-slate-500 font-light">
            💡 {activeCase.desc}
          </div>
        </div>

      </div>
    </section>
  );
}
