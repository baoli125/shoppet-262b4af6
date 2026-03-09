import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Package, ShoppingCart, TrendingUp, Phone, Mail, Calendar, CheckCircle, Clock, Truck, Ban, MapPin, Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xác nhận", icon: Clock, variant: "secondary" },
  confirmed: { label: "Đã xác nhận", icon: CheckCircle, variant: "outline" },
  shipping: { label: "Đang giao", icon: Truck, variant: "default" },
  delivered: { label: "Đã giao", icon: CheckCircle, variant: "default" },
  cancelled: { label: "Đã hủy", icon: Ban, variant: "destructive" },
};

// Trạng thái tiếp theo mà seller có thể chuyển
const NEXT_STATUS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["delivered"],
};

const SellerDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<Record<string, any>>({});
  const [pets, setPets] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<"admin" | "manager" | null>(null);
  const [orderDetailId, setOrderDetailId] = useState<string | null>(null);
  const [statusUpdateOrder, setStatusUpdateOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

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

    // Fetch buyer profiles before setting loading to false
    if (ordersRes.data && ordersRes.data.length > 0) {
      const buyerIds = [...new Set(ordersRes.data.map((o: any) => o.user_id))];
      const { data: buyerProfiles, error: buyerError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, phone, email")
        .in("id", buyerIds);
      console.log("Buyer profiles fetched:", buyerProfiles, "error:", buyerError);
      if (buyerProfiles) {
        const map: Record<string, any> = {};
        buyerProfiles.forEach(b => { map[b.id] = b; });
        setBuyers(map);
      }
    }

    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateOrder || !newStatus) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", statusUpdateOrder.id);

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái đơn hàng` });
      setStatusUpdateOrder(null);
      setNewStatus("");
      // Refresh orders
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });
      if (data) setOrders(data);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ";

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

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeProducts = products.filter(p => p.is_active);
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const detailOrder = orderDetailId ? orders.find(o => o.id === orderDetailId) : null;
  const detailBuyer = detailOrder ? buyers[detailOrder.user_id] : null;

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

        {/* Tabs */}
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
                <div className="space-y-3">
                  {orders.map(order => {
                    const buyer = buyers[order.user_id];
                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;
                    const nextStatuses = NEXT_STATUS[order.status] || [];
                    // Chỉ hiển thị sản phẩm của seller này
                    const sellerProducts = products.map(p => p.id);
                    const sellerItems = (order.order_items || []).filter((item: any) =>
                      sellerProducts.includes(item.product_id)
                    );
                    const itemsToShow = sellerItems.length > 0 ? sellerItems : order.order_items || [];
                    const sellerSubtotal = itemsToShow.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);

                    return (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors">
                        {/* Header: buyer name + status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{buyer?.display_name || "Khách hàng"}</h4>
                              <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.phone_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.shipping_address}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleString("vi-VN")}
                              </span>
                            </div>
                          </div>
                          <Badge variant={config.variant} className="gap-1 flex-shrink-0">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>

                        {/* Items */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                          {itemsToShow.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product_name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                              <span className="font-medium">{formatPrice(item.subtotal)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-1.5 flex justify-between text-sm font-semibold">
                            <span>Tổng</span>
                            <span>{formatPrice(sellerSubtotal)}</span>
                          </div>
                        </div>

                        {/* Customer notes */}
                        {order.customer_notes && (
                          <p className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                            💬 {order.customer_notes}
                          </p>
                        )}

                        {order.cancel_reason && (
                          <p className="text-xs text-destructive bg-destructive/5 p-2 rounded">
                            ❌ Lý do hủy: {order.cancel_reason}
                          </p>
                        )}

                        {/* Actions */}
                        {nextStatuses.length > 0 && (
                          <div className="flex gap-2 pt-1">
                            {nextStatuses.map(ns => {
                              const nsConfig = STATUS_CONFIG[ns];
                              return (
                                <Button
                                  key={ns}
                                  size="sm"
                                  variant={ns === "cancelled" ? "destructive" : "default"}
                                  onClick={() => {
                                    setStatusUpdateOrder(order);
                                    setNewStatus(ns);
                                  }}
                                  className="text-xs"
                                >
                                  {nsConfig.label}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Extra Info Tab */}
          <TabsContent value="info">
            <Card className="p-4">
              <div className="space-y-6">
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

      {/* Status Update Confirmation Dialog */}
      <Dialog open={!!statusUpdateOrder} onOpenChange={(open) => { if (!open) { setStatusUpdateOrder(null); setNewStatus(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
          </DialogHeader>
          {statusUpdateOrder && (
            <div className="py-2 space-y-3">
              <p className="text-sm">
                Đơn hàng <span className="font-mono font-medium">#{statusUpdateOrder.id.slice(0, 8)}</span> của{" "}
                <strong>{buyers[statusUpdateOrder.user_id]?.display_name || "Khách hàng"}</strong>
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={STATUS_CONFIG[statusUpdateOrder.status]?.variant || "secondary"}>
                  {STATUS_CONFIG[statusUpdateOrder.status]?.label}
                </Badge>
                <span>→</span>
                <Badge variant={STATUS_CONFIG[newStatus]?.variant || "default"}>
                  {STATUS_CONFIG[newStatus]?.label}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusUpdateOrder(null); setNewStatus(""); }}>Hủy</Button>
            <Button
              variant={newStatus === "cancelled" ? "destructive" : "default"}
              onClick={handleUpdateStatus}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDetailAdmin;
