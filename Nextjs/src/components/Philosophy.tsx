'use client';
import React, { useRef } from 'react';
import { SparklesCore } from './ui/sparkles';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function Philosophy() {
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollAnimation(contentRef, { threshold: 0.2 });

  return (
    <section id="philosophy" className="snap-section relative w-full min-h-screen overflow-hidden bg-black">
      {/* Stars Background */}
      <div className="w-full absolute inset-0 h-full z-10">
        <SparklesCore
          id="philosophySparkles"
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
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          My Perspective
        </h2>
        
        <div className="space-y-5 sm:space-y-7">
          <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 delay-200 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            I believe curiosity is the foundation of growth. Learning new technologies and understanding how things work keeps me moving forward and prevents stagnation. For me, progress starts with asking the right questions.
          </p>
          
          <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 delay-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            I value discipline, consistency, and depth over shortcuts. I prefer building strong fundamentals and improving step by step, knowing that real mastery comes from practice, failure, and refinement.
          </p>
          
          <p className={`text-base sm:text-lg leading-relaxed border-l-2 sm:border-l-4 border-[#294e90] pl-3 sm:pl-4 text-gray-300 transition-opacity duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            My goal is to create meaningful impact through technology. Every project I work on is not just about completion, but about solving real problems and becoming better than I was yesterday.
          </p>
        </div>
      </div>
    </section>
  );
}