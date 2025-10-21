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
import { z } from "zod";

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

  // Define validation schema
  const checkoutSchema = z.object({
    shipping_address: z.string()
      .trim()
      .min(10, "Địa chỉ quá ngắn (tối thiểu 10 ký tự)")
      .max(500, "Địa chỉ không được vượt quá 500 ký tự"),
    phone_number: z.string()
      .trim()
      .regex(/^[0-9+\s()-]{8,20}$/, "Số điện thoại không hợp lệ (8-20 ký tự, chỉ số và ký tự +()-)")
      .transform(s => s.replace(/[\s()-]/g, '')),
    customer_notes: z.string()
      .trim()
      .max(1000, "Ghi chú không được vượt quá 1000 ký tự")
      .optional()
      .transform(s => s || null)
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input BEFORE database operation
      const validatedData = checkoutSchema.parse(checkoutForm);

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

      // Create order with validated data
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          seller_id: firstProduct?.seller_id || user.id,
          total_amount: totalAmount,
          status: "pending",
          shipping_address: validatedData.shipping_address,
          phone_number: validatedData.phone_number,
          customer_notes: validatedData.customer_notes,
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
      if (error instanceof z.ZodError) {
        // Handle validation errors
        toast({
          title: "Lỗi thông tin đặt hàng",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể đặt hàng",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/marketplace")} className="flex-shrink-0 touch-manipulation">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">Giỏ hàng</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {cartItems.length} sản phẩm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🛒</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <Button className="btn-hero h-11 sm:h-12 px-6 sm:px-8 touch-manipulation" onClick={() => navigate("/marketplace")}>
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <img
                      src={item.products.image_url || "https://via.placeholder.com/100"}
                      alt={item.products.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-2">{item.products.name}</h3>
                      <p className="text-primary font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                        {item.products.price.toLocaleString()}đ
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, -1)}
                            className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation flex-shrink-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, 1)}
                            className="h-9 w-9 sm:h-10 sm:w-10 touch-manipulation flex-shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto h-9 w-9 sm:h-10 sm:w-10 touch-manipulation flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary - Sticky on desktop */}
            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-5 md:p-6 lg:sticky lg:top-4">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Tổng đơn hàng</h2>
                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{calculateTotal().toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="border-t pt-2.5 sm:pt-3">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{calculateTotal().toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full btn-hero h-11 sm:h-12 text-base touch-manipulation"
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

      {/* Checkout Dialog - Mobile Optimized */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thông tin giao hàng</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCheckout} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Số điện thoại *</Label>
              <Input
                id="phone"
                type="tel"
                value={checkoutForm.phone_number}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone_number: e.target.value })}
                required
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">Địa chỉ giao hàng *</Label>
              <Textarea
                id="address"
                value={checkoutForm.shipping_address}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value })}
                required
                rows={3}
                className="text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">Ghi chú</Label>
              <Textarea
                id="notes"
                value={checkoutForm.customer_notes}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_notes: e.target.value })}
                rows={2}
                className="text-base resize-none"
              />
            </div>

            <div className="border-t pt-3 sm:pt-4">
              <div className="flex justify-between mb-3 sm:mb-4">
                <span className="font-semibold text-sm sm:text-base">Tổng thanh toán:</span>
                <span className="text-lg sm:text-xl font-bold text-primary">
                  {calculateTotal().toLocaleString()}đ
                </span>
              </div>

              <Button type="submit" className="w-full btn-hero h-11 sm:h-12 text-base touch-manipulation" disabled={isLoading}>
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
