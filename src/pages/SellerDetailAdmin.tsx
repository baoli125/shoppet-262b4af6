import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Package, ShoppingCart, TrendingUp, Star, Phone, Mail, Calendar, CheckCircle, XCircle, Clock, Truck, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SellerDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<"admin" | "manager" | null>(null);

  useEffect(() => {
    checkAccessAndFetch();
  }, [id]);

  const checkAccessAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }

    const { data: myRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = myRoles?.map(r => r.role) || [];
    if (roleList.includes("admin")) setMyRole("admin");
    else if (roleList.includes("manager")) setMyRole("manager");
    else { navigate("/"); return; }

    if (!id) return;

    // Fetch all data in parallel
    const [profileRes, rolesRes, productsRes, ordersRes, petsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("user_roles").select("role").eq("user_id", id),
      supabase.from("products").select("*").eq("seller_id", id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").eq("seller_id", id).order("created_at", { ascending: false }),
      supabase.from("pets").select("*").eq("user_id", id),
    ]);

    if (profileRes.error || !profileRes.data) {
      toast({ title: "Lỗi", description: "Không tìm thấy người dùng", variant: "destructive" });
      navigate("/admin");
      return;
    }

    setSeller(profileRes.data);
    setRoles(rolesRes.data?.map(r => r.role) || []);
    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setPets(petsRes.data || []);
    setLoading(false);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const statusLabels: Record<string, string> = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận",
    shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy",
  };

  const statusIcons: Record<string, any> = {
    pending: Clock, confirmed: CheckCircle, shipping: Truck, delivered: CheckCircle, cancelled: Ban,
  };

  const categoryLabels: Record<string, string> = {
    food: "Thức ăn", toy: "Đồ chơi", accessory: "Phụ kiện",
    medicine: "Thuốc", grooming: "Chăm sóc", other: "Khác",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!seller) return null;

  // Stats
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeProducts = products.filter(p => p.is_active);
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Chi tiết Seller</h1>
          <p className="text-xs text-muted-foreground">Thông tin cửa hàng và hoạt động kinh doanh</p>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Seller Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-shrink-0">
                {seller.avatar_url ? (
                  <img src={seller.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{seller.display_name}</h2>
                  {roles.map(role => (
                    <Badge key={role} variant={role === "admin" ? "default" : role === "seller" ? "secondary" : "outline"}>
                      {role}
                    </Badge>
                  ))}
                  {seller.is_deleted && <Badge variant="destructive">Đã xóa</Badge>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{seller.email || "N/A"}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{seller.phone || "Chưa cập nhật"}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Tham gia: {new Date(seller.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                {myRole === "admin" && (
                  <p className="text-xs text-muted-foreground font-mono">ID: {seller.id}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{products.length}</div>
            <div className="text-[11px] text-muted-foreground">Tổng sản phẩm</div>
          </Card>
          <Card className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold">{activeProducts.length}</div>
            <div className="text-[11px] text-muted-foreground">Đang bán</div>
          </Card>
          <Card className="p-3 text-center">
            <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{orders.length}</div>
            <div className="text-[11px] text-muted-foreground">Tổng đơn hàng</div>
          </Card>
          <Card className="p-3 text-center">
            <Truck className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold">{deliveredOrders.length}</div>
            <div className="text-[11px] text-muted-foreground">Giao thành công</div>
          </Card>
          <Card className="p-3 text-center">
            <Ban className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <div className="text-xl font-bold">{cancelledOrders.length}</div>
            <div className="text-[11px] text-muted-foreground">Đã hủy</div>
          </Card>
          <Card className="p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
            <div className="text-[11px] text-muted-foreground">Doanh thu</div>
          </Card>
        </div>

        {/* Tabs: Products & Orders */}
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Sản phẩm ({products.length})</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng ({orders.length})</TabsTrigger>
            <TabsTrigger value="info">Thông tin thêm</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="p-4">
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Seller chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Tồn kho</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(product => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url && (
                                <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{product.name}</div>
                                {product.brand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{categoryLabels[product.category] || product.category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{formatPrice(product.price)}</TableCell>
                          <TableCell>
                            <span className={product.stock <= 0 ? "text-destructive font-medium" : product.stock <= 5 ? "text-yellow-600 font-medium" : ""}>
                              {product.stock || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            {product.is_active ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">Đang bán</Badge>
                            ) : (
                              <Badge variant="secondary">Ngưng bán</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(product.created_at).toLocaleDateString("vi-VN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="p-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => {
                        const StatusIcon = statusIcons[order.status] || Clock;
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                {order.order_items?.map((item: any) => (
                                  <div key={item.id} className="text-xs">
                                    {item.product_name} <span className="text-muted-foreground">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}
                                className="gap-1"
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("vi-VN")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Extra Info Tab */}
          <TabsContent value="info">
            <Card className="p-4">
              <div className="space-y-6">
                {/* User stats */}
                <div>
                  <h3 className="font-semibold mb-3">Thống kê chi tiết</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Điểm tích lũy</div>
                      <div className="font-semibold text-lg">{seller.points || 0}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Tổng tồn kho</div>
                      <div className="font-semibold text-lg">{totalStock}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Đơn chờ xử lý</div>
                      <div className="font-semibold text-lg">{pendingOrders.length}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Tỷ lệ giao thành công</div>
                      <div className="font-semibold text-lg">
                        {orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0}%
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Tỷ lệ hủy</div>
                      <div className="font-semibold text-lg text-destructive">
                        {orders.length > 0 ? Math.round((cancelledOrders.length / orders.length) * 100) : 0}%
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs">Đã hoàn tất onboarding</div>
                      <div className="font-semibold">{seller.has_completed_onboarding ? "Có" : "Chưa"}</div>
                    </div>
                  </div>
                </div>

                {/* Pets */}
                <div>
                  <h3 className="font-semibold mb-3">Thú cưng ({pets.length})</h3>
                  {pets.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Chưa đăng ký thú cưng</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pets.map(pet => (
                        <div key={pet.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                          {pet.image_url ? (
                            <img src={pet.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                              {pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐈" : "🐾"}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{pet.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {pet.type} {pet.breed ? `• ${pet.breed}` : ""} {pet.weight ? `• ${pet.weight}kg` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDetailAdmin;
