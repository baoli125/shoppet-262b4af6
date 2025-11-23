import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Calendar, ShoppingBag, Syringe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface FoodSpending {
  total: number;
  thisMonth: number;
  products: { name: string; amount: number; count: number }[];
}

interface VaccineTimeline {
  id: string;
  petName: string;
  vaccineName: string;
  date: string;
  nextDate: string | null;
  clinic: string | null;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [foodSpending, setFoodSpending] = useState<FoodSpending>({
    total: 0,
    thisMonth: 0,
    products: [],
  });
  const [vaccineTimeline, setVaccineTimeline] = useState<VaccineTimeline[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      await Promise.all([fetchFoodSpending(user.id), fetchVaccineTimeline(user.id)]);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const fetchFoodSpending = async (userId: string) => {
    // Get all completed orders for food products
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        created_at,
        order_items (
          product_name,
          product_price,
          quantity,
          products (category)
        )
      `)
      .eq("user_id", userId)
      .eq("status", "delivered");

    if (orders) {
      let total = 0;
      let thisMonth = 0;
      const productMap = new Map<string, { amount: number; count: number }>();
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      orders.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          if (item.products?.category === "food") {
            const amount = item.product_price * item.quantity;
            total += amount;
            
            if (new Date(order.created_at) >= thisMonthStart) {
              thisMonth += amount;
            }

            const existing = productMap.get(item.product_name) || { amount: 0, count: 0 };
            productMap.set(item.product_name, {
              amount: existing.amount + amount,
              count: existing.count + item.quantity,
            });
          }
        });
      });

      setFoodSpending({
        total,
        thisMonth,
        products: Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
      });
    }
  };

  const fetchVaccineTimeline = async (userId: string) => {
    // Get all pets and their vaccines
    const { data: pets } = await supabase
      .from("pets")
      .select(`
        id,
        name,
        vaccines (
          id,
          name,
          date,
          next_date,
          clinic
        )
      `)
      .eq("user_id", userId);

    if (pets) {
      const timeline: VaccineTimeline[] = [];
      pets.forEach((pet: any) => {
        pet.vaccines?.forEach((vaccine: any) => {
          timeline.push({
            id: vaccine.id,
            petName: pet.name,
            vaccineName: vaccine.name,
            date: vaccine.date,
            nextDate: vaccine.next_date,
            clinic: vaccine.clinic,
          });
        });
      });
      
      // Sort by date descending
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setVaccineTimeline(timeline);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">📊 Thống kê & Phân tích</h1>

        <Tabs defaultValue="food" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="food">Chi tiêu thức ăn</TabsTrigger>
            <TabsTrigger value="vaccines">Lịch sử tiêm chủng</TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(foodSpending.total)}</div>
                  <p className="text-xs text-muted-foreground">Tất cả thời gian</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tháng này</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(foodSpending.thisMonth)}</div>
                  <p className="text-xs text-muted-foreground">
                    {foodSpending.total > 0 
                      ? `${Math.round((foodSpending.thisMonth / foodSpending.total) * 100)}% tổng chi tiêu`
                      : "Chưa có chi tiêu"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Sản phẩm mua nhiều nhất</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{foodSpending.products.length}</div>
                  <p className="text-xs text-muted-foreground">Loại sản phẩm khác nhau</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 sản phẩm thức ăn</CardTitle>
                <CardDescription>Các sản phẩm bạn mua nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {foodSpending.products.length > 0 ? (
                  <div className="space-y-4">
                    {foodSpending.products.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.count} lần mua
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(product.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có dữ liệu chi tiêu thức ăn
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vaccines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Timeline tiêm chủng
                </CardTitle>
                <CardDescription>Lịch sử tiêm chủng của tất cả thú cưng</CardDescription>
              </CardHeader>
              <CardContent>
                {vaccineTimeline.length > 0 ? (
                  <div className="space-y-4">
                    {vaccineTimeline.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-primary rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{item.vaccineName}</p>
                              <p className="text-sm text-muted-foreground">{item.petName}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.date), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </p>
                          </div>
                          {item.clinic && (
                            <p className="text-sm text-muted-foreground">🏥 {item.clinic}</p>
                          )}
                          {item.nextDate && (
                            <p className="text-sm font-medium text-primary">
                              ⏰ Lần tiếp theo: {new Date(item.nextDate).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Chưa có lịch sử tiêm chủng
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
