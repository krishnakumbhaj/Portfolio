'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Github } from 'lucide-react';
import { SparklesCore } from './ui/sparkles';
import Vox_logo_name from '@/app/images/Vox_Logo_name.png';
import Vox_logo from '@/app/images/Vox_Logo.png';
import Sotrian_logo from '@/app/images/Sotrian_logo.png';
import Sotrian_logo_name from '@/app/images/Sotrian_logo_name.png';
import Worklink_logo from '@/app/images/work_link_logo.png';
import Worklink_logo_name from '@/app/images/worklink_name_logo.png';
import Katalyst_logo from '@/app/images/Katalyst_Logo.png';
import Katalyst_logo_name from '@/app/images/Katalyst_Logo_name.png';
import Zella_logo from '@/app/images/Zella_logo.png';
import Zella_logo_name from '@/app/images/Zella_logo_name.png';
import MovieXpert_logo from '@/app/images/MovieXpert_logo.png';
import MovieXpert_logo_name from '@/app/images/MovieXpert_logo_name.png';
import PowerBi_logo from '@/app/images/PowerBi_logo.png';
type ProjectKey = 'Vox' | 'Sotrian' | 'Worklink' | 'Katalyst' | 'Zella' | 'MovieXpert' | 'PowerBi';

interface ProjectContent {
  title: string;
  description: string;
  code: string;
  skills?: string[];
  projectDescription?: string;
  githubLink?: string;
}

const PortfolioProjects = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectKey>('Vox');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayProject, setDisplayProject] = useState<ProjectKey>('Vox');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const projects: ProjectKey[] = useMemo(() => ['Vox', 'Sotrian', 'Worklink', 'Katalyst', 'Zella', 'MovieXpert', 'PowerBi'], []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/tick.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  const playTickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  };

  const changeProject = useCallback((newProject: ProjectKey) => {
    if (newProject !== selectedProject) {
      playTickSound();
      setSelectedProject(newProject);
    }
  }, [selectedProject]);

  const navigateToNextProject = useCallback(() => {
    const currentIndex = projects.indexOf(selectedProject);
    // Wrap around to first project after last one
    const nextIndex = (currentIndex + 1) % projects.length;
    changeProject(projects[nextIndex]);
  }, [selectedProject, projects, changeProject]);

  const navigateToPrevProject = useCallback(() => {
    const currentIndex = projects.indexOf(selectedProject);
    // Wrap around to last project before first one
    const prevIndex = currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
    changeProject(projects[prevIndex]);
  }, [selectedProject, projects, changeProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in the Code section
      const codeSection = document.getElementById('code');
      if (!codeSection) return;

      const rect = codeSection.getBoundingClientRect();
      const isInCodeSection = rect.top <= 100 && rect.bottom >= 100;

      if (isInCodeSection) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToNextProject();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToPrevProject();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, navigateToNextProject, navigateToPrevProject]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return;
      
      const { scrollTop, scrollHeight } = scrollContainer;
      const sectionHeight = scrollHeight / 3; // Each of 3 sections
      
      // If scrolled into third section (scrolling down), jump back to second section
      if (scrollTop >= sectionHeight * 2 - 10) {
        isScrolling = true;
        scrollContainer.scrollTop = scrollTop - sectionHeight;
        setTimeout(() => { isScrolling = false; }, 50);
      }
      // If scrolled into first section (scrolling up), jump to second section
      else if (scrollTop <= sectionHeight + 10) {
        isScrolling = true;
        scrollContainer.scrollTop = scrollTop + sectionHeight;
        setTimeout(() => { isScrolling = false; }, 50);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Start at middle section
    setTimeout(() => {
      if (scrollContainer) {
        const sectionHeight = scrollContainer.scrollHeight / 3;
        scrollContainer.scrollTop = sectionHeight + 50;
      }
    }, 100);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (selectedProject !== displayProject) {
      // Start fade out
      setIsTransitioning(true);
      
      // After fade out (500ms), change content
      setTimeout(() => {
        setDisplayProject(selectedProject);
      }, 500);
      
      // After content change, fade in (complete at 1000ms total)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 600);
    }
  }, [selectedProject, displayProject]);

  const projectContent: Record<ProjectKey, ProjectContent> = {
    Vox: {
      title: 'Vox',
      description: 'An AI-powered web application that enables users to analyze their data effortlessly by simply asking questions in plain English.',
      skills: ['React', 'Node.js', 'Python', 'AI/ML', 'Database'],
      projectDescription: `An AI-powered web application that enables users to analyze their data effortlessly by simply asking questions in plain English. Users can upload datasets in formats like CSV or connect directly to databases, and the system intelligently understands their queries to generate meaningful results. The platform automatically produces interactive tables, visual charts, and clear insights in real time, helping users discover patterns, trends, and key metrics without writing any code. This makes data analysis fast, intuitive, and accessible even for non-technical users, while still being powerful enough for advanced analytical needs.`,
      githubLink: 'https://github.com/krishnakumbhaj/Vox',
      code: `from inspect_ai import task, eval, test
from inspect_ai.dataset import example_dataset
from inspect_ai.scorer import model_graded_fact
from inspect_ai.solver import (
  chain_of_thought, generate, self_critique
)

@task
def theory_of_mind():
  # The task object brings together the dataset, solvers, and
  # scorer
  # And is then evaluated using a model.
  return Task(
    dataset=example_dataset("theory_of_mind"),
    solver=[
      # In this example we are thinking together three standard
      # solver components.
      # It's also possible to create a more complex custom
      # solver that manages state
      # And interreacts internally.
      chain_of_thought(),
      generate(),
      self_critique()
    ],
    scorer=model_graded_fact()
  )`
    },
    Sotrian: {
      title: 'Sotrian',
      description: 'An AI-powered, full-stack platform for intelligent, multi-modal fraud detection across modern digital payment systems.',
      skills: ['Next.js', 'Python', 'LangGraph', 'Scikit-Learn'],
      projectDescription: `Sotrian is an AI-powered, full-stack platform built using Next.js and Python that focuses on intelligent, multi-modal fraud detection across modern digital payment systems. It leverages specialized machine learning models to identify fraudulent activities in areas such as credit card transactions, UPI payments, phishing attacks, and other financial threats by analyzing transactional data, user behavior, and contextual signals. Alongside detection, Sotrian features an AI-driven chat assistant that provides real-time risk advisories, explains alerts in simple language, and helps users make informed security decisions. The platform is designed to be scalable, secure, and easy to use, making advanced fraud prevention accessible to both technical teams and everyday users.`,
      githubLink: 'https://github.com/krishnakumbhaj/Sotrian',
      code: `// Sample code for Project B
const projectB = () => {
  console.log("Project B");
};`
    },
    Worklink: {
      title: 'Worklink',
      description: 'A unified professional platform that connects traditional job seekers and freelancers in one seamless ecosystem.',
      skills: ['Next.js', 'MongoDB', 'TypeScript', 'Tailwind CSS'],
      projectDescription: `WorkLink is a unified professional platform that connects traditional job seekers and freelancers in one seamless ecosystem. It allows users to discover full-time job opportunities as well as short-term freelance projects, while also enabling them to post jobs or tasks themselves. Users can seamlessly switch roles, acting as both a client and a freelancer, which promotes flexibility and collaboration. By bringing multiple work models onto a single platform, WorkLink simplifies hiring, project management, and talent discovery for individuals and businesses alike.`,
      githubLink: 'https://github.com/krishnakumbhaj/Worklink',
      code: `// Sample code for Worklink
const worklink = () => {
  console.log("Worklink");
};`
    },
    Katalyst: {
      title: 'Katalyst',
      description: 'A dedicated platform that enables individuals and teams to list, showcase, and distribute their machine learning models in a centralized marketplace.',
      skills: ['Next.js', 'MongoDB', 'TypeScript', 'Tailwind CSS'],
      projectDescription: `Katalyst is a dedicated platform that enables individuals and teams to list, showcase, and distribute their machine learning models in a centralized marketplace. It allows creators to publish their ML models with detailed descriptions, use cases, and performance metrics, while users can easily discover, compare, and access models suited to their needs. By simplifying model sharing and reuse, Katalyst helps accelerate AI adoption, collaboration, and innovation across the community.`,
      githubLink: 'https://github.com/krishnakumbhaj/Katalyst',
      code: `// Sample code for Katalyst
const katalyst = () => {
  console.log("Katalyst");
};`
    },
    Zella: {
      title: 'Zella',
      description: 'An AI-powered chatbot designed to read, understand, and automatically generate or send emails based on user input.',
      skills: ['Python', 'Langchain', 'Streamlit'],
      projectDescription: `Zella is an AI-powered chatbot designed to read, understand, and automatically generate or send emails based on user input. It can explain email content in simple language, draft professional responses, and manage conversations efficiently. In addition to email automation, Zella acts as a smart conversational assistant, handling user queries and generating accurate, context-aware responses, making everyday communication faster and more effortless.`,
      githubLink: 'https://github.com/krishnakumbhaj/ZELLA',
      code: `// Sample code for Project E
const projectE = () => {
  console.log("Project E");
};`
    },
    MovieXpert: {
      title: 'MovieXpert',
      description: 'A machine learning–based recommendation system that analyzes user preferences to suggest movies tailored to individual tastes.',
      skills: ['Python', 'Streamlit', 'Scikit-learn'],
      projectDescription: `MovieXpert is a machine learning–based recommendation system that analyzes user preferences to suggest movies tailored to individual tastes. It learns from user behavior, ratings, and viewing patterns to deliver personalized recommendations across different genres and styles. By combining data analysis with intelligent prediction models, MovieXpert helps users discover movies that match their interests quickly and accurately.`,
      githubLink: 'https://github.com/krishnakumbhaj/MovieXpert',
      code: `// Sample code for Project F
const projectF = () => {
  console.log("Project F");
};`
    },
    PowerBi: {
      title: 'PowerBi Projects',
      description: 'A collection of interactive Power BI dashboards built to analyze and visualize real-world datasets.',
      skills: ['Power BI', 'Data Visualization', 'Data Analysis'],
      projectDescription: `This project is a collection of interactive Power BI dashboards built to analyze and visualize real-world datasets, including online course performance, pizza sales trends, credit card transactions, and Blinkit operational data. Each dashboard transforms raw data into meaningful insights through dynamic visuals, KPIs, and filters, helping users understand sales performance, customer behavior, revenue patterns, and transaction trends. The dashboards are designed to support data-driven decision-making by presenting complex information in a clear, intuitive, and actionable manner.`,
      githubLink: 'https://github.com/krishnakumbhaj/Pizza_Sales_Dashboard',
      code: `// Sample code for PowerBi
const powerbi = () => {
  console.log("PowerBi");
};`
    }
  };

  return (
    <div id="code" className='snap-section px-4 sm:px-8 md:px-16 py-5 bg-black relative overflow-hidden min-h-screen'>
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-full">
        <SparklesCore
          id="codeSparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          speed={0.5}
          particleDensity={20}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="flex flex-col md:flex-row h-screen bg-transparent text-neutral-300 relative z-10 gap-4 md:gap-0">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 bg-neutral-900 backdrop-blur-sm rounded-3xl max-h-[40vh] md:max-h-[70vh] self-start mt-4 md:mt-8 overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-neutral-900 z-10 p-4 sm:p-6 pb-3 sm:pb-4">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-200">Projects</h2>
          </div>
          <div 
            ref={scrollContainerRef} 
            className="overflow-y-auto scrollbar-hide px-4 sm:px-6 pb-4 sm:pb-6"
          >
            <div className="space-y-2">
              {/* Render 3 times for infinite scroll */}
              {[0, 1, 2].map((setIndex) => (
                <React.Fragment key={setIndex}>
                  {/* Github Link */}
                  <a
                    href="https://github.com/krishnakumbhaj/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl transition-colors flex items-center gap-2 sm:gap-3 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  >
                    <Github size={24} className="rounded-lg sm:w-[30px] sm:h-[30px]" />
                    <span className="text-xs sm:text-sm font-medium">Github</span>
                  </a>
                  
                  {/* Projects */}
                  {projects.map((project) => (
                    <button
                      key={`${setIndex}-${project}`}
                      onClick={() => changeProject(project)}
                className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-3xl transition-colors flex items-center gap-2 sm:gap-3 ${
                  selectedProject === project
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                {project === 'Vox' ? (
                  <>
                    <Image
                      src={Vox_logo}
                      alt="Vox Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={Vox_logo_name}
                      alt="Vox Logo Name"
                      width={60}
                      height={25}
                      className="object-contain"
                    />
                  </>
                ) : project === 'Sotrian' ? (
                  <>
                    <Image
                      src={Sotrian_logo}
                      alt="Sotrian Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={Sotrian_logo_name}
                      alt="Sotrian Logo Name"
                      width={60}
                      height={25}
                      className="object-contain"
                    />
                  </>
                ) : project === 'Worklink' ? (
                  <>
                    <Image
                      src={Worklink_logo}
                      alt="Worklink Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={Worklink_logo_name}
                      alt="Worklink Logo Name"
                      width={70}
                      height={70}
                      className="object-contain"
                    />
                  </>
                ) : project === 'Katalyst' ? (
                  <>
                    <Image
                      src={Katalyst_logo}
                      alt="Katalyst Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={Katalyst_logo_name}
                      alt="Katalyst Logo Name"
                      width={60}
                      height={40}
                      className="object-contain"
                    />
                  </>
                ) : project === 'Zella' ? (
                  <>
                    <Image
                      src={Zella_logo}
                      alt="Zella Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={Zella_logo_name}
                      alt="Zella Logo Name"
                      width={60}
                      height={25}
                      className="object-contain"
                    />
                  </>
                ) : project === 'MovieXpert' ? (
                  <>
                    <Image
                      src={MovieXpert_logo}
                      alt="MovieXpert Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <Image
                      src={MovieXpert_logo_name}
                      alt="MovieXpert Logo Name"
                      width={70}
                      height={35}
                      className="object-contain"
                    />
                  </>
                ) : project === 'PowerBi' ? (
                  <>
                    <Image
                      src={PowerBi_logo}
                      alt="PowerBi Logo"
                      width={30}
                      height={30}
                      className="rounded-lg"
                    />
                    <span className="text-sm font-medium">PowerBi Projects</span>
                  </>
                ) : (
                  project
                )}
              </button>
            ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-transparent scrollbar-hide">
          <div 
            className="max-w-4xl transition-opacity duration-500 ease-in-out"
            style={{ opacity: isTransitioning ? 0.3 : 1 }}
          >
            <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 mt-2 sm:mt-4 h-12 sm:h-16">
              {displayProject === 'Vox' && (
                <Image
                  src={Vox_logo_name}
                  alt="Vox Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'Sotrian' && (
                <Image
                  src={Sotrian_logo_name}
                  alt="Sotrian Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'Worklink' && (
                <Image
                  src={Worklink_logo_name}
                  alt="Worklink Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'Katalyst' && (
                <Image
                  src={Katalyst_logo_name}
                  alt="Katalyst Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'Zella' && (
                <Image
                  src={Zella_logo_name}
                  alt="Zella Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'MovieXpert' && (
                <Image
                  src={MovieXpert_logo_name}
                  alt="MovieXpert Logo"
                  width={120}
                  height={48}
                  className="object-contain sm:w-[150px] sm:h-[60px]"
                />
              )}
              {displayProject === 'PowerBi' && (
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  PowerBi Projects
                </h1>
              )}
            </div>
            
            <p className="text-neutral-400 mb-4 sm:mb-6 leading-relaxed line-clamp-3 text-sm sm:text-base">
              {projectContent[displayProject].description}
            </p>

            {/* Skills Section */}
            {projectContent[displayProject].skills && (
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-between">
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {projectContent[displayProject].skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-900 text-neutral-300 rounded-3xl text-xs sm:text-sm border border-neutral-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  {/* Project Logo */}
                  <div className="ml-auto hidden sm:block">
                    {displayProject === 'Vox' && (
                      <Image
                        src={Vox_logo}
                        alt="Vox Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'Sotrian' && (
                      <Image
                        src={Sotrian_logo}
                        alt="Sotrian Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'Worklink' && (
                      <Image
                        src={Worklink_logo}
                        alt="Worklink Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'Katalyst' && (
                      <Image
                        src={Katalyst_logo}
                        alt="Katalyst Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'Zella' && (
                      <Image
                        src={Zella_logo}
                        alt="Zella Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'MovieXpert' && (
                      <Image
                        src={MovieXpert_logo}
                        alt="MovieXpert Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                    {displayProject === 'PowerBi' && (
                      <Image
                        src={PowerBi_logo}
                        alt="PowerBi Logo"
                        width={60}
                        height={60}
                        className="rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Project Description Block */}
            <div className="bg-transparent rounded-3xl p-4 sm:p-6 border-r border-neutral-800">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-sm sm:text-base">{"</>"}</span>
                  {projectContent[displayProject].githubLink ? (
                    <a
                      href={projectContent[displayProject].githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#6a8dca] text-sm sm:text-base font-semibold hover:text-blue-300 transition-colors"
                    >
                      Repo Link
                    </a>
                  ) : (
                    <span className="text-neutral-400 text-sm sm:text-base">Python</span>
                  )}
                </div>
                <button className="text-neutral-500 hover:text-neutral-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="text-sm sm:text-base md:text-lg text-neutral-300 leading-relaxed">
                {projectContent[displayProject].projectDescription || projectContent[displayProject].code}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioProjects;