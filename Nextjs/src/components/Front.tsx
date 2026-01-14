"use client";
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { SparklesCore } from "./ui/sparkles";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Front() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = useScrollAnimation(contentRef, { threshold: 0.1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (ctx.canvas.width = window.innerWidth);
    let h = (ctx.canvas.height = window.innerHeight);
    ctx.filter = "blur(40px)";

    const noise = createNoise3D();
    let nt = 0;

    const waveColors = [
      "rgba(255, 255, 255, 0.08)",
      "rgba(245, 243, 255, 0.06)",
      "rgba(237, 233, 254, 0.05)",
      "rgba(221, 214, 254, 0.04)",
      "rgba(196, 181, 253, 0.03)",
    ];

    const drawWave = (n: number) => {
      nt += 0.0015;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = 80;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 600, 0.5 * i, nt) * 150;
          ctx.lineTo(x, y + h * 0.4);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };

    let animationId: number;
    const render = () => {
      ctx.fillStyle = "black";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, w, h);
      drawWave(5);
      animationId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = "blur(40px)";
    };

    window.addEventListener("resize", handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div id="front" className="snap-section relative w-full h-screen overflow-hidden bg-black">
      {/* Stars Background - everywhere with less density */}
      <div className="w-full absolute inset-0 h-full z-20">
        <SparklesCore
          id="frontSparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1.4}
          particleDensity={20}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Animated wavy background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ filter: "blur(40px)" }}
      />

      {/* Right side white with purple glow - on top of stars */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-20">
        {/* Main white core with purple hint */}
        <div
          className="absolute top-[15%] right-0 w-[1000px] h-[700px] rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(250, 248, 255, 0.45) 10%, rgba(245, 243, 255, 0.3) 20%, rgba(237, 233, 254, 0.18) 30%, rgba(221, 214, 254, 0.08) 45%, rgba(196, 181, 253, 0.03) 60%, transparent 75%)",
            filter: "blur(70px)",
            transform: "translate(40%, -30%) scale(1.2, 0.8)",
            borderRadius: "45% 55% 50% 50% / 40% 45% 55% 60%",
          }}
        ></div>

        {/* Secondary white-purple layer */}
        <div
          className="absolute top-[12%] right-0 w-[1200px] h-[800px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255, 255, 255, 0.5) 0%, rgba(250, 248, 255, 0.35) 15%, rgba(237, 233, 254, 0.2) 30%, rgba(221, 214, 254, 0.1) 45%, rgba(196, 181, 253, 0.04) 60%, transparent 75%)",
            filter: "blur(100px)",
            transform: "translate(30%, -25%) rotate(-10deg)",
            borderRadius: "40% 60% 55% 45% / 50% 40% 60% 50%",
          }}
        ></div>

        {/* Outer soft glow */}
        <div
          className="absolute top-0 right-0 w-[1400px] h-[80vh] opacity-35"
          style={{
            background:
              "radial-gradient(ellipse at 85% 25%, rgba(255, 255, 255, 0.3) 0%, rgba(245, 243, 255, 0.18) 20%, rgba(237, 233, 254, 0.1) 35%, rgba(221, 214, 254, 0.04) 50%, rgba(196, 181, 253, 0.02) 65%, transparent 80%)",
            filter: "blur(150px)",
            borderRadius: "50% 50% 45% 55% / 45% 50% 50% 55%",
          }}
        ></div>

        {/* Animated subtle overlay */}
        <div
          className="absolute top-[15%] right-0 w-[1100px] h-[750px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse, rgba(255, 255, 255, 0.4) 0%, rgba(250, 248, 255, 0.25) 25%, rgba(237, 233, 254, 0.12) 50%, transparent 70%)",
            filter: "blur(120px)",
            transform: "translate(35%, -28%) scale(1.1, 0.75)",
            borderRadius: "48% 52% 47% 53% / 45% 50% 50% 55%",
          }}
        ></div>

        {/* Bottom fade overlay */}
        <div
          className="absolute bottom-0 right-0 w-full h-[40vh]"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.8) 20%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        ></div>
      </div>

      {/* Main content */}
      <div ref={contentRef} className="relative z-30 flex items-center justify-center w-full h-full px-6 sm:px-12 md:px-16">
        <div className="max-w-3xl">
          <h1 className={`text-4xl sm:text-5xl md:text-6xl border-l-4 sm:border-l-8 pl-2 border-[#294e90] font-bold tracking-tight leading-tight mb-4 sm:mb-5 text-white transition-opacity duration-1000 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            Krishna Sharma
          </h1>
          
          <p className={`text-base sm:text-lg md:text-xl text-white font-medium mb-4 sm:mb-6 leading-relaxed transition-opacity duration-1000 delay-200 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            Building intelligent systems with data, code, and curiosity
          </p>
          
          <p className={`text-sm sm:text-base text-white leading-relaxed mb-4 sm:mb-5 transition-opacity duration-1000 delay-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            I&apos;m a B.Tech Data Science student and software engineer who enjoys turning complex ideas into clean, working products. My interests sit around full-stack development, machine learning, and agent-driven AI systems — especially where data meets real-world impact.
          </p>
          
          <p className={`text-sm sm:text-base text-white leading-relaxed transition-opacity duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            I like working close to the fundamentals: systems, logic, data flow, and scalability. For me, engineering is less about pressure and more about clarity and craftsmanship.
          </p>
        </div>
      </div>
    </div>
  );
}