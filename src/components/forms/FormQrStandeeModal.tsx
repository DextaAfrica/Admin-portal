"use client";

import * as React from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Smartphone,
  UploadCloud,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getFormPublicPath } from "@/lib/forms/paths";

interface FormQrStandeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    id: string;
    slug: string;
    routePrefix?: string | null;
    groupSlug?: string | null;
    title: string;
    description?: string;
    coverImageUrl?: string;
    eventLocation?: string;
  } | null;
}

export function FormQrStandeeModal({ isOpen, onClose, form }: FormQrStandeeModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [welcomeHeading, setWelcomeHeading] = React.useState("Welcome!");
  const [tapInCallout, setTapInCallout] = React.useState("→  Tap in  ←");
  const [standeeTheme, setStandeeTheme] = React.useState<"light" | "dark">("light");
  const [customImageUrl, setCustomImageUrl] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://admin.dextaafrica.com";

  const targetUrl = form ? `${origin}${getFormPublicPath(form)}` : "";
  const activeImageUrl = customImageUrl || form?.coverImageUrl || "/images/dexta-logo-dark.png";

  React.useEffect(() => {
    if (!isOpen || !form) return;
    setCustomImageUrl(form.coverImageUrl || "");
    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("QR generation error:", err);
      });
  }, [isOpen, form, targetUrl]);

  if (!form) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setIsCopied(true);
    toastSuccess("Form link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${form.slug}-qr-code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toastSuccess("QR code PNG downloaded!");
  };

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Renders a print-ready high-resolution (1200x1680) Visitor Tap-In Standee PNG
   * combining the welcome header, attached brand/event image, scannable QR code,
   * and "Tap in" callout.
   */
  const handleDownloadStandeePng = async () => {
    if (!qrDataUrl) return;
    setIsExporting(true);
    try {
      const canvas = document.createElement("canvas");
      const W = 1200;
      const H = 1680;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      const isDark = standeeTheme === "dark";

      // Background
      ctx.fillStyle = isDark ? "#0b0f19" : "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Top crimson accent bar
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 0, W, 24);

      // Subtle border
      ctx.strokeStyle = isDark ? "#1e293b" : "#e2e8f0";
      ctx.lineWidth = 8;
      ctx.strokeRect(28, 44, W - 56, H - 72);

      // 1. Welcome Headline
      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.font = "bold 96px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(welcomeHeading || "Welcome!", W / 2, 200);

      // 2. Attached Brand / Cover Image (aspect-fit)
      const loadImg = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      let imgEndY = 470;
      try {
        const brandImg = await loadImg(activeImageUrl);
        const maxImgW = 760;
        const maxImgH = 260;
        const ratio = Math.min(maxImgW / brandImg.width, maxImgH / brandImg.height);
        const drawW = brandImg.width * ratio;
        const drawH = brandImg.height * ratio;
        const drawX = (W - drawW) / 2;
        const drawY = 260 + (maxImgH - drawH) / 2;
        ctx.drawImage(brandImg, drawX, drawY, drawW, drawH);
        imgEndY = drawY + drawH + 50;
      } catch {
        imgEndY = 340;
      }

      // 3. Form Title
      ctx.fillStyle = isDark ? "#e2e8f0" : "#334155";
      ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
      const titleText = form.title.length > 42 ? form.title.slice(0, 40) + "..." : form.title;
      ctx.fillText(titleText, W / 2, Math.max(imgEndY, 540));

      // 4. QR Code Box
      const qrSize = 580;
      const qrX = (W - qrSize) / 2;
      const qrY = 620;

      // White card behind QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrX - 32, qrY - 32, qrSize + 64, qrSize + 64, 32);
      ctx.fill();
      ctx.strokeStyle = isDark ? "#334155" : "#cbd5e1";
      ctx.lineWidth = 4;
      ctx.stroke();

      const qrImg = await loadImg(qrDataUrl);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 5. "Tap in" Callout
      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.font = "bold 68px Georgia, serif";
      ctx.fillText(tapInCallout || "→  Tap in  ←", W / 2, 1380);

      // 6. Instructions & Link
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.font = "600 28px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Scan with your phone camera to check in or register", W / 2, 1460);

      ctx.fillStyle = "#dc2626";
      ctx.font = "600 24px monospace";
      ctx.fillText(targetUrl.replace(/^https?:\/\//, ""), W / 2, 1540);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${form.slug}-tap-in-standee.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toastSuccess("Printable Tap-In Standee PNG downloaded!");
    } catch (err) {
      console.error("Standee export error:", err);
      toastError("Failed to export standee PNG. You can still download the QR code directly.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code & Visitor Tap-In Standee"
      description="Generate a scannable QR code and printable desk standee with your attached image so visitors can scan and open this form instantly."
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
        {/* Left: Standee Live Preview */}
        <div className="flex flex-col items-center justify-center">
          <div
            className={`w-full max-w-[300px] rounded-2xl border-2 p-6 text-center shadow-xl transition-colors relative overflow-hidden ${
              standeeTheme === "dark"
                ? "bg-[#0b0f19] border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-600" />
            <h3 className="text-2xl font-serif font-bold tracking-tight mt-2 mb-3">
              {welcomeHeading || "Welcome!"}
            </h3>

            {/* Attached Image / Logo */}
            <div className="flex items-center justify-center mb-3 min-h-[56px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageUrl}
                alt={form.title}
                className="max-h-20 max-w-full object-contain rounded-lg"
              />
            </div>

            <p
              className={`text-[11px] font-bold uppercase tracking-wider mb-3 line-clamp-1 ${
                standeeTheme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {form.title}
            </p>

            {/* Scannable QR */}
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 inline-block shadow-sm mb-3">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrDataUrl} alt="Form QR Code" className="w-40 h-40 block" />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-lg font-serif font-bold tracking-tight mb-1">
              {tapInCallout || "→  Tap in  ←"}
            </div>
            <p
              className={`text-[10px] ${
                standeeTheme === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Scan with your camera to open form
            </p>
            <p className="text-[9px] font-mono text-red-500 mt-1.5 truncate">
              {targetUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
        </div>

        {/* Right: Customizer & Downloads */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-red-500" />
                Customize Standee Display
              </span>
              <div className="flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStandeeTheme("light")}
                  className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    standeeTheme === "light"
                      ? "bg-red-600 text-white"
                      : "bg-transparent text-slate-500"
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setStandeeTheme("dark")}
                  className={`px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${
                    standeeTheme === "dark"
                      ? "bg-red-600 text-white"
                      : "bg-transparent text-slate-500"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Top Welcome Text
              </label>
              <input
                type="text"
                value={welcomeHeading}
                onChange={(e) => setWelcomeHeading(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Bottom Scan / Tap-In Callout
              </label>
              <input
                type="text"
                value={tapInCallout}
                onChange={(e) => setTapInCallout(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Attached Brand / Event Image
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#171821] hover:border-red-500 cursor-pointer text-[11px] font-semibold">
                  <UploadCloud className="h-3.5 w-3.5 text-red-500" />
                  <span>Attach / Swap Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageSelect}
                    className="hidden"
                  />
                </label>
                {customImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomImageUrl("")}
                    className="text-[11px] text-slate-400 hover:text-red-500"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Target Link Copy */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase text-slate-400">Destination Link</div>
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate">
                {targetUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 shrink-0"
              title="Copy link"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Download Actions */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="primary"
              onClick={handleDownloadStandeePng}
              isLoading={isExporting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Printable Standee (PNG)
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadQrOnly}
              className="w-full border-slate-200 dark:border-white/10 text-xs py-2"
              leftIcon={<QrCode className="h-4 w-4" />}
            >
              Download QR Code Only (PNG)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
