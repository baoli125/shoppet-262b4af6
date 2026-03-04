import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, Plus, Minus, Package, Flame, Leaf, Info, Heart, Star, Store, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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

// === INTERFACES CHO TÍNH NĂNG NHÀ CUNG CẤP ===
interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  content: string;
}

interface Supplier {
  id: string;
  name: string;
  logo: string;
  price: number;
  rating: number;
  stats: { total: number; s5: number; s4: number; s3: number; s2: number; s1: number };
  reviews: Review[];
}

// === MOCK DATA GIẢ ĐỊNH ===
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "s1", name: "PetMart VN", logo: "https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=0284c7", price: 155000, rating: 4.9,
    stats: { total: 124, s5: 110, s4: 10, s3: 4, s2: 0, s1: 0 },
    reviews: [
      { id: "r1", userName: "Nguyễn Văn A", rating: 5, date: "2023-10-15", content: "Giao hàng cực nhanh, date mới tinh." },
      { id: "r2", userName: "Trần Thị B", rating: 4, date: "2023-10-10", content: "Đóng gói cẩn thận nhưng hộp hơi móp một chút." },
      { id: "r3", userName: "Lê C", rating: 3, date: "2023-09-01", content: "Giao hàng hơi chậm so với dự kiến." }
    ]
  },
  {
    id: "s2", name: "Paws & Claws", logo: "https://api.dicebear.com/7.x/initials/svg?seed=PC&backgroundColor=16a34a", price: 150000, rating: 4.9,
    stats: { total: 124, s5: 80, s4: 5, s3: 4, s2: 0, s1: 0 }, // Cùng rate, cùng total, giá rẻ hơn s1 -> sẽ xếp trước s1
    reviews: [
      { id: "r4", userName: "Lê Hoàng", rating: 5, date: "2023-09-20", content: "Shop tư vấn nhiệt tình, giá rẻ nhất thị trường." },
      { id: "r5", userName: "Phạm D", rating: 5, date: "2023-09-15", content: "Tuyệt vời, sẽ ủng hộ tiếp." }
    ]
  },
  {
    id: "s3", name: "CityZoo SG", logo: "https://api.dicebear.com/7.x/initials/svg?seed=CZ&backgroundColor=d97706", price: 158000, rating: 4.5,
    stats: { total: 45, s5: 30, s4: 10, s3: 5, s2: 0, s1: 0 },
    reviews: [
      { id: "r6", userName: "Vũ E", rating: 4, date: "2023-08-11", content: "Sản phẩm tốt." }
    ]
  },
  {
    id: "s4", name: "HappyPet", logo: "https://api.dicebear.com/7.x/initials/svg?seed=HP&backgroundColor=dc2626", price: 160000, rating: 4.7,
    stats: { total: 200, s5: 150, s4: 40, s3: 10, s2: 0, s1: 0 },
    reviews: []
  },
  {
    id: "s5", name: "Doggo & Meow", logo: "https://api.dicebear.com/7.x/initials/svg?seed=DM&backgroundColor=7c3aed", price: 149000, rating: 4.6,
    stats: { total: 56, s5: 40, s4: 10, s3: 6, s2: 0, s1: 0 },
    reviews: []
  }
];

// THUẬT TOÁN SẮP XẾP: 1. Rating giảm dần -> 2. Số lượng đánh giá giảm dần -> 3. Giá tăng dần
const SORTED_SUPPLIERS = [...MOCK_SUPPLIERS].sort((a, b) => {
  if (b.rating !== a.rating) return b.rating - a.rating;
  if (b.stats.total !== a.stats.total) return b.stats.total - a.stats.total;
  return a.price - b.price;
});

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

  // States cho tính năng Nhà Cung Cấp
  const [suppliers] = useState<Supplier[]>(SORTED_SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // States cho Popup 1 (Xem chi tiết 1 nhà cung cấp)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // States cho Popup 2 (So sánh 2 nhà cung cấp)
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareA, setCompareA] = useState<Supplier | null>(SORTED_SUPPLIERS[0]);
  const [compareB, setCompareB] = useState<Supplier | null>(SORTED_SUPPLIERS[1]);
  const [compareFilterA, setCompareFilterA] = useState<string>('all');
  const [compareFilterB, setCompareFilterB] = useState<string>('all');

  // Tính giá trung bình
  const avgPrice = Math.round(suppliers.reduce((acc, curr) => acc + curr.price, 0) / suppliers.length);

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
    const { data } = await supabase.from("pets").select("*").eq("user_id", user.id);
    if (data) setUserPets(data);
  };

  const fetchRelatedProducts = async (category: string, currentId: string) => {
    const { data } = await supabase.from("products").select("*").eq("is_active", true).eq("category", category as any).neq("id", currentId).limit(8);
    if (data) setRelatedProducts(data);
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) {
      toast({ title: "Lỗi", description: "Không thể tải thông tin sản phẩm", variant: "destructive" });
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
    const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id).eq("product_id", id).single();
    if (data) setCartQuantity(data.quantity);
  };

  const addToCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để thêm vào giỏ", variant: "destructive" });
      return;
    }

    let finalSupplier = selectedSupplier;
    if (!finalSupplier) {
      // Vì mảng đã được sort chuẩn nhất từ trên xuống, chỉ cần lấy ông đầu tiên
      finalSupplier = suppliers[0];
      setSelectedSupplier(finalSupplier);
      toast({
        title: "Đã chọn tự động",
        description: `Hệ thống chọn nhà cung cấp tốt nhất: ${finalSupplier.name} (${finalSupplier.rating}⭐)`,
      });
    }

    const newQty = cartQuantity + quantity;
    const { error } = await supabase.from("cart_items").upsert({
      user_id: user.id,
      product_id: id!,
      quantity: newQty,
    });

    if (error) {
      toast({ title: "Lỗi", description: "Không thể thêm sản phẩm vào giỏ hàng", variant: "destructive" });
    } else {
      setCartQuantity(newQty);
      toast({ title: "Đã thêm vào giỏ hàng", description: `${quantity} sản phẩm từ ${finalSupplier.name} đã được thêm.` });
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { food: "Thức ăn", toy: "Đồ chơi", accessory: "Phụ kiện", medicine: "Thuốc & Y tế", grooming: "Chăm sóc" };
    return labels[cat] || cat;
  };

  const getPetTypeLabel = (type: string) => {
    const labels: Record<string, string> = { dog: "🐕 Chó", cat: "🐱 Mèo", bird: "🐦 Chim", fish: "🐟 Cá" };
    return labels[type] || type;
  };

  // Hàm tiện ích: Lọc & sắp xếp đánh giá
  const getFilteredAndSortedReviews = (reviews: Review[], filterValue: string) => {
    let filtered = reviews;
    if (filterValue !== 'all') {
      filtered = reviews.filter(r => r.rating.toString() === filterValue);
    }
    // Ưu tiên hiện đánh giá 5 sao lên đầu
    return filtered.sort((a, b) => b.rating - a.rating);
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" onClick={() => navigate("/marketplace")} className="gap-1.5 h-10">
              <ArrowLeft className="w-4 h-4" /> <span>Quay lại</span>
            </Button>
            <h1 className="text-xl font-bold">Chi tiết sản phẩm</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10">
          
          {/* Cột trái: Hình ảnh */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-300">
              <div className="bg-gradient-to-br from-background to-muted/30 relative aspect-square flex items-center justify-center p-6">
                <img src={product.image_url || "https://via.placeholder.com/600"} alt={product.name} className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              {product.weight && (
                <Card className="p-4 text-center">
                  <Package className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Trọng lượng</p>
                  <p className="font-semibold text-sm">{product.weight}</p>
                </Card>
              )}
              {product.calories && (
                <Card className="p-4 text-center">
                  <Flame className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Năng lượng</p>
                  <p className="font-semibold text-sm">{product.calories} kcal</p>
                </Card>
              )}
            </div>
          </div>

          {/* Cột phải: Thông tin & Tương tác mua hàng */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 flex-wrap">
                <Badge className="bg-primary text-sm font-semibold px-3 py-1">{getCategoryLabel(product.category)}</Badge>
                {product.pet_type && <Badge variant="outline" className="text-sm font-semibold px-3 py-1 border-2">{getPetTypeLabel(product.pet_type)}</Badge>}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">{product.name}</h1>
              <p className="text-base text-muted-foreground">{product.description}</p>
            </div>

            {/* PHẦN NHÀ CUNG CẤP & GIÁ */}
            <div className="bg-accent/5 rounded-2xl p-5 border border-accent/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giá tham khảo trung bình</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-primary">
                      {selectedSupplier ? selectedSupplier.price.toLocaleString() : avgPrice.toLocaleString()}đ
                    </span>
                    {selectedSupplier && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Đang chọn: {selectedSupplier.name}</Badge>
                    )}
                  </div>
                </div>
                
                <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10" onClick={() => setIsCompareOpen(true)}>
                  <Scale className="w-4 h-4 text-primary" /> So sánh nhà cung cấp
                </Button>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4" /> Nhà cung cấp hiện có:
                </p>
                <div className="flex items-center gap-3">
                  {suppliers.slice(0, 5).map(supplier => (
                    <div 
                      key={supplier.id}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setViewingSupplier(supplier);
                        setActiveFilter('all'); // Reset filter khi mở
                      }}
                    >
                      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200 ${selectedSupplier?.id === supplier.id ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-border hover:border-primary/50 hover:scale-105'}`}>
                        <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                        {supplier.name}
                      </div>
                    </div>
                  ))}
                  {suppliers.length > 5 && (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-border text-xs font-bold text-muted-foreground cursor-pointer">
                      +{suppliers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Số lượng và Add to cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-base font-semibold">Số lượng:</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 rounded-full border-2"><Minus className="w-4 h-4" /></Button>
                  <span className="w-12 text-center font-bold text-xl">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="h-10 w-10 rounded-full border-2"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 btn-hero text-lg py-6 h-14 font-semibold shadow-xl" onClick={addToCart} disabled={product.stock === 0}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {selectedSupplier ? "Thêm vào giỏ hàng" : "Chọn mua tự động"}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 border-2"><Heart className="w-5 h-5" /></Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 h-[2px] bg-blue-500 rounded-full opacity-50" />

        {/* Thông tin chi tiết */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Thông tin chi tiết</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {product.ingredients && (
              <Card className="p-6 border-2 hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Leaf className="w-6 h-6 text-primary" /></div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Thành phần</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.ingredients}</p>
                  </div>
                </div>
              </Card>
            )}
            {product.nutritional_info && (
              <Card className="p-6 border-2 hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0"><Info className="w-6 h-6 text-accent" /></div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Thông tin dinh dưỡng</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{product.nutritional_info}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* SẢN PHẨM TƯƠNG TỰ (Đã được khôi phục) */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16 md:mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Sản phẩm tương tự</h2>
              <Button variant="outline" onClick={() => navigate("/marketplace")}>
                Xem tất cả
              </Button>
            </div>
            
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
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

      {/* ======================================================= */}
      {/* POPUP 1: ĐÁNH GIÁ NHÀ CUNG CẤP (CHUẨN SHOPEE)             */}
      {/* ======================================================= */}
      <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingSupplier && (
            <>
              <DialogHeader className="mb-4">
                <DialogTitle className="hidden">Đánh giá nhà cung cấp</DialogTitle>
                <div className="flex flex-col items-center text-center space-y-2 mt-4">
                  <img src={viewingSupplier.logo} alt="logo" className="w-20 h-20 rounded-full border-4 border-muted" />
                  <h2 className="text-2xl font-bold text-primary">{viewingSupplier.name}</h2>
                  <p className="text-sm font-medium text-muted-foreground">{product.name}</p>
                  <p className="text-3xl font-black text-destructive mt-2">{viewingSupplier.price.toLocaleString()}đ</p>
                </div>
              </DialogHeader>

              <Separator className="my-2" />

              <div className="bg-orange-50/50 p-4 rounded-xl flex flex-col md:flex-row gap-6 items-center border border-orange-100">
                <div className="text-center md:w-1/3">
                  <div className="text-4xl font-bold text-orange-500 mb-1">
                    {viewingSupplier.rating} <span className="text-lg">/ 5</span>
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`w-5 h-5 ${star <= Math.round(viewingSupplier.rating) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{viewingSupplier.stats.total} Đánh giá</p>
                </div>

                {/* BỘ LỌC ĐÃ ĐƯỢC KẾT NỐI VỚI STATE activeFilter */}
                <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge variant={activeFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer px-4 py-2 text-sm" onClick={() => setActiveFilter('all')}>
                    Tất cả
                  </Badge>
                  <Badge variant={activeFilter === '5' ? 'default' : 'outline'} className="cursor-pointer px-4 py-2 text-sm" onClick={() => setActiveFilter('5')}>
                    5 Sao ({viewingSupplier.stats.s5})
                  </Badge>
                  <Badge variant={activeFilter === '4' ? 'default' : 'outline'} className="cursor-pointer px-4 py-2 text-sm" onClick={() => setActiveFilter('4')}>
                    4 Sao ({viewingSupplier.stats.s4})
                  </Badge>
                  <Badge variant={activeFilter === '3' ? 'default' : 'outline'} className="cursor-pointer px-4 py-2 text-sm" onClick={() => setActiveFilter('3')}>
                    3 Sao ({viewingSupplier.stats.s3})
                  </Badge>
                </div>
              </div>

              {/* LIST REVIEW ĐÃ ĐƯỢC FILTER */}
              <div className="mt-6 space-y-4">
                {getFilteredAndSortedReviews(viewingSupplier.reviews, activeFilter).length > 0 ? (
                  getFilteredAndSortedReviews(viewingSupplier.reviews, activeFilter).map(review => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                          {review.userName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{review.userName}</p>
                          <div className="flex gap-0.5 my-1">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{review.date}</p>
                          <p className="text-sm">{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">Chưa có đánh giá nào cho bộ lọc này.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t sticky bottom-0 bg-background">
                <Button 
                  className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setSelectedSupplier(viewingSupplier);
                    setViewingSupplier(null);
                    toast({ title: "Đã chọn", description: `Bạn đã chọn mua từ ${viewingSupplier.name}` });
                  }}
                >
                  Chọn mua từ nhà cung cấp này
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* POPUP 2: SO SÁNH NHÀ CUNG CẤP (ĐÃ NÂNG CẤP FILTER & REVIEW) */}
      {/* ======================================================= */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" /> So sánh nhà cung cấp
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* ====== CỘT A ====== */}
            <div className="space-y-4 border-r pr-6">
              <select 
                className="w-full p-2 border rounded-md font-semibold"
                value={compareA?.id || ''}
                onChange={(e) => {
                  setCompareA(suppliers.find(s => s.id === e.target.value) || null);
                  setCompareFilterA('all');
                }}
              >
                {suppliers.map(s => <option key={`A-${s.id}`} value={s.id}>{s.name} ({s.price.toLocaleString()}đ)</option>)}
              </select>
              
              {compareA && (
                <>
                  <div className="text-center bg-muted/30 p-4 rounded-xl relative">
                    {selectedSupplier?.id === compareA.id && <Badge className="absolute top-2 left-2">Đang chọn</Badge>}
                    <img src={compareA.logo} className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary">{compareA.price.toLocaleString()}đ</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-orange-500 font-bold">
                      <Star className="w-4 h-4 fill-orange-500" /> {compareA.rating} / 5
                    </div>
                  </div>

                  {/* Filter A */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant={compareFilterA === 'all' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterA('all')}>Tất cả</Badge>
                    <Badge variant={compareFilterA === '5' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterA('5')}>5 Sao</Badge>
                    <Badge variant={compareFilterA === '4' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterA('4')}>4 Sao</Badge>
                    <Badge variant={compareFilterA === '3' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterA('3')}>3 Sao</Badge>
                  </div>

                  {/* Reviews A */}
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                    {getFilteredAndSortedReviews(compareA.reviews, compareFilterA).map(review => (
                      <div key={`compA-${review.id}`} className="bg-muted/20 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{review.userName}</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.content}</p>
                      </div>
                    ))}
                    {getFilteredAndSortedReviews(compareA.reviews, compareFilterA).length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">Chưa có bình luận.</p>
                    )}
                  </div>
                  
                  <Button className="w-full" variant={selectedSupplier?.id === compareA.id ? "secondary" : "default"} onClick={() => setSelectedSupplier(compareA)}>
                    {selectedSupplier?.id === compareA.id ? "Đã chọn" : "Chọn nhà cung cấp này"}
                  </Button>
                </>
              )}
            </div>

            {/* ====== CỘT B ====== */}
            <div className="space-y-4 pl-2">
              <select 
                className="w-full p-2 border rounded-md font-semibold"
                value={compareB?.id || ''}
                onChange={(e) => {
                  setCompareB(suppliers.find(s => s.id === e.target.value) || null);
                  setCompareFilterB('all');
                }}
              >
                {suppliers.map(s => <option key={`B-${s.id}`} value={s.id}>{s.name} ({s.price.toLocaleString()}đ)</option>)}
              </select>
              
              {compareB && (
                <>
                  <div className="text-center bg-muted/30 p-4 rounded-xl relative">
                    {selectedSupplier?.id === compareB.id && <Badge className="absolute top-2 left-2">Đang chọn</Badge>}
                    <img src={compareB.logo} className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary">{compareB.price.toLocaleString()}đ</p>
                    <div className="flex items-center justify-center gap-1 mt-2 text-orange-500 font-bold">
                      <Star className="w-4 h-4 fill-orange-500" /> {compareB.rating} / 5
                    </div>
                  </div>

                  {/* Filter B */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant={compareFilterB === 'all' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterB('all')}>Tất cả</Badge>
                    <Badge variant={compareFilterB === '5' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterB('5')}>5 Sao</Badge>
                    <Badge variant={compareFilterB === '4' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterB('4')}>4 Sao</Badge>
                    <Badge variant={compareFilterB === '3' ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setCompareFilterB('3')}>3 Sao</Badge>
                  </div>

                  {/* Reviews B */}
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                    {getFilteredAndSortedReviews(compareB.reviews, compareFilterB).map(review => (
                      <div key={`compB-${review.id}`} className="bg-muted/20 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{review.userName}</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.content}</p>
                      </div>
                    ))}
                    {getFilteredAndSortedReviews(compareB.reviews, compareFilterB).length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">Chưa có bình luận.</p>
                    )}
                  </div>

                  <Button className="w-full" variant={selectedSupplier?.id === compareB.id ? "secondary" : "default"} onClick={() => setSelectedSupplier(compareB)}>
                    {selectedSupplier?.id === compareB.id ? "Đã chọn" : "Chọn nhà cung cấp này"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;