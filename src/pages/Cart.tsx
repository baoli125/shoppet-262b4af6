import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isFetching, setIsFetching] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: "",
    phone_number: "",
    customer_notes: "",
  });
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsFetching(true);
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
    setIsFetching(false);
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

  const validateStep = (step: number): boolean => {
    try {
      if (step === 1) {
        z.string().trim().regex(/^[0-9+\s()-]{8,20}$/, "Số điện thoại không hợp lệ").parse(checkoutForm.phone_number);
      } else if (step === 2) {
        z.string().trim().min(10, "Địa chỉ quá ngắn (tối thiểu 10 ký tự)").max(500).parse(checkoutForm.shipping_address);
      }
      setStepErrors((prev) => ({ ...prev, [step]: "" }));
      return true;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        setStepErrors((prev) => ({ ...prev, [step]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(checkoutStep)) {
      setCheckoutStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCheckoutStep((prev) => Math.max(prev - 1, 1));
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
      setCheckoutStep(1);
      setCheckoutForm({ shipping_address: "", phone_number: "", customer_notes: "" });
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
        {isFetching ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-10 w-40" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card className="p-4 sm:p-5 md:p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3 mb-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
              </Card>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
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
                <Card key={item.id} className="p-3 sm:p-4 hover:shadow-md transition-all duration-200 animate-fade-in">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0 rounded overflow-hidden group">
                      <img
                        src={item.products.image_url || "https://via.placeholder.com/100"}
                        alt={item.products.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2 line-clamp-2">{item.products.name}</h3>
                      <p className="text-primary font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                        {item.products.price.toLocaleString()}đ
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 rounded-full p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, -1)}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-background touch-manipulation flex-shrink-0"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.product_id, 1)}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-background touch-manipulation flex-shrink-0"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="ml-auto h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 touch-manipulation flex-shrink-0"
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
              <Card className="p-4 sm:p-5 md:p-6 lg:sticky lg:top-4 border-2 border-primary/20 shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Tổng đơn hàng
                </h2>
                <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">{calculateTotal().toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="text-green-600 font-medium">Miễn phí</span>
                  </div>
                  <div className="border-t pt-2.5 sm:pt-3 bg-primary/5 -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 py-3">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-primary text-xl sm:text-2xl">{calculateTotal().toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full btn-hero h-11 sm:h-12 text-base touch-manipulation shadow-md hover:shadow-lg transition-shadow"
                  size="lg"
                  onClick={() => {
                    setIsCheckoutOpen(true);
                    setCheckoutStep(1);
                  }}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Tiến hành đặt hàng
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Step Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={(open) => {
        setIsCheckoutOpen(open);
        if (!open) {
          setCheckoutStep(1);
          setStepErrors({});
        }
      }}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thông tin đặt hàng</DialogTitle>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold transition-all ${
                    checkoutStep > step ? "bg-primary text-primary-foreground" :
                    checkoutStep === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {checkoutStep > step ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-all ${
                      checkoutStep > step ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span className={checkoutStep === 1 ? "text-primary font-medium" : ""}>Liên hệ</span>
              <span className={checkoutStep === 2 ? "text-primary font-medium" : ""}>Địa chỉ</span>
              <span className={checkoutStep === 3 ? "text-primary font-medium" : ""}>Ghi chú</span>
              <span className={checkoutStep === 4 ? "text-primary font-medium" : ""}>Xác nhận</span>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Step 1: Phone Number */}
            {checkoutStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0900 123 456"
                    value={checkoutForm.phone_number}
                    onChange={(e) => {
                      setCheckoutForm({ ...checkoutForm, phone_number: e.target.value });
                      setStepErrors((prev) => ({ ...prev, 1: "" }));
                    }}
                    className="h-11 text-base"
                  />
                  {stepErrors[1] && <p className="text-sm text-destructive">{stepErrors[1]}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {checkoutStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Địa chỉ giao hàng *</Label>
                  <Textarea
                    id="address"
                    placeholder="Nhập địa chỉ chi tiết của bạn"
                    value={checkoutForm.shipping_address}
                    onChange={(e) => {
                      setCheckoutForm({ ...checkoutForm, shipping_address: e.target.value });
                      setStepErrors((prev) => ({ ...prev, 2: "" }));
                    }}
                    rows={4}
                    className="text-base resize-none"
                  />
                  {stepErrors[2] && <p className="text-sm text-destructive">{stepErrors[2]}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Notes */}
            {checkoutStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Ghi chú đơn hàng (Tùy chọn)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Thêm ghi chú cho đơn hàng của bạn"
                    value={checkoutForm.customer_notes}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customer_notes: e.target.value })}
                    rows={4}
                    className="text-base resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {checkoutStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <Card className="p-4 bg-muted/50">
                  <h3 className="font-semibold mb-3">Xem lại thông tin đặt hàng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <span className="font-medium">{checkoutForm.phone_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Địa chỉ:</span>
                      <span className="font-medium text-right max-w-[60%]">{checkoutForm.shipping_address}</span>
                    </div>
                    {checkoutForm.customer_notes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ghi chú:</span>
                        <span className="font-medium text-right max-w-[60%]">{checkoutForm.customer_notes}</span>
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card className="p-4 border-primary/20">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Số sản phẩm:</span>
                      <span className="font-medium">{cartItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phí vận chuyển:</span>
                      <span className="text-green-600 font-medium">Miễn phí</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Tổng thanh toán:</span>
                        <span className="text-primary text-xl">{calculateTotal().toLocaleString()}đ</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {checkoutStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1 h-11 touch-manipulation"
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Quay lại
                </Button>
              )}
              
              {checkoutStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 h-11 btn-hero touch-manipulation"
                >
                  Tiếp tục
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 h-11 btn-hero touch-manipulation"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Xác nhận đặt hàng
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
