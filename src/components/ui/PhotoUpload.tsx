import { useRef, useState } from 'react';
import { Camera, X, ImagePlus } from 'lucide-react';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ photos, onChange, maxPhotos = 8 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxPhotos - photos.length;
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange([...photos, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <ImagePlus size={18} className="text-gray-400" />
            <span className="text-[9px] text-gray-400">เพิ่มรูป</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <p className="text-xs text-gray-400 mt-2">{photos.length}/{maxPhotos} รูป</p>
    </div>
  );
}
