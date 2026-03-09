import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ShieldCheck, Package, ShoppingCart, Search, Key, Trash2, UserCheck, UserX, Eye, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordUserId, setPasswordUserId] = useState("");
  const [deleteUserId, setDeleteUserId] = useState("");
  const [roleAction, setRoleAction] = useState<{ userId: string; role: "seller" | "manager"; action: "grant" | "revoke" } | null>(null);
  const [deleteProductId, setDeleteProductId] = useState("");
  const [myRole, setMyRole] = useState<"admin" | "manager" | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [editOrderData, setEditOrderData] = useState({ shipping_address: "", phone_number: "", customer_notes: "", status: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    setCurrentUserId(user.id);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleList = roles?.map(r => r.role) || [];
    if (roleList.includes("admin")) {
      setMyRole("admin");
    } else if (roleList.includes("manager")) {
      setMyRole("manager");
    } else {
      navigate("/"); return;
    }

    setLoading(false);
    fetchAllData();
  };

  const fetchAllData = async () => {
    const [profilesRes, ordersRes, productsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    if (profilesRes.data) setUsers(profilesRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (rolesRes.data) {
      const roleMap: Record<string, string[]> = {};
      rolesRes.data.forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
      });
      setUserRoles(roleMap);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-change-password", {
      body: { target_user_id: passwordUserId, new_password: newPassword },
    });
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã thay đổi mật khẩu" });
      setShowPasswordDialog(false);
      setNewPassword("");
    }
  };

  const handleDeleteUser = async () => {
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { target_user_id: deleteUserId },
    });
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa tài khoản" });
      setShowDeleteDialog(false);
      fetchAllData();
    }
  };

  const confirmToggleRole = (userId: string, role: "seller" | "manager") => {
    const hasRole = userRoles[userId]?.includes(role);
    setRoleAction({ userId, role, action: hasRole ? "revoke" : "grant" });
    setShowRoleDialog(true);
  };

  const handleToggleRole = async () => {
    if (!roleAction) return;
    const { userId, role, action } = roleAction;
    if (action === "revoke") {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: `Đã thu quyền ${role}` });
        fetchAllData();
      }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Thành công", description: `Đã cấp quyền ${role}` });
        fetchAllData();
      }
    }
    setShowRoleDialog(false);
    setRoleAction(null);
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteProductId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã xóa sản phẩm" });
      fetchAllData();
    }
    setShowDeleteProductDialog(false);
    setDeleteProductId("");
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setEditOrderData({
      shipping_address: order.shipping_address || "",
      phone_number: order.phone_number || "",
      customer_notes: order.customer_notes || "",
      status: order.status || "pending",
    });
    setShowOrderDialog(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    const { error } = await supabase
      .from("orders")
      .update({
        shipping_address: editOrderData.shipping_address,
        phone_number: editOrderData.phone_number,
        customer_notes: editOrderData.customer_notes,
        status: editOrderData.status as any,
      })
      .eq("id", selectedOrder.id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thành công", description: "Đã cập nhật đơn hàng" });
      setShowOrderDialog(false);
      fetchAllData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusLabels: Record<string, string> = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận",
    shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy",
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const isAdminUser = (userId: string) => userRoles[userId]?.includes("admin");
  // Manager cannot: delete users, grant manager, delete admin
  const canDeleteUser = myRole === "admin";
  const canGrantManager = myRole === "admin";

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  if (!myRole) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Admin Dashboard</h1>
            <span className="text-xs text-muted-foreground capitalize">{myRole}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
        </Button>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs text-muted-foreground">Người dùng</div>
          </Card>
          <Card className="p-4 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{Object.values(userRoles).filter(r => r.includes("seller")).length}</div>
            <div className="text-xs text-muted-foreground">Nhà cung cấp</div>
          </Card>
          <Card className="p-4 text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-muted-foreground">Sản phẩm</div>
          </Card>
          <Card className="p-4 text-center">
            <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-xs text-muted-foreground">Đơn hàng</div>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm người dùng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const isAdmin = isAdminUser(user.id);
                      const isSelf = user.id === currentUserId;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.display_name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {userRoles[user.id]?.map(role => (
                                <Badge key={role} variant={role === "admin" ? "default" : role === "manager" ? "default" : role === "seller" ? "secondary" : "outline"}>
                                  {role}
                                </Badge>
                              )) || <Badge variant="outline">user</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {/* Đổi mật khẩu - không cho đổi admin nếu mình là manager */}
                              {!(myRole === "manager" && isAdmin) && (
                                <Button size="sm" variant="outline" onClick={() => { setPasswordUserId(user.id); setShowPasswordDialog(true); }} title="Đổi mật khẩu">
                                  <Key className="h-3 w-3" />
                                </Button>
                              )}
                              {/* Cấp/thu quyền seller - không cho admin */}
                              {!isAdmin && !isSelf && (
                                <Button
                                  size="sm"
                                  variant={userRoles[user.id]?.includes("seller") ? "destructive" : "default"}
                                  onClick={() => confirmToggleRole(user.id, "seller")}
                                  title={userRoles[user.id]?.includes("seller") ? "Thu quyền seller" : "Cấp quyền seller"}
                                >
                                  {userRoles[user.id]?.includes("seller") ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                </Button>
                              )}
                              {/* Cấp/thu quyền manager - chỉ admin */}
                              {canGrantManager && !isAdmin && !isSelf && (
                                <Button
                                  size="sm"
                                  variant={userRoles[user.id]?.includes("manager") ? "destructive" : "secondary"}
                                  onClick={() => confirmToggleRole(user.id, "manager")}
                                  title={userRoles[user.id]?.includes("manager") ? "Thu quyền manager" : "Cấp quyền manager"}
                                >
                                  <Shield className="h-3 w-3" />
                                </Button>
                              )}
                              {/* Xóa tài khoản - chỉ admin, không xóa admin khác */}
                              {canDeleteUser && !isAdmin && !isSelf && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => { setDeleteUserId(user.id); setShowDeleteDialog(true); }}
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const buyer = users.find(u => u.id === order.user_id);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell>{buyer?.display_name || "N/A"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleEditOrder(order)}>
                              <Eye className="h-3 w-3 mr-1" /> Sửa
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.image_url && <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                            <span className="font-medium line-clamp-1">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" onClick={() => { setDeleteProductId(product.id); setShowDeleteProductDialog(true); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đổi mật khẩu người dùng</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Người dùng: {users.find(u => u.id === passwordUserId)?.display_name || users.find(u => u.id === passwordUserId)?.email}
            </p>
            <Input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Hủy</Button>
            <Button onClick={handleChangePassword}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xác nhận xóa tài khoản</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm">Bạn có chắc muốn xóa tài khoản <strong>{users.find(u => u.id === deleteUserId)?.display_name}</strong>?</p>
            <p className="text-sm text-destructive mt-2">Hành động này không thể hoàn tác!</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chỉnh sửa đơn hàng</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={editOrderData.status} onValueChange={(v) => setEditOrderData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="shipping">Đang giao</SelectItem>
                  <SelectItem value="delivered">Đã giao</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Địa chỉ giao hàng</label>
              <Input value={editOrderData.shipping_address} onChange={(e) => setEditOrderData(prev => ({ ...prev, shipping_address: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Số điện thoại</label>
              <Input value={editOrderData.phone_number} onChange={(e) => setEditOrderData(prev => ({ ...prev, phone_number: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Input value={editOrderData.customer_notes} onChange={(e) => setEditOrderData(prev => ({ ...prev, customer_notes: e.target.value }))} />
            </div>
            {selectedOrder?.order_items && (
              <div>
                <label className="text-sm font-medium">Sản phẩm</label>
                <div className="space-y-1 mt-1">
                  {selectedOrder.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm bg-muted/50 rounded p-2">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Hủy</Button>
            <Button onClick={handleSaveOrder}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
