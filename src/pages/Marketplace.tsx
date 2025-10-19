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
  }, [products, searchQuery, selectedCategory, selectedPetType]);

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

    setFilteredProducts(filtered);
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
                <h1 className="text-2xl font-bold text-foreground">{t('marketplace.title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('marketplace.subtitle')}
                </p>
              </div>
            </div>

            <Button className="btn-hero relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5 mr-2" />
              {t('header.cart')}
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
                  placeholder={t('marketplace.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
              <SelectTrigger>
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
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold mb-2">{t('marketplace.noProducts')}</h2>
            <p className="text-muted-foreground">
              {t('marketplace.noProductsDesc')}
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
                      {t('marketplace.stock')} {product.stock}
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
                      {t('marketplace.addToCart')}
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
