'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import Code from '@/components/Code';
import Front from '@/components/Front';
import Philosophy from '@/components/Philosophy';
import HowIBuild from '@/components/HowIBuild';
import ActiveFocus from '@/components/ActiveFocus';
import Starfield from '@/components/Starfield';
import Logo from '@/Images/logo.png';


const ScrollIndicator = ({ activeSection, onSectionClick }: { 
  activeSection: string; 
  onSectionClick: (sectionId: string) => void;
}) => {
  const sections = [
    { id: 'front', label: 'Home', isMain: true },
    { id: 'philosophy', label: 'Perspective', isMain: true },
    { id: 'code', label: 'Code', isMain: true },
    { id: 'how-i-build', label: 'Process', isMain: true },
    { id: 'active-focus', label: 'Focus', isMain: true },
    { id: 'footer', label: 'Contact', isMain: true }
  ];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-1.5 hidden md:flex">
      {sections.map((section) => (
        <div
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`group relative cursor-pointer transition-all duration-300 rounded-sm ${
            section.isMain ? 'h-0.5' : 'h-0.5 ml-2.5'
          } ${
            activeSection === section.id
              ? section.isMain 
                ? 'w-5 bg-[#294e90] opacity-100' 
                : 'w-3.5 bg-[#294e90] opacity-100'
              : section.isMain
              ? 'w-4 bg-white/30 hover:bg-white/70 opacity-50 hover:opacity-100'
              : 'w-2.5 bg-white/30 hover:bg-white/70 opacity-50 hover:opacity-100'
          }`}
        >
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-mono text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
            {section.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const Page = () => {
  const [activeSection, setActiveSection] = useState('front');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => ['front', 'philosophy', 'code', 'how-i-build', 'active-focus', 'footer'], []);

  // Handle scroll snap detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrolling) return;
      
      const scrollTop = container.scrollTop;
      const sectionHeight = window.innerHeight;
      const currentIndex = Math.round(scrollTop / sectionHeight);
      const currentSection = sections[Math.min(currentIndex, sections.length - 1)];
      
      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections, activeSection, isScrolling]);

  const scrollToSection = useCallback((sectionId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const sectionIndex = sections.indexOf(sectionId);
    if (sectionIndex === -1) return;
    
    setIsScrolling(true);
    setActiveSection(sectionId);
    
    container.scrollTo({
      top: sectionIndex * window.innerHeight,
      behavior: 'smooth'
    });
    
    // Reset scrolling flag after animation
    setTimeout(() => setIsScrolling(false), 800);
  }, [sections]);

  const navigateToNextSection = useCallback(() => {
    const currentIndex = sections.findIndex(s => s === activeSection);
    if (currentIndex < sections.length - 1) {
      scrollToSection(sections[currentIndex + 1]);
    }
  }, [activeSection, sections, scrollToSection]);

  const navigateToPrevSection = useCallback(() => {
    const currentIndex = sections.findIndex(s => s === activeSection);
    if (currentIndex > 0) {
      scrollToSection(sections[currentIndex - 1]);
    }
  }, [activeSection, sections, scrollToSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToNextSection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToPrevSection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToNextSection, navigateToPrevSection]);

  return (
    <div className="relative bg-black">
      {/* Global Starfield Background */}
      <Starfield starCount={350} speed={0.2} />
      
      {/* Scroll Indicator */}
      <ScrollIndicator 
        activeSection={activeSection} 
        onSectionClick={scrollToSection}
      />
      
      {/* Snap Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        <Front />
        <Philosophy />
        <Code />
        <HowIBuild />
        <ActiveFocus />
        <Footer />
      </div>

      {/* SIA Chat FAB — fixed bottom-right */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-0 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl shadow-black/50 hover:border-[#cde7c1]/30 hover:shadow-[#cde7c1]/10 transition-all duration-300 hover:scale-105 active:scale-95 pr-1"
      >
        <div className="flex items-center">
          <Image
            src={Logo}
            alt="SIA"
            className="w-12 h-12 object-cover rounded-full"
          />
         
        </div>
      </Link>
    </div>
  );
};

export default Page; 