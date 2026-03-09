import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle, Ban, Loader2, MoreVertical, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  shipping_address: string;
  phone_number: string;
  customer_notes: string;
  created_at: string;
  order_items: {
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
  }[];
}

const ORDER_TABS = [
  { value: "pending", label: "Chờ xác nhận", icon: Clock },
  { value: "confirmed", label: "Đang xử lý", icon: CheckCircle },
  { value: "shipping", label: "Chờ giao hàng", icon: Truck },
  { value: "delivered", label: "Hoàn thành", icon: Package },
  { value: "cancelled", label: "Đơn hủy", icon: XCircle },
] as const;

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        shipping_address,
        phone_number,
        customer_notes,
        created_at,
        order_items (
          product_name,
          product_price,
          quantity,
          subtotal
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải đơn hàng",
        variant: "destructive",
      });
    } else {
      setOrders(data as any || []);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setIsCancelling(true);

    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled" as any,
        cancel_reason: cancelReason || null,
      })
      .eq("id", cancellingOrderId);

    setIsCancelling(false);

    if (error) {
      toast({ title: "Lỗi", description: "Không thể hủy đơn hàng", variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đơn hàng đã được hủy" });
      fetchOrders();
    }

    setCancellingOrderId(null);
    setCancelReason("");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      shipping: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đang xử lý",
      shipping: "Chờ giao hàng",
      delivered: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  const orderCounts = ORDER_TABS.reduce((acc, tab) => {
    acc[tab.value] = orders.filter((o) => o.status === tab.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-10 w-10 sm:h-11 sm:w-11 touch-manipulation">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Đơn hàng của tôi</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Theo dõi trạng thái đơn hàng
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Orders */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1 rounded-xl">
            {ORDER_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-w-[100px] text-xs sm:text-sm gap-1 sm:gap-1.5 data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ").pop()}</span>
                {orderCounts[tab.value] > 0 && (
                  <span className="ml-0.5 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                    {orderCounts[tab.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {ORDER_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4 sm:mt-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📦</div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">Không có đơn hàng nào</h2>
                  <p className="text-sm text-muted-foreground">
                    Chưa có đơn hàng ở trạng thái "{tab.label}"
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      getStatusColor={getStatusColor}
                      getStatusLabel={getStatusLabel}
                      onCancel={activeTab === "pending" ? () => setCancellingOrderId(order.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {orders.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4 max-w-4xl mx-auto">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📦</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Hãy mua sắm ngay để có đơn hàng đầu tiên
            </p>
            <Button className="btn-hero h-11 sm:h-12 text-sm sm:text-base touch-manipulation" onClick={() => navigate("/marketplace")}>
              Khám phá sản phẩm
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancellingOrderId} onOpenChange={(open) => { if (!open) { setCancellingOrderId(null); setCancelReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">Lý do hủy (không bắt buộc)</label>
            <Textarea
              placeholder="Nhập lý do hủy đơn..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Quay lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
              Hủy đơn hàng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Extracted order card component
interface OrderCardProps {
  order: Order;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  onCancel?: () => void;
}

const OrderCard = ({ order, getStatusColor, getStatusLabel, onCancel }: OrderCardProps) => (
  <Card className="p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-4">
      <div className="w-full sm:w-auto">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Badge className={`${getStatusColor(order.status)} text-white text-xs sm:text-sm`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Đơn hàng #{order.id.slice(0, 8)}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleString("vi-VN")}
        </p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <p className="text-xl sm:text-2xl font-bold text-primary">
          {order.total_amount.toLocaleString()}đ
        </p>
        {onCancel && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Hủy đơn hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>

    <div className="border-t pt-4 space-y-3">
      {order.order_items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center">
          <div>
            <p className="font-medium">{item.product_name}</p>
            <p className="text-sm text-muted-foreground">
              {item.product_price.toLocaleString()}đ x {item.quantity}
            </p>
          </div>
          <p className="font-semibold">{item.subtotal.toLocaleString()}đ</p>
        </div>
      ))}
    </div>

    <div className="border-t mt-4 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold mb-1">Địa chỉ giao hàng:</p>
          <p className="text-muted-foreground">{order.shipping_address}</p>
        </div>
        <div>
          <p className="font-semibold mb-1">Số điện thoại:</p>
          <p className="text-muted-foreground">{order.phone_number}</p>
        </div>
        {order.customer_notes && (
          <div className="md:col-span-2">
            <p className="font-semibold mb-1">Ghi chú:</p>
            <p className="text-muted-foreground">{order.customer_notes}</p>
          </div>
        )}
      </div>
    </div>
  </Card>
);

export default Orders;
