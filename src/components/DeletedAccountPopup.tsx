import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  reason: string;
  userId: string;
  onClose: () => void;
  onRestored: () => void;
}

const DeletedAccountPopup = ({ open, reason, userId, onClose, onRestored }: Props) => {
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();

  const handleRestore = async () => {
    setRestoring(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        is_deleted: false,
        deleted_at: null,
        delete_reason: null,
        deleted_by: null,
      })
      .eq("id", userId);

    setRestoring(false);
    if (error) {
      toast({ title: "Lỗi", description: "Không thể khôi phục tài khoản", variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Tài khoản đã được khôi phục" });
      onRestored();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Tài khoản đã bị xóa
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <p className="text-sm">
            Tài khoản của bạn đã bị quản trị viên xóa với lý do sau:
          </p>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-medium text-destructive">{reason || "Không có lý do được cung cấp"}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn có thể khôi phục tài khoản hoặc đăng xuất.
          </p>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Đăng xuất
          </Button>
          <Button onClick={handleRestore} disabled={restoring}>
            {restoring ? "Đang khôi phục..." : "Khôi phục tài khoản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletedAccountPopup;
