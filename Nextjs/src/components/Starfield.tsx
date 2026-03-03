"use client";
import React, { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface StarfieldProps {
  starCount?: number;
  speed?: number;
  className?: string;
}

export default function Starfield({ 
  starCount = 400, 
  speed = 0.3,
  className = "" 
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Initialize stars
  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * 1000,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, [starCount]);

  // Draw a star with glow effect
  const drawStar = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    opacity: number
  ) => {
    // Main star point
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();

    // Glow effect for larger stars
    if (size > 1) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(200, 220, 255, ${opacity * 0.2})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Cross flare for bright stars
    if (size > 1.2 && opacity > 0.7) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
      ctx.lineWidth = 0.5;
      
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(x - size * 4, y);
      ctx.lineTo(x + size * 4, y);
      ctx.stroke();
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, y - size * 4);
      ctx.lineTo(x, y + size * 4);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) {
        initStars(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with slight trail effect for motion blur
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      timeRef.current += 0.016; // ~60fps

      starsRef.current.forEach((star) => {
        // Move star towards viewer (z decreases)
        star.z -= speed;

        // Reset star if too close
        if (star.z <= 0) {
          star.z = 1000;
          star.x = Math.random() * width - centerX;
          star.y = Math.random() * height - centerY;
        }

        // Project 3D to 2D
        const perspective = 300 / star.z;
        const screenX = star.x * perspective + centerX;
        const screenY = star.y * perspective + centerY;

        // Calculate size based on distance
        const projectedSize = star.size * perspective;

        // Twinkle effect
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 100 + star.twinkleOffset);
        const twinkleOpacity = star.opacity * (0.7 + twinkle * 0.3);

        // Distance fade (closer = brighter)
        const distanceFade = Math.min(1, (1000 - star.z) / 800);
        const finalOpacity = twinkleOpacity * distanceFade;

        // Only draw if on screen
        if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
          drawStar(ctx, screenX, screenY, Math.min(projectedSize, 3), finalOpacity);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [speed, initStars, drawStar]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
