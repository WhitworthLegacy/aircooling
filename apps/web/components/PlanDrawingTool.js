"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const MAX_HISTORY = 50;

export default function PlanDrawingTool({ prospectId }) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();

      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));

      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";

      ctxRef.current = ctx;
    };

    const handleResize = () => {
      requestAnimationFrame(() => requestAnimationFrame(resizeCanvas));
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const saveState = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataUrl = canvas.toDataURL("image/png");
      setHistoryStack((prev) => {
        const newStack = [...prev];
        if (newStack.length >= MAX_HISTORY) newStack.shift();
        newStack.push(dataUrl);
        return newStack;
      });
    } catch (e) {
      console.warn("Undo save failed", e);
    }
  };

  const restoreFromDataUrl = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
    };
    img.src = dataUrl;
  };

  const undoLast = () => {
    if (historyStack.length === 0) return;
    const newStack = [...historyStack];
    const lastState = newStack.pop();
    setHistoryStack(newStack);
    if (lastState) restoreFromDataUrl(lastState);
  };

  const getPos = (ev) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const r = canvas.getBoundingClientRect();
    const e = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleStart = (ev) => {
    saveState();
    setDrawing(true);
    setLastPos(getPos(ev));
  };

  const handleMove = (ev) => {
    if (!drawing) return;
    ev.preventDefault();

    const ctx = ctxRef.current;
    if (!ctx) return;

    const p = getPos(ev);
    if (!p || !lastPos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setLastPos(p);
  };

  const handleEnd = () => {
    setDrawing(false);
    setLastPos(null);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/prospects/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: prospectId,
          plan_image: dataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Erreur lors de l'enregistrement");
        return;
      }

      // Redirect to success or home
      router.push("/");
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Croquis du plan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Dessine le plan rapidement. Puis clique sur "Enregistrer le croquis".
          </p>

          <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-semibold">
              📱 Pour dessiner plus facilement, mets ton téléphone en <b>paysage</b>.
            </p>
            <p className="text-xs text-blue-700 mt-1">(Le dessin fonctionne aussi en portrait.)</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-4 max-w-full mx-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              className="w-full h-[420px] sm:h-[480px] md:h-[520px] lg:h-[560px] rounded-xl bg-white touch-none cursor-crosshair"
              style={{ touchAction: "none" }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed left-0 right-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-4 z-50">
        <div className="max-w-5xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={undoLast}
            disabled={historyStack.length === 0}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-900 rounded-2xl font-bold text-base hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↩︎ Retour
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-4 bg-[#1B3B8A] text-white rounded-2xl font-bold text-base hover:bg-[#152d6b] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enregistrement..." : "Enregistrer le croquis ✅"}
          </button>
        </div>
      </div>
    </div>
  );
}
