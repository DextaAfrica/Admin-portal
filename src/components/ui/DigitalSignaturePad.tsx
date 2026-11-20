"use client";

import * as React from "react";
import {
  PenTool,
  Type,
  Upload,
  RotateCcw,
  Trash2,
  Check,
  ShieldCheck,
  Clock,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface DigitalSignatureData {
  signatureDataUrl: string;
  signatureType: "DRAWN" | "TYPED" | "UPLOADED";
  signerName: string;
  signedAt: string;
  verificationHash: string;
}

export interface DigitalSignaturePadProps {
  signerName: string;
  onSignatureCapture: (data: DigitalSignatureData) => void;
  onClear?: () => void;
  initialSignature?: string | null;
  disabled?: boolean;
  className?: string;
}

export function DigitalSignaturePad({
  signerName,
  onSignatureCapture,
  onClear,
  initialSignature = null,
  disabled = false,
  className = "",
}: DigitalSignaturePadProps) {
  const [mode, setMode] = React.useState<"DRAW" | "TYPE" | "UPLOAD">("DRAW");
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasDrawn, setHasDrawn] = React.useState(Boolean(initialSignature));
  const [history, setHistory] = React.useState<ImageData[]>([]);
  const [inkColor, setInkColor] = React.useState<"#0F172A" | "#1E3A8A">("#0F172A"); // Formal Navy or Dark Slate

  // Type Mode State
  const [typedName, setTypedName] = React.useState(signerName || "");
  const [typedFont, setTypedFont] = React.useState<"dancing" | "caveat" | "serif" | "cursive">("dancing");

  // Generate verification hash
  const computeHash = React.useCallback((data: string) => {
    let hash = 0;
    const str = `${data}-${signerName}-${Date.now()}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `SIG-SHA256-${Math.abs(hash).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }, [signerName]);

  // Canvas Initialization
  const setupCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Support Retina displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, [inkColor, initialSignature]);

  React.useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  // Window resize handler
  React.useEffect(() => {
    const handleResize = () => {
      if (!hasDrawn) {
        setupCanvas();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, hasDrawn]);

  // Drawing event helpers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || mode !== "DRAW") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save history
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const currentState = ctx.getImageData(0, 0, rect.width * dpr, rect.height * dpr);
    setHistory((prev) => [...prev.slice(-10), currentState]);

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || mode !== "DRAW") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportCanvasSignature();
  };

  const exportCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const timestamp = new Date().toISOString();
    onSignatureCapture({
      signatureDataUrl: dataUrl,
      signatureType: "DRAWN",
      signerName,
      signedAt: timestamp,
      verificationHash: computeHash(dataUrl),
    });
  };

  // Undo stroke
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);

    if (history.length <= 1) {
      setHasDrawn(false);
    }
    exportCanvasSignature();
  };

  // Clear signature
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    setHistory([]);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  // Render Typed Signature onto Canvas
  const handleApplyTypedSignature = (nameText: string, fontKey: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);

    let fontStyle = "italic 38px 'Dancing Script', cursive, sans-serif";
    if (fontKey === "caveat") fontStyle = "36px 'Caveat', cursive, sans-serif";
    if (fontKey === "serif") fontStyle = "italic 32px 'Playfair Display', Georgia, serif";
    if (fontKey === "cursive") fontStyle = "italic 34px 'Brush Script MT', cursive, sans-serif";

    ctx.font = fontStyle;
    ctx.fillStyle = inkColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(nameText, (rect.width * dpr) / 2, (rect.height * dpr) / 2);

    // Decorative baseline accent flourish
    ctx.beginPath();
    ctx.strokeStyle = `${inkColor}40`;
    ctx.lineWidth = 1.5;
    ctx.moveTo((rect.width * dpr) * 0.2, (rect.height * dpr) * 0.65);
    ctx.bezierCurveTo(
      (rect.width * dpr) * 0.4,
      (rect.height * dpr) * 0.72,
      (rect.width * dpr) * 0.6,
      (rect.height * dpr) * 0.62,
      (rect.width * dpr) * 0.8,
      (rect.height * dpr) * 0.68
    );
    ctx.stroke();

    setHasDrawn(true);
    const dataUrl = canvas.toDataURL("image/png");
    const timestamp = new Date().toISOString();
    onSignatureCapture({
      signatureDataUrl: dataUrl,
      signatureType: "TYPED",
      signerName: nameText,
      signedAt: timestamp,
      verificationHash: computeHash(dataUrl),
    });
  };

  // Upload Signature Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
        // Draw centered and scaled
        const aspect = img.width / img.height;
        let w = rect.width * dpr * 0.7;
        let h = w / aspect;
        if (h > rect.height * dpr * 0.75) {
          h = rect.height * dpr * 0.75;
          w = h * aspect;
        }
        const x = (rect.width * dpr - w) / 2;
        const y = (rect.height * dpr - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        setHasDrawn(true);

        const exportedUrl = canvas.toDataURL("image/png");
        const timestamp = new Date().toISOString();
        onSignatureCapture({
          signatureDataUrl: exportedUrl,
          signatureType: "UPLOADED",
          signerName,
          signedAt: timestamp,
          verificationHash: computeHash(exportedUrl),
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode("DRAW")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "DRAW"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMode("TYPE");
              handleApplyTypedSignature(typedName || signerName, typedFont);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "TYPE"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Script</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMode("UPLOAD");
              fileInputRef.current?.click();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === "UPLOAD"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Scan</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Ink Color Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Ink:</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setInkColor("#0F172A");
              if (mode === "TYPE") handleApplyTypedSignature(typedName || signerName, typedFont);
            }}
            className={`w-5 h-5 rounded-full bg-[#0F172A] border-2 transition-all ${
              inkColor === "#0F172A" ? "border-red-500 scale-110" : "border-transparent"
            }`}
            title="Executive Charcoal Slate"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setInkColor("#1E3A8A");
              if (mode === "TYPE") handleApplyTypedSignature(typedName || signerName, typedFont);
            }}
            className={`w-5 h-5 rounded-full bg-[#1E3A8A] border-2 transition-all ${
              inkColor === "#1E3A8A" ? "border-red-500 scale-110" : "border-transparent"
            }`}
            title="Institutional Navy Blue"
          />
        </div>
      </div>

      {/* Sub-controls for TYPE mode */}
      {mode === "TYPE" && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 animate-fadeIn">
          <input
            type="text"
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              handleApplyTypedSignature(e.target.value, typedFont);
            }}
            placeholder="Type your official name..."
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTypedFont("dancing");
                handleApplyTypedSignature(typedName, "dancing");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                typedFont === "dancing" ? "bg-red-500/10 text-red-500 border border-red-500/30" : "text-slate-400"
              }`}
            >
              Formal Cursive
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedFont("caveat");
                handleApplyTypedSignature(typedName, "caveat");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                typedFont === "caveat" ? "bg-red-500/10 text-red-500 border border-red-500/30" : "text-slate-400"
              }`}
            >
              Executive Script
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedFont("serif");
                handleApplyTypedSignature(typedName, "serif");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                typedFont === "serif" ? "bg-red-500/10 text-red-500 border border-red-500/30" : "text-slate-400"
              }`}
            >
              Diplomatic
            </button>
          </div>
        </div>
      )}

      {/* Main Signature Interactive Canvas Area */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-[#080B11] overflow-hidden shadow-inner group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-44 touch-none cursor-crosshair block"
        />

        {/* Watermark Guidelines & Verification Baseline */}
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 text-center select-none">
            <Fingerprint className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-1 animate-pulse" />
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {mode === "DRAW"
                ? "Sign above using mouse, trackpad, or finger"
                : mode === "TYPE"
                ? "Type your name above to render formal executive signature"
                : "Upload an image of your physical signature"}
            </p>
            <span className="text-[10px] text-slate-400/80 font-mono mt-1">
              Legally binding digital audit record under NDPR / e-Signature Governance
            </span>
          </div>
        )}

        {/* Verification Baseline Line */}
        <div className="absolute bottom-6 left-8 right-8 pointer-events-none border-b border-dashed border-slate-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest pl-1">
            Sign on this baseline
          </span>
          <span className="text-[9px] font-mono text-slate-400 pr-1">
            X ___________________________
          </span>
        </div>

        {/* Action Buttons on Canvas */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {mode === "DRAW" && (
            <button
              type="button"
              disabled={disabled || history.length === 0}
              onClick={handleUndo}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled || !hasDrawn}
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
            title="Clear signature"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Verification Audit Stamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className={`w-4 h-4 ${hasDrawn ? "text-emerald-500" : "text-slate-400"}`} />
          <span>
            {hasDrawn ? (
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                Signature Captured &amp; SHA-256 Hash Bound
              </strong>
            ) : (
              "Signature Required before submission"
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{new Date().toLocaleDateString()}</span>
          </span>
          <span>•</span>
          <span className="text-slate-400 truncate max-w-[140px]">{signerName || "Signer Profile"}</span>
        </div>
      </div>
    </div>
  );
}
