import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock: number;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4);

    if (data) {
      setProducts(data);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Thức ăn",
      toy: "Đồ chơi",
      accessory: "Phụ kiện",
      medicine: "Thuốc",
      grooming: "Vệ sinh",
    };
    return labels[category] || category;
  };

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Sản phẩm nổi bật
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Những sản phẩm chất lượng cao được lựa chọn kỹ lưỡng cho thú cưng của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="product-card cursor-pointer group"
              onClick={() => navigate(`/product/${product.id}`)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img
                  src={product.image_url || "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
                  {getCategoryLabel(product.category)}
                </Badge>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl md:text-2xl font-bold text-primary">
                    {product.price.toLocaleString()}đ
                  </span>
                  <Button
                    size="icon"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center animate-fade-in-up">
          <Button
            size="lg"
            className="btn-hero"
            onClick={() => navigate("/marketplace")}
          >
            Xem tất cả sản phẩm
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
