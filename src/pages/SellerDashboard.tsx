import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, ShoppingBag, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SellerDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSeller, setIsSeller] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    pet_type: "",
    brand: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      
      // Check if user is a seller
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasSellerRole = roles?.some(r => r.role === "seller");
      setIsSeller(hasSellerRole);

      if (!hasSellerRole) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn cần là người bán để truy cập trang này.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      fetchProfile(user.id);
      fetchProducts(user.id);
      fetchOrders(user.id);
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const fetchProducts = async (userId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        profiles!orders_user_id_fkey (display_name, email)
      `)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const handleSubmitProduct = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            category: formData.category as any,
            pet_type: formData.pet_type as any,
            brand: formData.brand,
          })
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({ title: "Cập nhật thành công! ✨" });
      } else {
        const { error } = await supabase.from("products").insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category: formData.category as any,
          pet_type: formData.pet_type as any,
          brand: formData.brand,
          seller_id: user.id,
        });

        if (error) throw error;
        toast({ title: "Thêm sản phẩm thành công! 🎉" });
      }

      setShowProductDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts(user.id);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu sản phẩm.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;

      toast({ title: "Đã xóa sản phẩm" });
      fetchProducts(user.id);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sản phẩm.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      pet_type: product.pet_type || "",
      brand: product.brand || "",
    });
    setShowProductDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      pet_type: "",
      brand: "",
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId);

      if (error) throw error;

      toast({ title: "Cập nhật trạng thái thành công!" });
      fetchOrders(user.id);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders
      .filter(o => o.status === "delivered")
      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
  };

  if (!isSeller) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        userName={profile?.display_name || user?.email}
        userAvatar={profile?.avatar_url}
        cartCount={0}
        onLoginClick={() => {}}
        onLogoutClick={handleLogout}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Bảng điều khiển người bán 🛍️</h1>

        {/* Stats - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Sản phẩm</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Đơn hàng</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5 md:p-6 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Doanh thu</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{stats.totalRevenue.toLocaleString()}đ</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="w-full grid grid-cols-2 h-11 sm:h-12">
            <TabsTrigger value="products" className="text-sm sm:text-base">Sản phẩm</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm sm:text-base">Đơn hàng</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3 sm:space-y-4">
            <div className="flex justify-end mb-3 sm:mb-4">
              <Button 
                onClick={() => { resetForm(); setShowProductDialog(true); }}
                className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Thêm sản phẩm</span>
                <span className="sm:hidden">Thêm</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-3 sm:p-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-full h-32 sm:h-40 object-cover rounded-lg mb-3 sm:mb-4" />
                  )}
                  <h3 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="text-base sm:text-lg font-bold text-primary">{product.price.toLocaleString()}đ</span>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-xs">
                      Kho: {product.stock}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 h-9 sm:h-10 touch-manipulation"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 h-9 sm:h-10 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Chưa có sản phẩm nào</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-3 sm:space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{order.profiles.display_name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.profiles.email}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 break-words">{order.shipping_address}</p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                    <p className="text-lg sm:text-xl font-bold text-primary">{parseFloat(order.total_amount).toLocaleString()}đ</p>
                    <Badge className="mt-1.5 sm:mt-2 text-xs">{order.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="shipped">Đã gửi hàng</SelectItem>
                      <SelectItem value="delivered">Đã giao</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Chưa có đơn hàng nào</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Dialog - Mobile Optimized */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Giá (đ)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="stock">Số lượng</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Thức ăn</SelectItem>
                    <SelectItem value="toy">Đồ chơi</SelectItem>
                    <SelectItem value="accessory">Phụ kiện</SelectItem>
                    <SelectItem value="health">Sức khỏe</SelectItem>
                    <SelectItem value="grooming">Chăm sóc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pet_type">Loại thú cưng</Label>
                <Select value={formData.pet_type} onValueChange={(value) => setFormData({ ...formData, pet_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Chó</SelectItem>
                    <SelectItem value="cat">Mèo</SelectItem>
                    <SelectItem value="bird">Chim</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="brand">Thương hiệu</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <Button onClick={handleSubmitProduct} className="w-full">
              {editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;
