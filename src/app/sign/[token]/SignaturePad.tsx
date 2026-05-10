"use client";

import { useRef, useState } from "react";
import { submitSignatureAction } from "@/server/actions";

interface Props {
  token: string;
}

export function SignaturePad({ token }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    isDrawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    setIsPending(true);
    setError(null);
    const result = await submitSignatureAction(token, canvas.toDataURL("image/png"));
    if (result.ok) {
      setIsDone(true);
    } else {
      setError(result.message ?? "Erreur lors de la signature");
    }
    setIsPending(false);
  }

  if (isDone) {
    return (
      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-3 text-lg font-bold text-green-800">Devis signé avec succès !</p>
        <p className="mt-2 text-sm text-green-700">
          Votre accord a bien été enregistré. L&apos;artisan a été notifié.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="mb-1 text-sm font-semibold text-slate-700">Signez dans le cadre ci-dessous :</p>
      <p className="mb-3 text-xs text-slate-500">
        Dessinez votre signature avec votre doigt ou la souris pour valider le devis.
      </p>
      <canvas
        ref={canvasRef}
        width={640}
        height={180}
        className="w-full rounded-xl border-2 border-slate-300 bg-white cursor-crosshair touch-none"
        style={{ touchAction: "none" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clearSignature}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasSignature || isPending}
          className="flex-1 rounded-xl bg-[#e86218] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isPending ? "Enregistrement…" : "Bon pour accord — Signer le devis"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
