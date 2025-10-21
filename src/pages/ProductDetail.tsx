import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Flame, Leaf, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  pet_type: string;
  brand: string;
  image_url: string;
  stock: number;
  weight: string;
  calories: number;
  ingredients: string;
  nutritional_info: string;
  usage_instructions: string;
  features: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCartQuantity();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin sản phẩm",
        variant: "destructive",
      });
      navigate("/marketplace");
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const fetchCartQuantity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const { data } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .single();

    if (data) {
      setCartQuantity(data.quantity);
    }
  };

  const addToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    const newQty = cartQuantity + quantity;

    const { error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: user.id,
        product_id: id!,
        quantity: newQty,
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
    } else {
      setCartQuantity(newQty);
      toast({
        title: "Đã thêm vào giỏ hàng",
        description: `${quantity} sản phẩm đã được thêm vào giỏ hàng`,
      });
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Thức ăn",
      toy: "Đồ chơi",
      accessory: "Phụ kiện",
      medicine: "Thuốc & Y tế",
      grooming: "Chăm sóc"
    };
    return labels[category] || category;
  };

  const getPetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dog: "🐕 Chó",
      cat: "🐱 Mèo",
      bird: "🐦 Chim",
      fish: "🐟 Cá"
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/marketplace")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Chi tiết sản phẩm</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img
                  src={product.image_url || "https://via.placeholder.com/600"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start gap-3 mb-3">
                <Badge className="bg-primary">{getCategoryLabel(product.category)}</Badge>
                {product.pet_type && (
                  <Badge variant="outline">{getPetTypeLabel(product.pet_type)}</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-lg text-muted-foreground mb-4">Thương hiệu: {product.brand}</p>
              )}
              
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <Separator />

            {/* Price and Stock */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-primary">
                  {product.price.toLocaleString()}đ
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Còn lại: {product.stock} sản phẩm
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Số lượng:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full btn-hero text-lg py-6"
              onClick={addToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Thêm vào giỏ hàng
            </Button>

            {cartQuantity > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                Bạn đã có {cartQuantity} sản phẩm này trong giỏ hàng
              </p>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Thông tin chi tiết</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight */}
            {product.weight && (
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Package className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Trọng lượng / Dung tích</h3>
                    <p className="text-muted-foreground">{product.weight}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Calories */}
            {product.calories && (
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Flame className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Năng lượng</h3>
                    <p className="text-muted-foreground">{product.calories} kcal</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Leaf className="w-6 h-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Thành phần</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.ingredients}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Nutritional Info */}
            {product.nutritional_info && (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Thông tin dinh dưỡng</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.nutritional_info}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Features */}
            {product.features && (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Đặc điểm nổi bật</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.features}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Usage Instructions */}
            {product.usage_instructions && (
              <Card className="p-6 md:col-span-2">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Hướng dẫn sử dụng</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.usage_instructions}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
