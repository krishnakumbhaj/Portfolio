'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Notify from '@/app/images/Notify.png';
import { SparklesCore } from './ui/sparkles';
import Gmail from '@/app/images/Gmail.webp';
import Instagram from '@/app/images/Instagram.jpg';
import LinkedIn from '@/app/images/Linkedin.webp';
import X from '@/app/images/X.jpg';

const ComingSoonPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setMessage('Please enter your email');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/subscribe-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setMessage(data.message);
        setEmail('');
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
        }, 5000);
      } else {
        setMessage(data.message || 'Failed to submit email');
      }
    } catch {
      setMessage('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div id="footer" className="snap-section min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          speed={0.2}
          particleDensity={20}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-8 sm:space-y-12">
          {/* Heading */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide">
              Available for Work
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed px-4 sm:px-0">
            Interested in hiring or collaborating? Share your email below and I&apos;ll be in touch. I&apos;m currently exploring new opportunities and would love to connect.

            </p>
          </div>

          {/* Paper Plane Icon */}
            <div className="inline-block transform hover:scale-110 transition-transform duration-300 cursor-pointer">
                        <Image
                        src={Notify}
                        alt="Paper Plane Icon"
                        width={80}
                        height={40}
                        className="mx-auto sm:w-[100px] sm:h-[50px]"
                      />
            </div>
            
           {/* Email Subscription */}
         <div className="space-y-4">
          
            <div className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3 px-4 sm:px-0">
              <div className="flex-1">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Email *"
                  required
                  disabled={isLoading}
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-transparent border-2 border-white text-white placeholder-gray-200 text-xs sm:text-sm focus:outline-none focus:border-[#294e90] transition-all rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading || submitted}
                className="px-6 sm:px-8 py-2.5 sm:py-2 bg-[#294e90] hover:bg-[#1e3a6d] text-white text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap shadow-lg shadow-cyan-900/50 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : submitted ? 'Subscribed!' : 'Connect'}
              </button>
            </div>
            {message && (
              <p className={`text-center text-sm ${message.includes('success') || submitted ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-gray-400">
          {/* Left: Social Media Icons */}
          <div className="flex gap-4 sm:gap-6 items-center sm:flex-1 justify-center sm:justify-start">
            <a href="https://www.instagram.com/krishna.kumbhaj/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
              <Image
                src={Instagram}
                alt="Instagram"
                width={32}
                height={32}
                className="rounded-full object-cover sm:w-[40px] sm:h-[40px]"
              />
            </a>
            <a href="https://www.linkedin.com/in/krishna-sharma-92a441279/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
              <Image
                src={LinkedIn}
                alt="LinkedIn"
                width={48}
                height={48}
                className="rounded-full object-cover sm:w-[60px] sm:h-[60px]"
              />
            </a>
            <a href="https://x.com/KrishnaSha33073" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform duration-300">
              <Image
                src={X}
                alt="X"
                width={32}
                height={32}
                className="rounded-full object-cover sm:w-[40px] sm:h-[40px]"
              />
            </a>
          </div>
          {/* Center: Gmail */}
          <div className="flex justify-center py-3 sm:py-5 sm:flex-1">
            <a href="mailto:krishnakumbhaj@gmail.com" className="hover:scale-110 transition-transform duration-300">
              <Image
                src={Gmail}
                alt="Gmail"
                width={32}
                height={32}
                className="rounded-full object-cover sm:w-[40px] sm:h-[40px]"
              />
            </a>
          </div>
          {/* Right: Copyright */}
          <div className="sm:flex-1 flex justify-center sm:justify-end select-none hover:scale-110 transition-transform duration-300 text-center">
            © 2025 Krishnakumbhaj. Crafted with React & Next.js
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoonPage;