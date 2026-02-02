"use client";

import { useRef, useState, useEffect } from "react";

interface SignatureCaptureProps {
  onSignatureChange: (dataUrl: string | null) => void;
  initialSignature?: string;
}

export default function SignatureCapture({
  onSignatureChange,
  initialSignature,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a1a2e";

        // Fill with white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Restore signature if exists
        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            setHasSignature(true);
          };
          img.src = initialSignature;
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [initialSignature]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const event = "touches" in e ? e.touches[0] : e;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pos = getPos(e);
    if (!pos || !lastPos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPos(pos);
    setHasSignature(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setLastPos(null);

    // Export signature
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-1 bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-[200px] cursor-crosshair touch-none rounded-lg"
          style={{ touchAction: "none" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {hasSignature ? "Signature capturee" : "Signez dans le cadre ci-dessus"}
        </p>
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}
