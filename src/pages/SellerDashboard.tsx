import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Plus, Edit, Trash2,
  LogOut, Store, Clock, CheckCircle, Truck, XCircle, Eye, DollarSign,
  AlertCircle, ChevronRight, BarChart3, Menu, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Section = "dashboard" | "orders" | "products" | "revenue";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Đã xác nhận", color: "bg-gray-500", icon: CheckCircle },
  shipping: { label: "Đang giao", color: "bg-[#0068FF]", icon: Truck },
  delivered: { label: "Hoàn thành", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-destructive", icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
  food: "Thức ăn", toy: "Đồ chơi", accessory: "Phụ kiện",
  medicine: "Thuốc", grooming: "Chăm sóc", other: "Khác",
};

// ─── Sidebar ───────────────────────────────────────────
const SellerSidebar = ({ section, onNavigate, profile }: {
  section: Section;
  onNavigate: (s: Section) => void;
  profile: any;
}) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items: { key: Section; label: string; icon: any }[] = [
    { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { key: "orders", label: "Đơn hàng", icon: ShoppingCart },
    { key: "products", label: "Sản phẩm", icon: Package },
    { key: "revenue", label: "Doanh thu", icon: TrendingUp },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Shop info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{profile?.display_name || "Shop"}</div>
                <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.key)}
                    isActive={section === item.key}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

// ─── Main ──────────────────────────────────────────────
const SellerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [section, setSection] = useState<Section>("dashboard");
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  // Product form
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", stock: "", category: "", pet_type: "", brand: "", weight: "", image_url: "", ingredients: "", features: "", usage_instructions: "" });
  
  // Order detail
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [buyers, setBuyers] = useState<Record<string, any>>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { navigate("/"); return; }
      setUser(user);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const hasSeller = roles?.some(r => r.role === "seller");
      setIsSeller(!!hasSeller);
      if (!hasSeller) {
        toast({ title: "Không có quyền", description: "Bạn cần là người bán để truy cập.", variant: "destructive" });
        navigate("/"); return;
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
      await fetchData(user.id);
      setLoading(false);
    });
  }, []);

  const fetchData = async (userId: string) => {
    const [prodRes, orderRes] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").eq("seller_id", userId).order("created_at", { ascending: false }),
    ]);
    setProducts(prodRes.data || []);
    const ordersData = orderRes.data || [];
    setOrders(ordersData);

    // Fetch buyer profiles separately
    const buyerIds = [...new Set(ordersData.map(o => o.user_id))];
    if (buyerIds.length > 0) {
      const { data: buyerProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, email, phone")
        .in("id", buyerIds);
      const map: Record<string, any> = {};
      buyerProfiles?.forEach(b => { map[b.id] = b; });
      setBuyers(map);
    }
  };

  // ─── Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const shippingOrders = orders.filter(o => o.status === "shipping").length;
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const totalRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const todayOrders = orders.filter(o => o.created_at?.startsWith(today)).length;
    const lowStockProducts = products.filter(p => (p.stock || 0) <= 5).length;
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0).length;

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `T${d.getMonth() + 1}`;
      const amount = deliveredOrders
        .filter(o => o.created_at?.startsWith(key))
        .reduce((s, o) => s + Number(o.total_amount), 0);
      monthlyRevenue.push({ month: label, amount });
    }

    return { pendingOrders, shippingOrders, totalRevenue, todayOrders, lowStockProducts, outOfStockProducts, totalProducts: products.length, totalOrders: orders.length, deliveredCount: deliveredOrders.length, monthlyRevenue };
  }, [orders, products]);

  // ─── Product CRUD ──────────────────────────────────
  const resetForm = () => setFormData({ name: "", description: "", price: "", stock: "", category: "", pet_type: "", brand: "", weight: "", image_url: "", ingredients: "", features: "", usage_instructions: "" });

  const handleSubmitProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category: formData.category as any,
        pet_type: (formData.pet_type || null) as any,
        brand: formData.brand || null,
        weight: formData.weight || null,
        image_url: formData.image_url || null,
        ingredients: formData.ingredients || null,
        features: formData.features || null,
        usage_instructions: formData.usage_instructions || null,
      };

      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Cập nhật thành công! ✨" });
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, seller_id: user.id });
        if (error) throw error;
        toast({ title: "Thêm sản phẩm thành công! 🎉" });
      }
      setShowProductDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchData(user.id);
    } catch {
      toast({ title: "Lỗi", description: "Không thể lưu sản phẩm.", variant: "destructive" });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, description: product.description || "", price: product.price.toString(),
      stock: (product.stock || 0).toString(), category: product.category, pet_type: product.pet_type || "",
      brand: product.brand || "", weight: product.weight || "", image_url: product.image_url || "",
      ingredients: product.ingredients || "", features: product.features || "", usage_instructions: product.usage_instructions || "",
    });
    setShowProductDialog(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Đã xóa sản phẩm" });
    fetchData(user.id);
  };

  // ─── Order Actions ─────────────────────────────────
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    if (error) { toast({ title: "Lỗi", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cập nhật thành công!" });
    fetchData(user.id);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><Store className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" /><p className="text-sm text-muted-foreground">Đang tải...</p></div></div>;
  if (!isSeller) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <SellerSidebar section={section} onNavigate={setSection} profile={profile} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 bg-card border-b flex items-center justify-between px-4 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold">Kênh người bán</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Trang chủ
              </Button>
              <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4 mr-1" /> Đăng xuất
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
            {section === "dashboard" && <DashboardSection stats={stats} orders={orders} products={products} onNavigate={setSection} />}
            {section === "orders" && (
              <OrdersSection
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onViewDetail={(o) => { setSelectedOrder(o); setShowOrderDetail(true); }}
              />
            )}
            {section === "products" && (
              <ProductsSection
                products={products}
                onAdd={() => { resetForm(); setEditingProduct(null); setShowProductDialog(true); }}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            )}
            {section === "revenue" && <RevenueSection stats={stats} orders={orders} />}
          </main>
        </div>
      </div>

      {/* Product Dialog */}
      <ProductFormDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitProduct}
        isEditing={!!editingProduct}
      />

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chi tiết đơn hàng</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Mã đơn</span><p className="font-mono text-xs">{selectedOrder.id.slice(0, 8)}...</p></div>
                <div><span className="text-muted-foreground text-xs">Trạng thái</span><div><Badge className={`${STATUS_CONFIG[selectedOrder.status]?.color} text-white text-xs`}>{STATUS_CONFIG[selectedOrder.status]?.label}</Badge></div></div>
                <div><span className="text-muted-foreground text-xs">Khách hàng</span><p className="font-medium">{selectedOrder.profiles?.display_name || "N/A"}</p></div>
                <div><span className="text-muted-foreground text-xs">Tổng tiền</span><p className="font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground text-xs">Địa chỉ</span><p>{selectedOrder.shipping_address}</p></div>
                <div><span className="text-muted-foreground text-xs">SĐT</span><p>{selectedOrder.phone_number}</p></div>
                <div><span className="text-muted-foreground text-xs">Ngày đặt</span><p>{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</p></div>
                {selectedOrder.customer_notes && <div className="col-span-2"><span className="text-muted-foreground text-xs">Ghi chú</span><p>{selectedOrder.customer_notes}</p></div>}
              </div>
              {selectedOrder.order_items?.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Sản phẩm</div>
                  <div className="space-y-1">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm bg-muted/50 rounded p-2">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedOrder.status === "pending" && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, "confirmed"); setShowOrderDetail(false); }}>Xác nhận</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, "cancelled"); setShowOrderDetail(false); }}>Hủy đơn</Button>
                </div>
              )}
              {selectedOrder.status === "confirmed" && (
                <Button className="w-full" onClick={() => { handleUpdateOrderStatus(selectedOrder.id, "shipping"); setShowOrderDetail(false); }}>
                  <Truck className="h-4 w-4 mr-2" /> Giao hàng
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

// ─── Dashboard Section ─────────────────────────────────
const DashboardSection = ({ stats, orders, products, onNavigate }: any) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold mb-1">Tổng quan</h2>
      <p className="text-sm text-muted-foreground">Chào mừng bạn quay lại kênh người bán!</p>
    </div>

    {/* Việc cần làm */}
    {(stats.pendingOrders > 0 || stats.lowStockProducts > 0) && (
      <Card className="p-4 border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-500/5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-600" /> Việc cần làm</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {stats.pendingOrders > 0 && (
            <button onClick={() => onNavigate("orders")} className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-600" /><span className="text-sm">{stats.pendingOrders} đơn chờ xác nhận</span></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {stats.lowStockProducts > 0 && (
            <button onClick={() => onNavigate("products")} className="flex items-center justify-between p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center gap-2"><Package className="h-4 w-4 text-destructive" /><span className="text-sm">{stats.lowStockProducts} sản phẩm sắp hết hàng</span></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </Card>
    )}

    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard icon={ShoppingCart} label="Đơn hàng hôm nay" value={stats.todayOrders} onClick={() => onNavigate("orders")} />
      <StatCard icon={Clock} label="Chờ xác nhận" value={stats.pendingOrders} color="text-yellow-600" onClick={() => onNavigate("orders")} />
      <StatCard icon={Package} label="Sản phẩm" value={stats.totalProducts} onClick={() => onNavigate("products")} />
      <StatCard icon={DollarSign} label="Doanh thu" value={formatPrice(stats.totalRevenue)} onClick={() => onNavigate("revenue")} />
    </div>

    {/* Recent orders */}
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Đơn hàng gần đây</h3>
        <Button variant="ghost" size="sm" onClick={() => onNavigate("orders")} className="text-xs">Xem tất cả <ChevronRight className="h-3 w-3 ml-1" /></Button>
      </div>
      <div className="space-y-2">
        {orders.slice(0, 5).map((order: any) => (
          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                <Badge className={`${STATUS_CONFIG[order.status]?.color} text-white text-[10px] px-1.5`}>{STATUS_CONFIG[order.status]?.label}</Badge>
              </div>
              <p className="text-sm font-medium mt-0.5 truncate">{order.profiles?.display_name || "N/A"}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="font-semibold text-sm">{formatPrice(order.total_amount)}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Chưa có đơn hàng nào</p>}
      </div>
    </Card>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, onClick }: any) => (
  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <Icon className={`h-5 w-5 mb-2 ${color || "text-primary"}`} />
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </Card>
);

// ─── Orders Section ────────────────────────────────────
const OrdersSection = ({ orders, onUpdateStatus, onViewDetail }: any) => {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "shipping", label: "Đang giao" },
    { key: "delivered", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  const filteredOrders = activeTab === "all" ? orders : orders.filter((o: any) => o.status === activeTab);
  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach((o: any) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý đơn hàng</h2>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <Button key={t.key} variant={activeTab === t.key ? "default" : "outline"} size="sm" onClick={() => setActiveTab(t.key)} className="flex-shrink-0 text-xs gap-1">
            {t.label}
            {(tabCounts[t.key] || 0) > 0 && <span className="bg-primary-foreground/20 text-[10px] px-1.5 rounded-full">{tabCounts[t.key]}</span>}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: any) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetail(order)}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{order.profiles?.display_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_CONFIG[order.status]?.color} text-white text-xs`}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(order.created_at).toLocaleString("vi-VN")}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {order.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => onUpdateStatus(order.id, "confirmed")} className="text-xs h-7">Xác nhận</Button>
                          <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(order.id, "cancelled")} className="text-xs h-7">Hủy</Button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <Button size="sm" onClick={() => onUpdateStatus(order.id, "shipping")} className="text-xs h-7"><Truck className="h-3 w-3 mr-1" />Giao hàng</Button>
                      )}
                      {order.status === "shipping" && (
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(order.id, "delivered")} className="text-xs h-7"><CheckCircle className="h-3 w-3 mr-1" />Đã giao</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có đơn hàng nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ─── Products Section ──────────────────────────────────
const ProductsSection = ({ products, onAdd, onEdit, onDelete }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = products.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold">Quản lý sản phẩm</h2>
        <Button onClick={onAdd} className="gap-2"><Plus className="h-4 w-4" /> Thêm sản phẩm</Button>
      </div>

      <Input placeholder="Tìm kiếm sản phẩm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm" />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 5 ? "outline" : product.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                      {product.stock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{CATEGORY_LABELS[product.category] || product.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                      {product.is_active ? "Đang bán" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onEdit(product)} className="h-7 w-7 p-0"><Edit className="h-3 w-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(product.id)} className="h-7 w-7 p-0"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có sản phẩm nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ─── Revenue Section ───────────────────────────────────
const RevenueSection = ({ stats, orders }: any) => {
  const maxRevenue = Math.max(...stats.monthlyRevenue.map((m: any) => m.amount), 1);

  // Top products by revenue
  const productRevenue = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; quantity: number }> = {};
    orders.filter((o: any) => o.status === "delivered").forEach((o: any) => {
      o.order_items?.forEach((item: any) => {
        if (!map[item.product_name]) map[item.product_name] = { name: item.product_name, revenue: 0, quantity: 0 };
        map[item.product_name].revenue += Number(item.subtotal);
        map[item.product_name].quantity += item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [orders]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Doanh thu</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <DollarSign className="h-5 w-5 text-primary mb-1" />
          <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
        </Card>
        <Card className="p-4">
          <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
          <div className="text-2xl font-bold">{stats.deliveredCount}</div>
          <p className="text-xs text-muted-foreground">Đơn hoàn thành</p>
        </Card>
        <Card className="p-4">
          <BarChart3 className="h-5 w-5 text-primary mb-1" />
          <div className="text-2xl font-bold">{stats.deliveredCount > 0 ? formatPrice(Math.round(stats.totalRevenue / stats.deliveredCount)) : "0đ"}</div>
          <p className="text-xs text-muted-foreground">Trung bình / đơn</p>
        </Card>
      </div>

      {/* Simple bar chart */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">Doanh thu 6 tháng gần nhất</h3>
        <div className="flex items-end gap-2 h-40">
          {stats.monthlyRevenue.map((m: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{m.amount > 0 ? formatPrice(m.amount) : ""}</span>
              <div
                className="w-full bg-primary/80 rounded-t-sm transition-all min-h-[2px]"
                style={{ height: `${Math.max((m.amount / maxRevenue) * 100, 2)}%` }}
              />
              <span className="text-xs font-medium">{m.month}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top products */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Sản phẩm bán chạy</h3>
        {productRevenue.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Doanh thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productRevenue.map((p, i) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell className="text-sm">{p.name}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Chưa có dữ liệu bán hàng</p>
        )}
      </Card>
    </div>
  );
};

// ─── Product Form Dialog ───────────────────────────────
const ProductFormDialog = ({ open, onOpenChange, formData, setFormData, onSubmit, isEditing }: any) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Tên sản phẩm <span className="text-destructive">*</span></Label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nhập tên sản phẩm" />
          </div>
          <div>
            <Label>Giá (đ) <span className="text-destructive">*</span></Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div>
            <Label>Số lượng tồn kho</Label>
            <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
          </div>
          <div>
            <Label>Danh mục <span className="text-destructive">*</span></Label>
            <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Thức ăn</SelectItem>
                <SelectItem value="toy">Đồ chơi</SelectItem>
                <SelectItem value="accessory">Phụ kiện</SelectItem>
                <SelectItem value="medicine">Thuốc</SelectItem>
                <SelectItem value="grooming">Chăm sóc</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Loại thú cưng</Label>
            <Select value={formData.pet_type} onValueChange={v => setFormData({ ...formData, pet_type: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Chó</SelectItem>
                <SelectItem value="cat">Mèo</SelectItem>
                <SelectItem value="bird">Chim</SelectItem>
                <SelectItem value="fish">Cá</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Thương hiệu</Label>
            <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
          </div>
          <div>
            <Label>Trọng lượng</Label>
            <Input value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} placeholder="VD: 1kg, 500g" />
          </div>
          <div className="sm:col-span-2">
            <Label>URL hình ảnh</Label>
            <Input value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Mô tả</Label>
            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Label>Thành phần</Label>
            <Textarea value={formData.ingredients} onChange={e => setFormData({ ...formData, ingredients: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Đặc điểm</Label>
            <Textarea value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Hướng dẫn sử dụng</Label>
            <Textarea value={formData.usage_instructions} onChange={e => setFormData({ ...formData, usage_instructions: e.target.value })} rows={2} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
        <Button onClick={onSubmit}>{isEditing ? "Cập nhật" : "Thêm sản phẩm"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SellerDashboard;
