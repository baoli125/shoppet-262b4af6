import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
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

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      shipping: <Truck className="w-5 h-5" />,
      delivered: <Package className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />,
    };
    return icons[status] || <Clock className="w-5 h-5" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      delivered: "Đã giao",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
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

  return (
    <div className="min-h-screen bg-background pt-14 sm:pt-16 md:pt-20">
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

      {/* Orders List */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📦</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Hãy mua sắm ngay để có đơn hàng đầu tiên
            </p>
            <Button className="btn-hero h-11 sm:h-12 text-sm sm:text-base touch-manipulation" onClick={() => navigate("/marketplace")}>
              Khám phá sản phẩm
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {orders.map((order) => (
              <Card key={order.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3 sm:gap-4">
                  <div className="w-full sm:w-auto">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      {getStatusIcon(order.status)}
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
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {order.total_amount.toLocaleString()}đ
                    </p>
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
                      <p className="font-semibold">
                        {item.subtotal.toLocaleString()}đ
                      </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
