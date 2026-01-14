'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Footer from '@/components/Footer';
import Code from '@/components/Code';
import Front from '@/components/Front';
import Philosophy from '@/components/Philosophy';
import HowIBuild from '@/components/HowIBuild';
import ActiveFocus from '@/components/ActiveFocus';

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
  const sections = useMemo(() => ['front', 'philosophy', 'code', 'how-i-build', 'active-focus', 'footer'], []);

  useEffect(() => {
    const handleScroll = () => {
      let current = 'front';

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in the viewport (with 100px threshold)
          if (rect.top <= 100 && rect.bottom >= 100) {
            current = sectionId;
            break;
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateToNextSection = useCallback(() => {
    const currentIndex = sections.findIndex(s => s === activeSection);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      scrollToSection(nextSection);
    }
  }, [activeSection, sections]);

  const navigateToPrevSection = useCallback(() => {
    const currentIndex = sections.findIndex(s => s === activeSection);
    if (currentIndex > 0) {
      const prevSection = sections[currentIndex - 1];
      scrollToSection(prevSection);
    }
  }, [activeSection, sections]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
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
  }, [activeSection, navigateToNextSection, navigateToPrevSection]);

  return (
    <div className="relative">
      <ScrollIndicator 
        activeSection={activeSection} 
        onSectionClick={scrollToSection}
      />
      <Front />
      <Philosophy />
      <Code />
      <HowIBuild />
      <ActiveFocus />
      <Footer />
    </div>
  );
};

export default Page; 