import { useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  name?: string;
  value?: string;
  onChange?: (signature: string) => void;
  readOnly?: boolean;
}

export default function SignaturePad({ label, name, value, onChange, readOnly = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const emitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onChange) return;
    onChange(canvas.toDataURL('image/png'));
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(event.pointerId);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setDrawing(true);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || readOnly) return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stop = () => {
    if (!drawing) return;
    setDrawing(false);
    emitSignature();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    onChange?.('');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3 mb-2 no-print">
        <div>
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">{name || '-'}</p>
        </div>
        {!readOnly && (
          <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-primary flex items-center gap-1">
            <RotateCcw size={12} /> ล้าง
          </button>
        )}
      </div>
      {value ? (
        <div className="w-full h-28 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center">
          <img src={value} alt={label} className="max-w-full max-h-full object-contain" />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={520}
          height={150}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerLeave={stop}
          className="w-full h-28 rounded-lg border border-dashed border-gray-300 bg-white touch-none"
        />
      )}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs text-gray-700 font-medium mt-0.5">{name || '-'}</p>
        <p className="text-xs text-gray-400 mt-0.5">วันที่ ........................</p>
      </div>
    </div>
  );
}
