import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Flame, Leaf, Info, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FeedingDurationBadge } from "@/components/FeedingDurationBadge";
import { calculateFeedingDays } from "@/utils/feedingCalculator";
import { MultiPetSelector } from "@/components/MultiPetSelector";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [userPets, setUserPets] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchCartQuantity();
      fetchUserPets();
    }
  }, [id]);

  const fetchUserPets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      setUserPets(data);
    }
  };

  const fetchRelatedProducts = async (category: string, currentId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category", category as any)
      .neq("id", currentId)
      .limit(8);
    
    if (data) {
      setRelatedProducts(data);
    }
  };

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
      fetchRelatedProducts(data.category, data.id);
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
      <div className="border-b border-border bg-card header-shadow sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/marketplace")}
              className="gap-1.5 sm:gap-2 h-10 sm:h-11 text-xs sm:text-sm touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Quay lại Marketplace</span>
              <span className="sm:hidden">Quay lại</span>
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Chi tiết sản phẩm</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail - 2 Column Layout */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10">
          {/* Left Column: Product Image */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-background to-muted/30 relative aspect-square flex items-center justify-center p-6">
                <img
                  src={product.image_url || "https://via.placeholder.com/600"}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </Card>
            
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              {product.weight && (
                <Card className="p-4 text-center hover:shadow-lg transition-shadow">
                  <Package className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Trọng lượng</p>
                  <p className="font-semibold text-sm">{product.weight}</p>
                </Card>
              )}
              {product.calories && (
                <Card className="p-4 text-center hover:shadow-lg transition-shadow">
                  <Flame className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Năng lượng</p>
                  <p className="font-semibold text-sm">{product.calories} kcal</p>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 flex-wrap">
                <Badge className="bg-primary text-sm font-semibold px-3 py-1">
                  {getCategoryLabel(product.category)}
                </Badge>
                {product.pet_type && (
                  <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-2">
                    {getPetTypeLabel(product.pet_type)}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">{product.name}</h1>
              
              {product.brand && (
                <p className="text-lg text-muted-foreground">
                  Thương hiệu: <span className="font-semibold text-foreground">{product.brand}</span>
                </p>
              )}
              
              <p className="text-base leading-relaxed text-muted-foreground">{product.description}</p>
            </div>

            <Separator className="my-6" />

            {/* Price Section - Prominent */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giá sản phẩm</p>
                  <span className="text-4xl sm:text-5xl font-bold text-primary block">
                    {product.price.toLocaleString()}đ
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Tình trạng</p>
                  <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-base px-4 py-1">
                    {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Multi-Pet Feeding Calculator */}
            {product.category === 'food' && userPets.length > 0 && (
              <MultiPetSelector
                pets={userPets}
                product={product}
                quantity={quantity}
              />
            )}

            {/* Quantity Selector & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-base font-semibold">Số lượng:</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="w-16 text-center font-bold text-2xl">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-12 w-12 rounded-full border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 btn-hero text-lg py-6 h-14 font-semibold shadow-xl hover:shadow-2xl"
                  onClick={addToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {cartQuantity > 0 && (
                <Card className="p-4 bg-accent/20 border-accent">
                  <p className="text-sm text-center font-medium">
                    ✓ Bạn đã có <span className="font-bold text-primary">{cartQuantity}</span> sản phẩm này trong giỏ hàng
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-10 sm:mt-12 md:mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Thông tin chi tiết</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Ingredients */}
            {product.ingredients && (
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2">Thành phần</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-words">{product.ingredients}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Nutritional Info */}
            {product.nutritional_info && (
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2">Thông tin dinh dưỡng</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-words">{product.nutritional_info}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Features */}
            {product.features && (
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-primary/20 md:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2">Đặc điểm nổi bật</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-words">{product.features}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Usage Instructions */}
            {product.usage_instructions && (
              <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-primary/20 md:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2">Hướng dẫn sử dụng</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line break-words">{product.usage_instructions}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* You May Also Like Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16 md:mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Sản phẩm tương tự</h2>
              <Button variant="outline" onClick={() => navigate("/marketplace")}>
                Xem tất cả
              </Button>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {relatedProducts.map((relatedProduct) => (
                  <CarouselItem key={relatedProduct.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <Card 
                      className="group cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-xl"
                      onClick={() => {
                        navigate(`/product/${relatedProduct.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="aspect-square bg-muted/30 relative overflow-hidden">
                        <img
                          src={relatedProduct.image_url || "https://via.placeholder.com/300"}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-xs">
                          {getCategoryLabel(relatedProduct.category)}
                        </Badge>
                      </div>
                      
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedProduct.name}
                        </h3>
                        {relatedProduct.brand && (
                          <p className="text-xs text-muted-foreground">{relatedProduct.brand}</p>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-primary">
                            {relatedProduct.price.toLocaleString()}đ
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Còn {relatedProduct.stock}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
