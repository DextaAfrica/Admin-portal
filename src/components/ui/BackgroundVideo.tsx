"use client";

import * as React from "react";
import { Play, Pause, Video, Eye, Construction } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackgroundVideoProps {
  className?: string;
  overlayOpacity?: string;
}

export function BackgroundVideo({
  className,
  overlayOpacity = "bg-black/60 dark:bg-black/75",
}: BackgroundVideoProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(true);
  const [hasVideoLoaded, setHasVideoLoaded] = React.useState(false);

  // Procedural Construction Wireframe & Particle Grid Engine
  // Guarantees an authentic moving architectural construction backdrop even when offline
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Construction nodes & crane structural vectors
    const points: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    const count = Math.min(Math.floor((width * height) / 18000), 70);

    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
      });
    }

    let scanLineY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep obsidian void base
      ctx.fillStyle = "#07080b";
      ctx.fillRect(0, 0, width, height);

      // Moving Laser Construction Scanline
      scanLineY = (scanLineY + 0.8) % height;
      const grad = ctx.createLinearGradient(0, scanLineY - 40, 0, scanLineY + 40);
      grad.addColorStop(0, "rgba(225, 29, 72, 0)");
      grad.addColorStop(0.5, "rgba(225, 29, 72, 0.12)");
      grad.addColorStop(1, "rgba(225, 29, 72, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanLineY - 40, width, 80);

      // Structural truss lines connecting nodes
      ctx.lineWidth = 0.75;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw node
        ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.18;
            ctx.strokeStyle = `rgba(225, 29, 72, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none select-none z-0", className)}>
      {/* 1. Procedural High-Tech Construction Canvas (Always renders, zero latency) */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

      {/* 2. Construction Video Layer (Fades in over canvas when video stream is active) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onPlaying={() => setHasVideoLoaded(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
          hasVideoLoaded ? "opacity-40" : "opacity-0"
        )}
      >
        <source src="https://cdn.coverr.co/videos/coverr-construction-site-in-the-city-4389/1080p.mp4" type="video/mp4" />
      </video>

      {/* 3. Cyber Blueprint Architectural Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"
      />

      {/* 4. Cinematic Dark Vignette Overlay */}
      <div className={cn("absolute inset-0 backdrop-blur-[1px]", overlayOpacity)} />

      {/* 5. Bottom Ambient Radial Red Burn */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-black/30" />

      {/* Live Background Feed Indicator & Toggle */}
      <div className="absolute bottom-4 right-4 pointer-events-auto z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-mono text-white/80 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <Construction className="h-3 w-3 text-red-500" />
          <span>Construction Visuals Active</span>
        </div>
      </div>
    </div>
  );
}
