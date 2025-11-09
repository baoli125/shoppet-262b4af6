import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
  const { elementRef, isVisible } = useScrollAnimation();

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

        <div 
          ref={elementRef}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {products.map((product, index) => (
            <Card
              key={product.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-accent/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group"
              onClick={() => navigate(`/product/${product.id}`)}
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img
                  src={product.image_url || "https://via.placeholder.com/300"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <Badge className="absolute top-2 right-2 md:top-3 md:right-3 bg-secondary text-secondary-foreground shadow-md text-xs">
                  {getCategoryLabel(product.category)}
                </Badge>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-3 md:p-5">
                <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2 line-clamp-2 group-hover:text-accent transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2 md:mb-3 hidden sm:block">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-base md:text-2xl font-bold text-accent">
                    {product.price.toLocaleString()}đ
                  </span>
                  <Button
                    size="icon"
                    className="rounded-full bg-accent hover:bg-accent-hover transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg w-8 h-8 md:w-10 md:h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${product.id}`);
                    }}
                  >
                    <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold px-6 md:px-8 py-5 md:py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm md:text-base"
            onClick={() => navigate("/marketplace")}
          >
            Khám phá ngay
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
