'use client';
import React, { useRef, useEffect, useState } from 'react';
import { SparklesCore } from './ui/sparkles';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function HowIBuild() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollAnimation(contentRef, { threshold: 0.2 });

  // Staggered animation state
  const [showHeading, setShowHeading] = useState(false);
  const [showParagraphs, setShowParagraphs] = useState([false, false, false, false]);

  useEffect(() => {
    if (isVisible) {
      setShowHeading(true);
      // Stagger each paragraph by 0.3s
      const timers = [0, 1, 2, 3].map((i) =>
        setTimeout(() => {
          setShowParagraphs((prev) => {
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
    <section id="how-i-build" className="snap-section relative w-full min-h-screen overflow-hidden bg-black">
      {/* Stars Background */}
      <div className="w-full absolute inset-0 h-full z-10">
        <SparklesCore
          id="howIBuildSparkles"
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
          How I Build
        </h2>
        
        <div className="space-y-7 sm:space-y-10">
          <div>
            <h3 className={`text-lg sm:text-xl font-medium border-l-2 sm:border-l-4 border-[#294e90] text-white pl-2 mb-2 sm:mb-3 transition-opacity duration-1000 ${
              showParagraphs[0] ? 'opacity-100' : 'opacity-0'
            }`}>Start with clarity.</h3>
            <p className={`text-base sm:text-lg leading-relaxed text-gray-300 transition-opacity duration-1000 ${
              showParagraphs[0] ? 'opacity-100' : 'opacity-0'
            }`}>
              I don&apos;t rush into code. I first define the problem, understand why it exists, and what success should look like.
            </p>
          </div>
          
          <div>
            <h3 className={`text-lg sm:text-xl font-medium border-l-2 sm:border-l-4 border-[#294e90] text-white pl-2 mb-2 sm:mb-3 transition-opacity duration-1000 ${
              showParagraphs[1] ? 'opacity-100' : 'opacity-0'
            }`}>Build with intent.</h3>
            <p className={`text-base sm:text-lg leading-relaxed text-gray-300 transition-opacity duration-1000 ${
              showParagraphs[1] ? 'opacity-100' : 'opacity-0'
            }`}>
              Every feature has a reason. I focus on clean structure, strong fundamentals, and steady progress instead of quick fixes.
            </p>
          </div>
          
          <div>
            <h3 className={`text-lg sm:text-xl border-l-2 sm:border-l-4 pl-2 border-[#294e90] font-medium text-white mb-2 sm:mb-3 transition-opacity duration-1000 ${
              showParagraphs[2] ? 'opacity-100' : 'opacity-0'
            }`}>Improve through iteration.</h3>
            <p className={`text-base sm:text-lg leading-relaxed text-gray-300 transition-opacity duration-1000 ${
              showParagraphs[2] ? 'opacity-100' : 'opacity-0'
            }`}>
              I test early, learn from mistakes, and refine continuously. Each version is better than the last.
            </p>
          </div>
          
          <div>
            <h3 className={`text-lg sm:text-xl font-medium border-l-2 sm:border-l-4 border-[#294e90] text-white pl-2 mb-2 sm:mb-3 transition-opacity duration-1000 ${
              showParagraphs[3] ? 'opacity-100' : 'opacity-0'
            }`}>Think beyond completion.</h3>
            <p className={`text-base sm:text-lg leading-relaxed text-gray-300 transition-opacity duration-1000 ${
              showParagraphs[3] ? 'opacity-100' : 'opacity-0'
            }`}>
              I build for scalability, usability, and real-world impact—not just to finish, but to last.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
