'use client';
import React, { useRef, useEffect, useState } from 'react';
import { SparklesCore } from './ui/sparkles';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function ActiveFocus() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollAnimation(contentRef, { threshold: 0.2 });

  // Staggered animation state
  const [showHeading, setShowHeading] = useState(false);
  const [showSections, setShowSections] = useState([false, false, false]);

  useEffect(() => {
    if (isVisible) {
      setShowHeading(true);
      // Stagger each section by 0.3s
      const timers = [0, 1, 2].map((i) =>
        setTimeout(() => {
          setShowSections((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 600 + i * 300)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [isVisible]);

  return (
    <section id="active-focus" className="snap-section relative w-full min-h-screen overflow-hidden bg-black">
      {/* Stars Background */}
      <div className="w-full absolute inset-0 h-full z-10">
        <SparklesCore
          id="activeFocusSparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1.4}
          particleDensity={20}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-20 max-w-3xl mx-auto px-6 sm:px-8 py-16 sm:py-20 flex flex-col justify-center min-h-screen">
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-10 sm:mb-16 pb-0 sm:pb-4 border-b-0 sm:border-b border-[#294e90] text-white transition-opacity duration-1000 ${
          showHeading ? 'opacity-100' : 'opacity-0'
        }`}>
          Active Focus
        </h2>
        
        <div className="space-y-7 sm:space-y-10">
          <div className="space-y-2 sm:space-y-3">
            <h3 className={`text-lg sm:text-xl font-medium text-[#4a7ac5] mb-3 sm:mb-4 transition-opacity duration-1000 ${
              showSections[0] ? 'opacity-100' : 'opacity-0'
            }`}>
              Learning Focus
            </h3>
            <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 ${
              showSections[0] ? 'opacity-100' : 'opacity-0'
            }`}>
              Deepening my understanding of machine learning and deep learning, with hands-on practice in data analysis, model training, and evaluation. Exploring how intelligent systems behave in real-world scenarios.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className={`text-lg sm:text-xl font-medium text-[#4a7ac5] mb-3 sm:mb-4 transition-opacity duration-1000 ${
              showSections[1] ? 'opacity-100' : 'opacity-0'
            }`}>
              Building & Exploring
            </h3>
            <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 ${
              showSections[1] ? 'opacity-100' : 'opacity-0'
            }`}>
              Actively working on AI- and data-driven projects, experimenting with recommendation systems, dashboards, and early agentic AI ideas. Turning concepts into practical, working prototypes.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className={`text-lg sm:text-xl font-medium text-[#4a7ac5] mb-3 sm:mb-4 transition-opacity duration-1000 ${
              showSections[2] ? 'opacity-100' : 'opacity-0'
            }`}>
              Current Direction
            </h3>
            <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 ${
              showSections[2] ? 'opacity-100' : 'opacity-0'
            }`}>
              Sharpening my path toward becoming a Data Analyst and AI Engineer by consistently building, learning, and refining projects that create real impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
