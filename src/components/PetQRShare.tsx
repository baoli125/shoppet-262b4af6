import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PetQRShareProps {
  petId: string;
  petName: string;
}

export const PetQRShare = ({ petId, petName }: PetQRShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate shareable URL (read-only view)
  const shareUrl = `${window.location.origin}/pets/${petId}/share`;
  
  // QR code using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Đã sao chép!",
      description: "Link chia sẻ đã được copy vào clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          Chia sẻ QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chia sẻ hồ sơ {petName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Quét mã QR này để xem hồ sơ sức khỏe và lịch sử tiêm chủng của {petName}. 
            Thông tin này chỉ ở chế độ xem, không thể chỉnh sửa.
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-background to-muted/30 rounded-lg border-2">
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for ${petName}`}
              className="w-64 h-64 rounded-lg shadow-lg"
            />
            <Badge variant="secondary" className="text-xs">
              🔒 Chỉ xem, không chỉnh sửa
            </Badge>
          </div>

          {/* Shareable Link */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Hoặc chia sẻ link:</Label>
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="font-mono text-xs"
              />
              <Button 
                size="icon" 
                variant="outline"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            💡 Tip: Bác sĩ thú y có thể quét mã này để xem lịch sử sức khỏe đầy đủ
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

function Input({ value, readOnly, className }: { value: string; readOnly: boolean; className?: string }) {
  return <input value={value} readOnly={readOnly} className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}