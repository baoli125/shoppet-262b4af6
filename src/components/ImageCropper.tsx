import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d")!;
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.9);
  });
}

const ImageCropper = ({ open, imageSrc, onClose, onCropComplete, aspectRatio = 1 }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteInternal = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(blob);
      onClose();
    } catch (e) {
      console.error("Crop error:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Chỉnh sửa ảnh</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[350px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="px-4 pb-2 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="flex items-center gap-3">
            <RotateCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={([v]) => setRotation(v)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">{rotation}°</span>
          </div>
        </div>

        <DialogFooter className="p-4 pt-0">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleConfirm}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
