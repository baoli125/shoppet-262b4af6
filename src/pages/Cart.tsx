import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    stock: number;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: "",
    phone_number: "",
    customer_notes: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          image_url,
          stock
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải giỏ hàng",
        variant: "destructive",
      });
    } else {
      setCartItems(data as any || []);
    }
  };

  const updateQuantity = async (itemId: string, productId: string, delta: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      await removeItem(itemId);
      return;
    }

    if (newQty > item.products.stock) {
      toast({
        title: "Không đủ hàng",
        description: "Số lượng vượt quá tồn kho",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật số lượng",
        variant: "destructive",
      });
    } else {
      fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm",
        variant: "destructive",
      });
    } else {
      toast({ title: "Đã xóa khỏi giỏ hàng" });
      fetchCart();
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.products.price * item.quantity);
    }, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      if (cartItems.length === 0) {
        throw new Error("Giỏ hàng trống");
      }

      // For demo, we'll use the first product's seller_id
      const { data: firstProduct } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", cartItems[0].product_id)
        .single();

      const totalAmount = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          seller_id: firstProduct?.seller_id || user.id,
          total_amount: totalAmount,
          status: "pending",
          shipping_address: checkoutForm.shipping_address,
          phone_number: checkoutForm.phone_number,
          customer_notes: checkoutForm.customer_notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_price: item.products.price,
        quantity: item.quantity,
        subtotal: item.products.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      toast({
        title: "Đặt hàng thành công! 🎉",
        description: "Đơn hàng của bạn đang được xử lý",
      });

      setIsCheckoutOpen(false);
      navigate("/orders");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đặt hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/marketplace")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Giỏ hàng</h1>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} sản phẩm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <Button className="btn-hero" onClick={() => navigate("/marketplace")}>
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.products.image_url || "https://via.placeholder.com/100"}
                      alt={item.products.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{item.products.name}</h3>
                      <p className="text-primary font-bold text-xl mb-3">
                        {item.products.price.toLocaleString()}đ
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Tổng đơn hàng</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{calculateTotal().toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full btn-hero"
                  size="lg"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Đặt hàng
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin giao hàng</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                type="tel"
                value={checkoutForm.phone_number}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone_number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ giao hàng *</Label>
              <Textarea
                id="address"
                value={checkoutForm.shipping_address}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={checkoutForm.customer_notes}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-primary">
                  {calculateTotal().toLocaleString()}đ
                </span>
              </div>

              <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
