import React, { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

const OUTPUT_SIZE = 512;

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
      'image/jpeg',
      0.92
    );
  });
}

const AvatarCropDialog: React.FC<AvatarCropDialogProps> = ({ open, imageSrc, onCancel, onConfirm }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    try {
      setSaving(true);
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      await onConfirm(blob);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !saving) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-72 bg-black/80 rounded-lg overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <ZoomOut size={16} className="text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <ZoomIn size={16} className="text-muted-foreground" />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || !croppedArea}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-semibold"
          >
            {saving ? <><Loader2 size={14} className="mr-2 animate-spin" /> Saving…</> : 'Save photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropDialog;