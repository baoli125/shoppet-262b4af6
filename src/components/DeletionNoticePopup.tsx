import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DeletionLog {
  id: string;
  target_type: string;
  target_name: string | null;
  reason: string;
  created_at: string;
}

const targetTypeLabels: Record<string, string> = {
  account: "Tài khoản",
  product: "Sản phẩm",
  order: "Đơn hàng",
  post: "Bài viết",
  pet: "Thú cưng",
};

const DeletionNoticePopup = ({ userId }: { userId: string }) => {
  const [logs, setLogs] = useState<DeletionLog[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUnacknowledgedLogs();
  }, [userId]);

  const fetchUnacknowledgedLogs = async () => {
    const { data } = await supabase
      .from("deletion_logs")
      .select("id, target_type, target_name, reason, created_at")
      .eq("user_id", userId)
      .eq("is_acknowledged", false)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setLogs(data);
      setOpen(true);
    }
  };

  const handleAcknowledge = async () => {
    const ids = logs.map((l) => l.id);
    await supabase
      .from("deletion_logs")
      .update({ is_acknowledged: true })
      .in("id", ids);
    setOpen(false);
    setLogs([]);
  };

  if (logs.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleAcknowledge(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Thông báo từ quản trị viên
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <Badge variant="outline" className="text-xs">
                  {targetTypeLabels[log.target_type] || log.target_type}
                </Badge>
                {log.target_name && (
                  <span className="text-sm font-medium truncate">{log.target_name}</span>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium">Lý do: </span>
                <span className="text-muted-foreground">{log.reason}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleAcknowledge} className="w-full">
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletionNoticePopup;
