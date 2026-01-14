"use client";
import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

export default function GrokLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      "rgba(96, 165, 250, 0.15)",
      "rgba(59, 130, 246, 0.12)",
      "rgba(147, 197, 253, 0.1)",
      "rgba(191, 219, 254, 0.08)",
      "rgba(219, 234, 254, 0.06)",
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
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Animated wavy background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ filter: "blur(40px)" }}
      />

      {/* Right side intense light bloom */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
        <div
          className="absolute top-1/4 right-0 w-[900px] h-[900px] rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(200, 220, 255, 0.6) 15%, rgba(100, 150, 255, 0.35) 30%, rgba(50, 100, 200, 0.15) 45%, transparent 65%)",
            filter: "blur(80px)",
            transform: "translate(35%, -25%)",
          }}
        ></div>

        <div
          className="absolute top-1/4 right-0 w-[1100px] h-[1100px] rounded-full opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(150, 180, 255, 0.4) 0%, rgba(80, 120, 200, 0.25) 25%, rgba(40, 80, 150, 0.12) 45%, transparent 60%)",
            filter: "blur(100px)",
            transform: "translate(25%, -20%)",
          }}
        ></div>

        <div
          className="absolute top-0 right-0 w-[1300px] h-full opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 75% 35%, rgba(100, 140, 220, 0.25) 0%, rgba(50, 80, 150, 0.1) 35%, transparent 55%)",
            filter: "blur(120px)",
          }}
        ></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className="text-center">
          <h1 className="text-[12rem] font-bold tracking-tight leading-none select-none">
            <span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, #9CA3AF 0%, #6B7280 50%, #4B5563 100%)",
                textShadow: `
                  0 3px 0 rgba(0, 0, 0, 0.4),
                  0 8px 15px rgba(0, 0, 0, 0.5),
                  0 15px 30px rgba(0, 0, 0, 0.4),
                  0 20px 50px rgba(59, 130, 246, 0.3)
                `,
                filter:
                  "drop-shadow(0 5px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 40px rgba(96, 165, 250, 0.2))",
              }}
            >
              Grok
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}