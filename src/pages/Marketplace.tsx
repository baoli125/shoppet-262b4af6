import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPetType, setSelectedPetType] = useState("all");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedPetType]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải sản phẩm",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
  };

  const fetchCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("user_id", user.id);

    if (data) {
      const cart: Record<string, number> = {};
      data.forEach((item) => {
        cart[item.product_id] = item.quantity;
      });
      setCartItems(cart);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (selectedPetType !== "all") {
      filtered = filtered.filter((p) => p.pet_type === selectedPetType);
    }

    setFilteredProducts(filtered);
  };

  const addToCart = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
      return;
    }

    const currentQty = cartItems[productId] || 0;
    const newQty = currentQty + 1;

    const { error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: user.id,
        product_id: productId,
        quantity: newQty,
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm vào giỏ hàng",
        variant: "destructive",
      });
    } else {
      setCartItems({ ...cartItems, [productId]: newQty });
      toast({
        title: "Đã thêm vào giỏ hàng! 🛒",
      });
    }
  };

  const updateCartQuantity = async (productId: string, delta: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const currentQty = cartItems[productId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    if (newQty === 0) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (!error) {
        const newCart = { ...cartItems };
        delete newCart[productId];
        setCartItems(newCart);
      }
    } else {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: newQty,
        });

      if (!error) {
        setCartItems({ ...cartItems, [productId]: newQty });
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Thức ăn",
      toy: "Đồ chơi",
      accessory: "Phụ kiện",
      medicine: "Thuốc",
      grooming: "Vệ sinh",
      other: "Khác",
    };
    return labels[category] || category;
  };

  const getPetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      dog: "🐕 Chó",
      cat: "🐈 Mèo",
      bird: "🦜 Chim",
      fish: "🐠 Cá",
      other: "🐾 Khác",
    };
    return labels[type] || type;
  };

  const totalCartItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
                <p className="text-sm text-muted-foreground">
                  Sản phẩm chất lượng cho thú cưng
                </p>
              </div>
            </div>

            <Button className="btn-hero relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Giỏ hàng
              {totalCartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-destructive">
                  {totalCartItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="food">Thức ăn</SelectItem>
                <SelectItem value="toy">Đồ chơi</SelectItem>
                <SelectItem value="accessory">Phụ kiện</SelectItem>
                <SelectItem value="medicine">Thuốc</SelectItem>
                <SelectItem value="grooming">Vệ sinh</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPetType} onValueChange={setSelectedPetType}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thú cưng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="dog">🐕 Chó</SelectItem>
                <SelectItem value="cat">🐈 Mèo</SelectItem>
                <SelectItem value="bird">🦜 Chim</SelectItem>
                <SelectItem value="fish">🐠 Cá</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy sản phẩm</h2>
            <p className="text-muted-foreground">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={product.image_url || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-primary">
                    {getCategoryLabel(product.category)}
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    {product.pet_type && (
                      <span className="text-xl ml-2">{getPetTypeLabel(product.pet_type).split(" ")[0]}</span>
                    )}
                  </div>

                  {product.brand && (
                    <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {product.price.toLocaleString()}đ
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Còn {product.stock}
                    </span>
                  </div>

                  {cartItems[product.id] ? (
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateCartQuantity(product.id, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="flex-1 text-center font-semibold">
                        {cartItems[product.id]}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateCartQuantity(product.id, 1)}
                        disabled={cartItems[product.id] >= product.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full mt-4 btn-hero"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Thêm vào giỏ
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
