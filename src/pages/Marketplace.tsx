import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, ArrowUpDown } from "lucide-react";
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
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPetType, setSelectedPetType] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedPetType, sortBy, sortDirection]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: t('common.error'),
        description: t('marketplace.noProductsDesc'),
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

    // Apply sorting
    if (sortBy !== "none") {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === "price") {
          comparison = a.price - b.price;
        } else if (sortBy === "name") {
          comparison = a.name.localeCompare(b.name);
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    setFilteredProducts(filtered);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  const addToCart = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('marketplace.loginRequired'),
        description: t('marketplace.loginRequiredDesc'),
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
        title: t('common.error'),
        description: t('marketplace.noProductsDesc'),
        variant: "destructive",
      });
    } else {
      setCartItems({ ...cartItems, [productId]: newQty });
      toast({
        title: t('marketplace.addedToCart'),
      });
      // Dispatch custom event to update header cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
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
        // Dispatch custom event to update header cart count
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`marketplace.categories.${category}`) || category;
  };

  const getPetTypeLabel = (type: string) => {
    return t(`marketplace.petTypes.${type}`) || type;
  };

  const totalCartItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-background pt-14 sm:pt-16 md:pt-20">
      {/* Marketplace Header - Sticky */}
      <div className="sticky top-14 sm:top-16 md:top-20 z-40 border-b border-border bg-card/95 backdrop-blur-lg header-shadow">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="flex-shrink-0 touch-manipulation">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">{t('marketplace.title')}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  {t('marketplace.subtitle')}
                </p>
              </div>
            </div>

            <Button className="btn-hero relative flex-shrink-0 h-10 sm:h-11 px-3 sm:px-4 touch-manipulation" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">{t('header.cart')}</span>
              {totalCartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-destructive text-xs px-1.5 min-w-[20px]">
                  {totalCartItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters - Sticky */}
      <div className="sticky top-[88px] sm:top-[96px] md:top-[112px] z-30 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            <div className="sm:col-span-2 md:col-span-2">
              <div className="relative" data-tour="marketplace-search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
                <Input
                  placeholder={t('marketplace.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base" data-tour="marketplace-category">
                <SelectValue placeholder={t('marketplace.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('marketplace.allCategories')}</SelectItem>
                <SelectItem value="food">{t('marketplace.categories.food')}</SelectItem>
                <SelectItem value="toy">{t('marketplace.categories.toy')}</SelectItem>
                <SelectItem value="accessory">{t('marketplace.categories.accessory')}</SelectItem>
                <SelectItem value="medicine">{t('marketplace.categories.medicine')}</SelectItem>
                <SelectItem value="grooming">{t('marketplace.categories.grooming')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPetType} onValueChange={setSelectedPetType}>
              <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base" data-tour="marketplace-pet-type">
                <SelectValue placeholder={t('marketplace.petType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('marketplace.allPets')}</SelectItem>
                <SelectItem value="dog">{t('marketplace.petTypes.dog')}</SelectItem>
                <SelectItem value="cat">{t('marketplace.petTypes.cat')}</SelectItem>
                <SelectItem value="bird">{t('marketplace.petTypes.bird')}</SelectItem>
                <SelectItem value="fish">{t('marketplace.petTypes.fish')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 sm:col-span-2 md:col-span-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base" data-tour="marketplace-sort">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không sắp xếp</SelectItem>
                  <SelectItem value="price">Giá tiền</SelectItem>
                  <SelectItem value="name">Tên sản phẩm</SelectItem>
                </SelectContent>
              </Select>
              
              {sortBy !== "none" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortDirection}
                  title={sortDirection === "asc" ? "Từ thấp đến cao" : "Từ cao đến thấp"}
                  className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0 touch-manipulation"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - 4 Column Modern Layout */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-5xl sm:text-6xl md:text-7xl mb-4 animate-fade-in">🛍️</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('marketplace.noProducts')}</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
              {t('marketplace.noProductsDesc')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {filteredProducts.map((product, index) => (
              <Card 
                key={product.id} 
                className="group overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer touch-manipulation"
                onClick={() => navigate(`/product/${product.id}`)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image Section with Hover Effect */}
                <div className="aspect-square bg-muted/30 relative overflow-hidden">
                  <img
                    src={product.image_url || "https://via.placeholder.com/300"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Category Badge */}
                  <Badge className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-xs sm:text-sm font-semibold shadow-lg">
                    {getCategoryLabel(product.category)}
                  </Badge>
                  
                  {/* Pet Type Icon */}
                  {product.pet_type && (
                    <div className="absolute top-3 left-3 w-8 h-8 sm:w-10 sm:h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center text-lg sm:text-xl shadow-lg">
                      {getPetTypeLabel(product.pet_type).split(" ")[0]}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Title and Brand */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-base sm:text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{product.brand}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Price and Stock */}
                  <div className="flex items-end justify-between pt-2">
                    <div>
                      <span className="text-xl sm:text-2xl font-bold text-primary block">
                        {product.price.toLocaleString()}đ
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Còn {product.stock} sp
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {cartItems[product.id] ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(product.id, -1);
                          }}
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full touch-manipulation hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="flex-1 text-center font-bold text-lg">
                          {cartItems[product.id]}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(product.id, 1);
                          }}
                          disabled={cartItems[product.id] >= product.stock}
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full touch-manipulation hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full btn-hero h-11 sm:h-12 text-sm sm:text-base font-semibold touch-manipulation shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product.id);
                        }}
                        disabled={product.stock === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {t('marketplace.addToCart')}
                      </Button>
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

export default Marketplace;
