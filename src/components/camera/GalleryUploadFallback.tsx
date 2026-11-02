import React, { useRef } from 'react';
import { FrameQualityCheck } from '../../types/diagnostic';
import { evaluateFrameQuality } from '../../cv/qualityCheck';

interface GalleryUploadFallbackProps {
  onImageLoaded: (dataUrl: string, quality: FrameQualityCheck) => void;
}

export const GalleryUploadFallback: React.FC<GalleryUploadFallbackProps> = ({
  onImageLoaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const quality = evaluateFrameQuality(imgData);
        onImageLoaded(canvas.toDataURL('image/jpeg', 0.92), quality);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="hidden"
        id="hidden-gallery-input-trigger"
      >
        Trigger Gallery
      </button>
    </div>
  );
};
