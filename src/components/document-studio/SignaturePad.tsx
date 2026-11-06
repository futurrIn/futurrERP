import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, ShieldCheck } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  signatoryName?: string;
  signatoryDesignation?: string;
  onNameChange?: (name: string) => void;
  onDesignationChange?: (designation: string) => void;
  hideNameFields?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  signatoryName = 'Authorized Signatory',
  signatoryDesignation = 'Futurr Innovations and Research',
  onNameChange,
  onDesignationChange,
  hideNameFields = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!value);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display resolution vs internal coordinate size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width || 360;
      canvas.height = rect.height || 120;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#0f172a'; // Deep crisp slate ink

    if (value) {
      const img = new Image();
      img.src = value;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange('');
  };

  const handleGeneratePresetStamp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render stylish cursive signature approximation
    ctx.save();
    ctx.font = 'italic 26px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(signatoryName || 'Futurr Auth Sign', 40, 55);

    // Subtle underline flourish
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.moveTo(35, 68);
    ctx.bezierCurveTo(90, 62, 180, 78, 260, 65);
    ctx.stroke();

    ctx.restore();

    setHasDrawn(true);
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <PenTool size={14} className="text-purple-600" />
          <span>Interactive Digital Signature Pad</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck size={12} /> PNG Vector Ink
        </span>
      </div>

      <p className="text-[11px] text-slate-500">
        Sign directly on the pad below or draw with mouse/touch to generate an authenticated signature.
      </p>

      {/* Signatory Name & Designation */}
      {!hideNameFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Signatory Name
            </label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="e.g. Albin - Operations Lead"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Designation
            </label>
            <input
              type="text"
              value={signatoryDesignation}
              onChange={(e) => onDesignationChange?.(e.target.value)}
              placeholder="e.g. Authorized Signatory, Futurr Innovations and Research"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-xl overflow-hidden bg-white transition-colors">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 cursor-crosshair touch-none"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-medium italic">
            Draw signature using mouse, stylus, or touch
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={handleGeneratePresetStamp}
            className="text-[10px] font-bold px-2 py-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
          >
            Futurr Digital Stamp
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            title="Clear signature"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default SignaturePad;

