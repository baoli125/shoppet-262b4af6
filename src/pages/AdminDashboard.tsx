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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Users, ShieldCheck, Package, ShoppingCart, Search, Key, Trash2, UserCheck, UserX, Eye, LogOut, Shield, ArrowUp, ArrowDown, ArrowUpDown, Filter, Check, X, PawPrint, UserPlus, RefreshCw, RotateCcw, Clock, Pencil, Link2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SortDir = "asc" | "desc" | null;
type SortState = { key: string; dir: SortDir };

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSort, setUserSort] = useState<SortState>({ key: "", dir: null });
  const [orderSort, setOrderSort] = useState<SortState>({ key: "", dir: null });
  const [productSort, setProductSort] = useState<SortState>({ key: "", dir: null });
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [petFilter, setPetFilter] = useState<string[]>([]);
  const [userPets, setUserPets] = useState<Record<string, any[]>>({});
  const [petMedicalRecords, setPetMedicalRecords] = useState<Record<string, any[]>>({});
  const [petVaccines, setPetVaccines] = useState<Record<string, any[]>>({});
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logSort, setLogSort] = useState<SortState>({ key: "created_at", dir: "desc" });
  const [logTab, setLogTab] = useState<"admin" | "user">("admin");
  const [logActorFilter, setLogActorFilter] = useState<string[]>([]);
  const [logActionFilter, setLogActionFilter] = useState<string[]>([]);
  const [logTargetFilter, setLogTargetFilter] = useState<string[]>([]);
  const [showPetDetail, setShowPetDetail] = useState(false);
  const [detailPets, setDetailPets] = useState<any[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [orderDateDraft, setOrderDateDraft] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordUserId, setPasswordUserId] = useState("");
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserPassword, setCreateUserPassword] = useState("");
  const [createUserRole, setCreateUserRole] = useState("user");
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteProductReason, setDeleteProductReason] = useState("");
  const [roleAction, setRoleAction] = useState<{ userId: string; role: "seller" | "manager"; action: "grant" | "revoke" } | null>(null);
  const [deleteProductId, setDeleteProductId] = useState("");
  const [myRole, setMyRole] = useState<"admin" | "manager" | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [editOrderData, setEditOrderData] = useState({ shipping_address: "", phone_number: "", customer_notes: "", status: "" });
  // Product management states
  const [productSuppliers, setProductSuppliers] = useState<Record<string, any[]>>({});
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [editProductData, setEditProductData] = useState<any>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeSearchQuery, setMergeSearchQuery] = useState("");
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
    const [profilesRes, ordersRes, productsRes, rolesRes, petsRes, medicalRes, vaccinesRes, psRes, suppRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("pets").select("*"),
      supabase.from("medical_records").select("*").order("date", { ascending: false }),
      supabase.from("vaccines").select("*").order("date", { ascending: false }),
      supabase.from("product_suppliers").select("*, suppliers(*)"),
      supabase.from("suppliers").select("*"),
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
    if (petsRes.data) {
      const petMap: Record<string, any[]> = {};
      petsRes.data.forEach((p: any) => {
        if (!petMap[p.user_id]) petMap[p.user_id] = [];
        petMap[p.user_id].push(p);
      });
      setUserPets(petMap);
    }
    if (medicalRes.data) {
      const map: Record<string, any[]> = {};
      medicalRes.data.forEach((r: any) => {
        if (!map[r.pet_id]) map[r.pet_id] = [];
        map[r.pet_id].push(r);
      });
      setPetMedicalRecords(map);
    }
    if (vaccinesRes.data) {
      const map: Record<string, any[]> = {};
      vaccinesRes.data.forEach((v: any) => {
        if (!map[v.pet_id]) map[v.pet_id] = [];
        map[v.pet_id].push(v);
      });
      setPetVaccines(map);
    }
    if (psRes.data) {
      const psMap: Record<string, any[]> = {};
      psRes.data.forEach((ps: any) => {
        if (!psMap[ps.product_id]) psMap[ps.product_id] = [];
        psMap[ps.product_id].push(ps);
      });
      setProductSuppliers(psMap);
    }
    if (suppRes.data) setAllSuppliers(suppRes.data);
  };

  // Helper: ghi log hành động admin/manager
  const logActivity = async (action: string, targetType: string, targetId: string, targetName: string, details: string) => {
    const myProfile = users.find(u => u.id === currentUserId);
    await supabase.from("activity_logs").insert({
      actor_id: currentUserId,
      actor_name: myProfile?.display_name || "Admin",
      action,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      details,
    });
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    // Nếu target là admin, yêu cầu mật khẩu hiện tại
    const targetIsAdmin = isAdminUser(passwordUserId);
    if (targetIsAdmin && !currentPassword) {
      toast({ title: "Lỗi", description: "Cần nhập mật khẩu hiện tại để đổi mật khẩu admin", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-change-password", {
      body: { 
        target_user_id: passwordUserId, 
        new_password: newPassword,
        ...(targetIsAdmin ? { current_password: currentPassword } : {}),
      },
    });
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
    } else {
      const targetUser = users.find(u => u.id === passwordUserId);
      await logActivity("change_password", "user", passwordUserId, targetUser?.display_name || "", `Đổi mật khẩu cho ${targetUser?.display_name || targetUser?.email}`);
      toast({ title: "Thành công", description: "Đã thay đổi mật khẩu" });
      setShowPasswordDialog(false);
      setNewPassword("");
      setCurrentPassword("");
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  };

  const handleCreateUser = async () => {
    if (!createUserEmail) {
      toast({ title: "Lỗi", description: "Email là bắt buộc", variant: "destructive" });
      return;
    }
    if (!createUserPassword || createUserPassword.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự", variant: "destructive" });
      return;
    }
    setCreateUserLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email: createUserEmail, password: createUserPassword, role: createUserRole },
    });
    setCreateUserLoading(false);
    if (error || data?.error) {
      toast({ title: "Lỗi", description: data?.error || error?.message, variant: "destructive" });
    } else {
      await logActivity("create_user", "user", data?.user_id || "", createUserEmail, `Tạo tài khoản ${createUserEmail} với vai trò ${createUserRole}`);
      toast({ title: "Thành công", description: `Đã tạo tài khoản ${createUserEmail}` });
      setShowCreateUserDialog(false);
      setCreateUserEmail("");
      setCreateUserPassword("");
      setCreateUserRole("user");
      fetchAllData();
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteReason.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập lý do xóa", variant: "destructive" });
      return;
    }
    // Soft delete: mark profile as deleted
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        delete_reason: deleteReason,
        deleted_by: currentUserId,
      })
      .eq("id", deleteUserId);

    if (profileError) {
      toast({ title: "Lỗi", description: profileError.message, variant: "destructive" });
      return;
    }

    // Log deletion
    const targetUser = users.find(u => u.id === deleteUserId);
    await supabase.from("deletion_logs").insert({
      target_type: "account",
      target_id: deleteUserId,
      target_name: targetUser?.display_name || targetUser?.email || "",
      user_id: deleteUserId,
      reason: deleteReason,
      deleted_by: currentUserId,
    });
    await logActivity("delete_user", "user", deleteUserId, targetUser?.display_name || "", `Xóa tài khoản: ${targetUser?.display_name} - Lý do: ${deleteReason}`);

    toast({ title: "Thành công", description: "Đã xóa tài khoản (mềm)" });
    setShowDeleteDialog(false);
    setDeleteReason("");
    fetchAllData();
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
        const u = users.find(u => u.id === userId);
        await logActivity("revoke_role", "user", userId, u?.display_name || "", `Thu quyền ${role} của ${u?.display_name}`);
        toast({ title: "Thành công", description: `Đã thu quyền ${role}` });
        fetchAllData();
      }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) {
        toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      } else {
        const u = users.find(u => u.id === userId);
        await logActivity("grant_role", "user", userId, u?.display_name || "", `Cấp quyền ${role} cho ${u?.display_name}`);
        toast({ title: "Thành công", description: `Đã cấp quyền ${role}` });
        fetchAllData();
      }
    }
    setShowRoleDialog(false);
    setRoleAction(null);
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    if (!deleteProductReason.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập lý do xóa", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === deleteProductId);
    // Log deletion for the product seller
    if (product?.seller_id) {
      await supabase.from("deletion_logs").insert({
        target_type: "product",
        target_id: deleteProductId,
        target_name: product?.name || "",
        user_id: product.seller_id,
        reason: deleteProductReason,
        deleted_by: currentUserId,
      });
    }

    const { error } = await supabase.from("products").delete().eq("id", deleteProductId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      await logActivity("delete_product", "product", deleteProductId, product?.name || "", `Xóa sản phẩm: ${product?.name} - Lý do: ${deleteProductReason}`);
      toast({ title: "Thành công", description: "Đã xóa sản phẩm" });
      fetchAllData();
    }
    setShowDeleteProductDialog(false);
    setDeleteProductId("");
    setDeleteProductReason("");
  };

  // Chỉnh sửa sản phẩm (giá, thông tin)
  const handleEditProduct = (product: any) => {
    setEditProductData({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock || 0,
      is_active: product.is_active,
      description: product.description || "",
      brand: product.brand || "",
    });
    setShowEditProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!editProductData) return;
    const { error } = await supabase.from("products").update({
      name: editProductData.name,
      price: editProductData.price,
      stock: editProductData.stock,
      is_active: editProductData.is_active,
      description: editProductData.description,
      brand: editProductData.brand,
    }).eq("id", editProductData.id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      await logActivity("edit_product", "product", editProductData.id, editProductData.name, `Chỉnh sửa sản phẩm: ${editProductData.name}`);
      toast({ title: "Thành công", description: "Đã cập nhật sản phẩm" });
      setShowEditProductDialog(false);
      setEditProductData(null);
      fetchAllData();
    }
  };

  // Gộp sản phẩm trùng: chuyển supplier từ source sang target, xóa source
  const handleMergeProduct = async () => {
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      toast({ title: "Lỗi", description: "Vui lòng chọn sản phẩm đích khác sản phẩm nguồn", variant: "destructive" });
      return;
    }
    const sourcePS = productSuppliers[mergeSourceId] || [];
    const targetPS = productSuppliers[mergeTargetId] || [];
    const targetSupplierIds = targetPS.map((ps: any) => ps.supplier_id);

    for (const ps of sourcePS) {
      if (targetSupplierIds.includes(ps.supplier_id)) continue;
      await supabase.from("product_suppliers").insert({
        product_id: mergeTargetId,
        supplier_id: ps.supplier_id,
        price: ps.price,
        stock: ps.stock,
      });
    }

    await supabase.from("cart_items").update({ product_id: mergeTargetId }).eq("product_id", mergeSourceId);
    await supabase.from("product_suppliers").delete().eq("product_id", mergeSourceId);

    const sourceProduct = products.find(p => p.id === mergeSourceId);
    const targetProduct = products.find(p => p.id === mergeTargetId);
    
    if (sourceProduct?.seller_id) {
      await supabase.from("deletion_logs").insert({
        target_type: "product",
        target_id: mergeSourceId,
        target_name: sourceProduct?.name || "",
        user_id: sourceProduct.seller_id,
        reason: `Sản phẩm đã được gộp vào "${targetProduct?.name || mergeTargetId}"`,
        deleted_by: currentUserId,
      });
    }
    
    await supabase.from("products").delete().eq("id", mergeSourceId);
    await logActivity("merge_product", "product", mergeSourceId, sourceProduct?.name || "", `Gộp sản phẩm "${sourceProduct?.name}" vào "${targetProduct?.name}"`);
    toast({ title: "Thành công", description: `Đã gộp sản phẩm vào "${targetProduct?.name}"` });
    setShowMergeDialog(false);
    setMergeSourceId("");
    setMergeTargetId("");
    setMergeSearchQuery("");
    fetchAllData();
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setEditOrderData({
      shipping_address: order.shipping_address || "",
      phone_number: order.phone_number || "",
      customer_notes: order.customer_notes || "",
      status: order.status || "pending",
    });
    setOrderDateDraft(toDatetimeLocal(order.created_at));
    setShowOrderDialog(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    const updateData: any = {
      shipping_address: editOrderData.shipping_address,
      phone_number: editOrderData.phone_number,
      customer_notes: editOrderData.customer_notes,
      status: editOrderData.status as any,
    };
    if (orderDateDraft !== toDatetimeLocal(selectedOrder.created_at)) {
      updateData.created_at = toISOStringFromLocal(orderDateDraft);
    }
    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", selectedOrder.id);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } else {
      const changes: string[] = [];
      if (selectedOrder.status !== editOrderData.status) changes.push(`Trạng thái: ${statusLabels[selectedOrder.status]} → ${statusLabels[editOrderData.status]}`);
      if (selectedOrder.shipping_address !== editOrderData.shipping_address) changes.push("Địa chỉ giao hàng");
      if (selectedOrder.phone_number !== editOrderData.phone_number) changes.push("Số điện thoại");
      if (selectedOrder.customer_notes !== editOrderData.customer_notes) changes.push("Ghi chú");
      if (orderDateDraft !== toDatetimeLocal(selectedOrder.created_at)) changes.push("Ngày đặt");
      await logActivity("edit_order", "order", selectedOrder.id, `#${selectedOrder.id.slice(0,8)}`, `Chỉnh sửa đơn hàng: ${changes.join(", ")}`);
      toast({ title: "Thành công", description: "Đã cập nhật đơn hàng" });
      setShowOrderDialog(false);
      fetchAllData();
    }
  };

  const toDatetimeLocal = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const toISOStringFromLocal = (localDate: string) => {
    if (!localDate) return "";
    const date = new Date(localDate);
    return date.toISOString();
  };

  const handleUpdateOrderDate = async (orderId: string, localDateValue: string) => {
    const isoDate = toISOStringFromLocal(localDateValue);
    if (!isoDate) {
      toast({ title: "Lỗi", description: "Ngày đặt không hợp lệ.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("orders").update({ created_at: isoDate }).eq("id", orderId);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Đã cập nhật ngày đặt" });
    setShowOrderDialog(false);
    fetchAllData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length <= 6) return phone;
    return phone.slice(0, 3) + "*".repeat(phone.length - 6) + phone.slice(-3);
  };

  const maskAddress = (address: string) => {
    if (!address || address.length <= 6) return address;
    return address.slice(0, 3) + "*".repeat(Math.max(3, address.length - 6)) + address.slice(-3);
  };

  const toggleSort = (setter: React.Dispatch<React.SetStateAction<SortState>>, key: string) => {
    setter(prev => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      if (prev.dir === "desc") return { key: "", dir: null };
      return { key, dir: "asc" };
    });
  };

  const SortIcon = ({ sortState, colKey }: { sortState: SortState; colKey: string }) => {
    if (sortState.key !== colKey || !sortState.dir) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortState.dir === "asc" ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const sortData = <T,>(data: T[], sort: SortState, getVal: (item: T, key: string) => any): T[] => {
    if (!sort.key || !sort.dir) return data;
    return [...data].sort((a, b) => {
      const va = getVal(a, sort.key);
      const vb = getVal(b, sort.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === "string" ? va.localeCompare(vb, "vi") : va - vb;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  };

  // Thứ tự ưu tiên vai trò khi hiển thị
  const ROLE_ORDER = ["admin", "manager", "seller", "user"];
  const sortRoles = (roles: string[]) => [...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));

  const getUserHighestRole = (userId: string) => {
    const roles = userRoles[userId];
    if (!roles || roles.length === 0) return "user";
    for (const r of ROLE_ORDER) {
      if (roles.includes(r)) return r;
    }
    return "user";
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (roleFilter.length > 0) {
      const roles = userRoles[u.id] || [];
      const effectiveRoles = roles.length > 0 ? roles : ["user"];
      if (!roleFilter.every(r => effectiveRoles.includes(r))) return false;
    }
    if (petFilter.length > 0) {
      const hasPets = (userPets[u.id]?.length || 0) > 0;
      const petStatus = hasPets ? "yes" : "no";
      if (!petFilter.includes(petStatus)) return false;
    }
    return true;
  });

  const sortedUsers = sortData(filteredUsers, userSort, (u, k) => {
    if (k === "name") return u.display_name?.toLowerCase() || "";
    if (k === "email") return u.email?.toLowerCase() || "";
    return "";
  });

  // Lấy danh sách khách hàng duy nhất từ đơn hàng
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.user_id)))
    .map(uid => ({ id: uid, name: users.find(u => u.id === uid)?.display_name || "N/A" }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));

  const filteredOrders = orders.filter(o => {
    if (statusFilter.length > 0 && !statusFilter.includes(o.status)) return false;
    if (customerFilter.length > 0 && !customerFilter.includes(o.user_id)) return false;
    return true;
  });

  const sortedOrders = sortData(filteredOrders, orderSort, (o, k) => {
    if (k === "id") return o.id;
    if (k === "customer") return users.find((u: any) => u.id === o.user_id)?.display_name?.toLowerCase() || "";
    if (k === "total") return Number(o.total_amount);
    if (k === "status") return o.status || "";
    if (k === "created_at") return new Date(o.created_at).getTime();
    return "";
  });

  const filteredProducts = products.filter(p => {
    if (categoryFilter.length > 0 && !categoryFilter.includes(p.category)) return false;
    return true;
  });

  const sortedProducts = sortData(filteredProducts, productSort, (p, k) => {
    if (k === "name") return p.name?.toLowerCase() || "";
    if (k === "price") return Number(p.price);
    if (k === "category") return p.category || "";
    if (k === "stock") return Number(p.stock || 0);
    return "";
  });

  const statusLabels: Record<string, string> = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận",
    shipping: "Đang giao", delivered: "Đã giao", cancelled: "Đã hủy",
  };

  const categoryLabels: Record<string, string> = {
    food: "Thức ăn", toy: "Đồ chơi", accessory: "Phụ kiện",
    medicine: "Thuốc", grooming: "Chăm sóc", other: "Khác",
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin", manager: "Manager", seller: "Seller", user: "User",
  };

  const FilterDropdown = ({ label, options, selected, onToggle, labelMap }: {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (val: string) => void;
    labelMap?: Record<string, string>;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-left w-full">
          {label}
          <Filter className={`h-3 w-3 ml-1 ${selected.length > 0 ? "text-primary" : "opacity-40"}`} />
          {selected.length > 0 && (
            <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 leading-4">{selected.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={() => onToggle(opt)}
              />
              {labelMap?.[opt] || opt}
            </label>
          ))}
          {selected.length > 0 && (
            <Button size="sm" variant="ghost" className="w-full mt-1 text-xs" onClick={() => selected.forEach(s => onToggle(s))}>
              Bỏ lọc
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(price) + "đ";

  const isAdminUser = (userId: string) => userRoles[userId]?.includes("admin");
  // Manager cannot: delete users, grant manager, delete admin
  const canDeleteUser = myRole === "admin";
  const canGrantManager = myRole === "admin";

  if (loading) return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  if (!myRole) return null;

  const InfoRow = ({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) => (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`text-sm font-medium break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );

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
                <Button size="sm" onClick={() => setShowCreateUserDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Tạo
                </Button>
              </div>
              <div className="overflow-x-auto">
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setUserSort, "name")}>
                        <span className="flex items-center">Tên <SortIcon sortState={userSort} colKey="name" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setUserSort, "email")}>
                        <span className="flex items-center">Email <SortIcon sortState={userSort} colKey="email" /></span>
                      </TableHead>
                      <TableHead>
                        <FilterDropdown
                          label="Vai trò"
                          options={["admin", "manager", "seller", "user"]}
                          selected={roleFilter}
                          onToggle={(v) => toggleFilter(setRoleFilter, v)}
                          labelMap={roleLabels}
                        />
                      </TableHead>
                      <TableHead>
                        <FilterDropdown
                          label="Thú cưng"
                          options={["yes", "no"]}
                          selected={petFilter}
                          onToggle={(v) => toggleFilter(setPetFilter, v)}
                          labelMap={{ yes: "Đã đăng ký", no: "Chưa đăng ký" }}
                        />
                      </TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.map((user) => {
                      const isAdmin = isAdminUser(user.id);
                      const isSelf = user.id === currentUserId;
                      const pets = userPets[user.id] || [];
                      return (
                        <TableRow key={user.id} className={user.is_deleted ? "opacity-60 bg-destructive/5" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1.5">
                              {!isAdmin ? (
                                <button className="text-left hover:text-primary hover:underline transition-colors" onClick={() => {
                                  // Seller → navigate to full-page detail
                                  if (userRoles[user.id]?.includes("seller")) {
                                    navigate(`/admin/seller/${user.id}`);
                                  } else {
                                    setDetailUser(user);
                                    setShowUserDetail(true);
                                  }
                                }}>
                                  {user.display_name}
                                </button>
                              ) : (
                                <span className="text-muted-foreground">{user.display_name}</span>
                              )}
                              {user.is_deleted && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Đã xóa</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {(userRoles[user.id] ? sortRoles(userRoles[user.id]) : []).map(role => (
                                <Badge key={role} variant={role === "admin" ? "default" : role === "manager" ? "default" : role === "seller" ? "secondary" : "outline"}>
                                  {role}
                                </Badge>
                              ))}
                              {(!userRoles[user.id] || userRoles[user.id].length === 0) && <Badge variant="outline">user</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pets.length > 0 ? (
                              <button
                                className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                                onClick={() => { setDetailPets(pets); setShowPetDetail(true); }}
                                title={`${pets.length} thú cưng`}
                              >
                                <Check className="h-4 w-4" />
                                <span className="text-xs font-medium">{pets.length}</span>
                              </button>
                            ) : (
                              <X className="h-4 w-4 text-destructive" />
                            )}
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
                              {/* Xóa / Khôi phục tài khoản - chỉ admin, không xóa admin khác */}
                              {canDeleteUser && !isAdmin && !isSelf && (
                                user.is_deleted ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      await supabase.from("profiles").update({ is_deleted: false, deleted_at: null, delete_reason: null, deleted_by: null }).eq("id", user.id);
                                      await logActivity("restore_user", "user", user.id, user.display_name || "", `Khôi phục tài khoản: ${user.display_name}`);
                                      toast({ title: "Thành công", description: "Đã khôi phục tài khoản" });
                                      fetchAllData();
                                    }}
                                    title="Khôi phục tài khoản"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setDeleteUserId(user.id); setShowDeleteDialog(true); }}
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )
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
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setOrderSort, "id")}>
                        <span className="flex items-center">Mã đơn <SortIcon sortState={orderSort} colKey="id" /></span>
                      </TableHead>
                      <TableHead>
                        <FilterDropdown
                          label="Khách hàng"
                          options={uniqueCustomers.map(c => c.id)}
                          selected={customerFilter}
                          onToggle={(v) => toggleFilter(setCustomerFilter, v)}
                          labelMap={Object.fromEntries(uniqueCustomers.map(c => [c.id, c.name]))}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setOrderSort, "total")}>
                        <span className="flex items-center">Tổng tiền <SortIcon sortState={orderSort} colKey="total" /></span>
                      </TableHead>
                      <TableHead>
                        <FilterDropdown
                          label="Trạng thái"
                          options={["pending", "confirmed", "shipping", "delivered", "cancelled"]}
                          selected={statusFilter}
                          onToggle={(v) => toggleFilter(setStatusFilter, v)}
                          labelMap={statusLabels}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setOrderSort, "created_at")}>
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />Thời gian <SortIcon sortState={orderSort} colKey="created_at" /></span>
                      </TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => {
                      const buyer = users.find(u => u.id === order.user_id);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">
                            <button className="hover:text-primary hover:underline transition-colors" onClick={() => { setDetailOrder(order); setShowOrderDetail(true); }}>
                              {order.id.slice(0, 8)}...
                            </button>
                          </TableCell>
                          <TableCell>{buyer?.display_name || "N/A"}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}
                              className={
                                order.status === "confirmed" ? "bg-gray-500 text-white hover:bg-gray-500/80" :
                                order.status === "shipping" ? "bg-[#0068FF] text-white hover:bg-[#0068FF]/80" : ""
                              }
                            >
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(order.created_at).toLocaleString("vi-VN")}
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
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setProductSort, "name")}>
                        <span className="flex items-center">Sản phẩm <SortIcon sortState={productSort} colKey="name" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setProductSort, "price")}>
                        <span className="flex items-center">Giá gốc <SortIcon sortState={productSort} colKey="price" /></span>
                      </TableHead>
                      <TableHead>
                        <FilterDropdown
                          label="Danh mục"
                          options={["food", "toy", "accessory", "medicine", "grooming", "other"]}
                          selected={categoryFilter}
                          onToggle={(v) => toggleFilter(setCategoryFilter, v)}
                          labelMap={categoryLabels}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(setProductSort, "stock")}>
                        <span className="flex items-center">Tồn kho <SortIcon sortState={productSort} colKey="stock" /></span>
                      </TableHead>
                      <TableHead>NCC</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((product) => {
                      const supplierCount = productSuppliers[product.id]?.length || 0;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {product.image_url && <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                              <button className="font-medium line-clamp-1 text-left hover:text-primary hover:underline transition-colors" onClick={() => { setDetailProduct(product); setShowProductDetail(true); }}>
                                {product.name}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell><Badge variant="outline">{categoryLabels[product.category] || product.category}</Badge></TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>
                            <Badge variant={supplierCount > 0 ? "default" : "secondary"} className="text-xs">
                              <Store className="h-3 w-3 mr-1" />{supplierCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "destructive"} className="text-xs">
                              {product.is_active ? "Đang bán" : "Ngưng"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)} title="Chỉnh sửa">
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setMergeSourceId(product.id); setMergeTargetId(""); setMergeSearchQuery(""); setShowMergeDialog(true); }} title="Gộp vào sản phẩm khác">
                                <Link2 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setDeleteProductId(product.id); setShowDeleteProductDialog(true); }} title="Xóa">
                                <Trash2 className="h-3 w-3" />
                              </Button>
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


        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { setShowPasswordDialog(open); if (!open) { setNewPassword(""); setCurrentPassword(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đổi mật khẩu người dùng</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Người dùng: {users.find(u => u.id === passwordUserId)?.display_name || users.find(u => u.id === passwordUserId)?.email}
            </p>
            {isAdminUser(passwordUserId) && (
              <div>
                <label className="text-sm font-medium">Mật khẩu hiện tại <span className="text-destructive">*</span></label>
                <Input type="password" placeholder="Nhập mật khẩu hiện tại của admin" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Mật khẩu mới</label>
              <Input type="password" placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Hủy</Button>
            <Button onClick={handleChangePassword}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={(open) => { setShowCreateUserDialog(open); if (!open) { setCreateUserEmail(""); setCreateUserPassword(""); setCreateUserRole("user"); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo tài khoản mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
              <Input type="email" placeholder="email@example.com" value={createUserEmail} onChange={(e) => setCreateUserEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Mật khẩu <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                <Input type="text" placeholder="Tối thiểu 6 ký tự" value={createUserPassword} onChange={(e) => setCreateUserPassword(e.target.value)} className="flex-1" />
                <Button size="sm" variant="outline" type="button" onClick={() => setCreateUserPassword(generatePassword())} title="Tạo mật khẩu tự động">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Vai trò</label>
              <Select value={createUserRole} onValueChange={setCreateUserRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  {myRole === "admin" && <SelectItem value="manager">Manager</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUserDialog(false)}>Hủy</Button>
            <Button onClick={handleCreateUser} disabled={createUserLoading}>
              {createUserLoading ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xác nhận xóa tài khoản</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm">Bạn có chắc muốn xóa tài khoản <strong>{users.find(u => u.id === deleteUserId)?.display_name}</strong>?</p>
            <p className="text-sm text-muted-foreground">Tài khoản sẽ được đánh dấu là đã xóa. Người dùng có thể khôi phục khi đăng nhập lại.</p>
            <div>
              <label className="text-sm font-medium">Lý do xóa <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Nhập lý do xóa tài khoản..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteReason(""); }}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={!deleteReason.trim()}>Xóa</Button>
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
            <div>
              <label className="text-sm font-medium">Ngày đặt</label>
              <Input
                type="datetime-local"
                value={orderDateDraft}
                onChange={(e) => setOrderDateDraft(e.target.value)}
              />
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

      {/* Role Confirmation Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleAction?.action === "grant" ? "Xác nhận cấp quyền" : "Xác nhận thu quyền"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm">
              Bạn có chắc muốn {roleAction?.action === "grant" ? "cấp" : "thu"} quyền <strong>{roleAction?.role}</strong> cho{" "}
              <strong>{users.find(u => u.id === roleAction?.userId)?.display_name}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRoleDialog(false); setRoleAction(null); }}>Hủy</Button>
            <Button variant={roleAction?.action === "revoke" ? "destructive" : "default"} onClick={handleToggleRole}>
              {roleAction?.action === "grant" ? "Cấp quyền" : "Thu quyền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation Dialog */}
      <Dialog open={showDeleteProductDialog} onOpenChange={(open) => { setShowDeleteProductDialog(open); if (!open) { setDeleteProductId(""); setDeleteProductReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xác nhận xóa sản phẩm</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm">
              Bạn có chắc muốn xóa sản phẩm <strong>{products.find(p => p.id === deleteProductId)?.name}</strong>?
            </p>
            <p className="text-sm text-destructive">Hành động này không thể hoàn tác!</p>
            <div>
              <label className="text-sm font-medium">Lý do xóa <span className="text-destructive">*</span></label>
              <Textarea
                placeholder="Nhập lý do xóa sản phẩm..."
                value={deleteProductReason}
                onChange={(e) => setDeleteProductReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteProductDialog(false); setDeleteProductId(""); setDeleteProductReason(""); }}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={!deleteProductReason.trim()}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chi tiết người dùng</DialogTitle></DialogHeader>
          {detailUser && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                {detailUser.avatar_url && <img src={detailUser.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover border" />}
                <div>
                  <div className="font-semibold text-lg">{detailUser.display_name}</div>
                  <div className="text-sm text-muted-foreground">{detailUser.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {myRole === "admin" && <InfoRow label="ID" value={detailUser.id} mono />}
                <InfoRow label="Số điện thoại" value={maskPhone(detailUser.phone || "Chưa cập nhật")} />
                <InfoRow label="Điểm" value={detailUser.points?.toString() || "0"} />
                <InfoRow label="Vai trò" value={(userRoles[detailUser.id] ? sortRoles(userRoles[detailUser.id]) : ["user"]).join(", ")} />
                <InfoRow label="Đã onboarding" value={detailUser.has_completed_onboarding ? "Có" : "Chưa"} />
                <InfoRow label="Người dùng mới" value={detailUser.is_new_user ? "Có" : "Không"} />
                <InfoRow label="Ngày tạo" value={new Date(detailUser.created_at).toLocaleDateString("vi-VN")} />
                <InfoRow label="Cập nhật" value={new Date(detailUser.updated_at).toLocaleDateString("vi-VN")} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetail(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chi tiết đơn hàng</DialogTitle></DialogHeader>
          {detailOrder && (() => {
            const buyer = users.find(u => u.id === detailOrder.user_id);
            const seller = users.find(u => u.id === detailOrder.seller_id);
            return (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Mã đơn" value={detailOrder.id} mono />
                  <InfoRow label="Trạng thái" value={statusLabels[detailOrder.status] || detailOrder.status} />
                  <InfoRow label="Khách hàng" value={buyer?.display_name || "N/A"} />
                  <InfoRow label="Nhà bán" value={seller?.display_name || "N/A"} />
                  <InfoRow label="Tổng tiền" value={formatPrice(detailOrder.total_amount)} />
                  <InfoRow label="Số điện thoại" value={maskPhone(detailOrder.phone_number)} />
                  <InfoRow label="Địa chỉ" value={maskAddress(detailOrder.shipping_address)} full />
                  {detailOrder.customer_notes && <InfoRow label="Ghi chú" value={detailOrder.customer_notes} full />}
                  {detailOrder.cancel_reason && <InfoRow label="Lý do hủy" value={detailOrder.cancel_reason} full />}
                  <InfoRow label="Ngày tạo" value={new Date(detailOrder.created_at).toLocaleDateString("vi-VN")} />
                </div>
                {detailOrder.order_items?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Sản phẩm ({detailOrder.order_items.length})</div>
                    <div className="space-y-1">
                      {detailOrder.order_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm bg-muted/50 rounded p-2">
                          <span>{item.product_name} x{item.quantity}</span>
                          <span className="font-medium">{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetail(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog - Enhanced with supplier info */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chi tiết sản phẩm</DialogTitle></DialogHeader>
          {detailProduct && (
            <div className="space-y-3 py-2">
              {detailProduct.image_url && (
                <img src={detailProduct.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="font-semibold text-lg">{detailProduct.name}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="ID" value={detailProduct.id} mono />
                <InfoRow label="Giá gốc" value={formatPrice(detailProduct.price)} />
                <InfoRow label="Danh mục" value={categoryLabels[detailProduct.category] || detailProduct.category} />
                <InfoRow label="Tồn kho" value={detailProduct.stock?.toString() || "0"} />
                <InfoRow label="Thương hiệu" value={detailProduct.brand || "N/A"} />
                <InfoRow label="Trọng lượng" value={detailProduct.weight || "N/A"} />
                <InfoRow label="Loại thú cưng" value={detailProduct.pet_type || "N/A"} />
                <InfoRow label="Trạng thái" value={detailProduct.is_active ? "Đang bán" : "Ngưng bán"} />
                <InfoRow label="Người bán" value={users.find(u => u.id === detailProduct.seller_id)?.display_name || "N/A"} />
                {detailProduct.calories && <InfoRow label="Calories" value={detailProduct.calories.toString()} />}
                {detailProduct.portion_gr_per_day && <InfoRow label="Khẩu phần/ngày" value={`${detailProduct.portion_gr_per_day}g`} />}
                {detailProduct.portion_gr_per_kg_per_day && <InfoRow label="Khẩu phần/kg/ngày" value={`${detailProduct.portion_gr_per_kg_per_day}g`} />}
              </div>

              {/* Nhà cung cấp */}
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Store className="h-4 w-4" /> Nhà cung cấp ({productSuppliers[detailProduct.id]?.length || 0})
                </div>
                {(productSuppliers[detailProduct.id]?.length || 0) > 0 ? (
                  <div className="space-y-1">
                    {productSuppliers[detailProduct.id].map((ps: any) => (
                      <div key={ps.id} className="flex justify-between items-center text-sm bg-muted/50 rounded p-2">
                        <div>
                          <span className="font-medium">{ps.suppliers?.name || "N/A"}</span>
                          <span className="text-xs text-muted-foreground ml-2">Kho: {ps.stock}</span>
                        </div>
                        <span className="font-semibold text-primary">{formatPrice(ps.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa có nhà cung cấp nào</p>
                )}
              </div>

              {detailProduct.description && (
                <div>
                  <div className="text-sm font-medium mb-1">Mô tả</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailProduct.description}</p>
                </div>
              )}
              {detailProduct.ingredients && (
                <div>
                  <div className="text-sm font-medium mb-1">Thành phần</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailProduct.ingredients}</p>
                </div>
              )}
              {detailProduct.features && (
                <div>
                  <div className="text-sm font-medium mb-1">Đặc điểm</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailProduct.features}</p>
                </div>
              )}
              {detailProduct.usage_instructions && (
                <div>
                  <div className="text-sm font-medium mb-1">Hướng dẫn sử dụng</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailProduct.usage_instructions}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Ngày tạo" value={new Date(detailProduct.created_at).toLocaleDateString("vi-VN")} />
                <InfoRow label="Cập nhật" value={new Date(detailProduct.updated_at).toLocaleDateString("vi-VN")} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDetail(false)}>Đóng</Button>
            {detailProduct && (
              <Button onClick={() => { setShowProductDetail(false); handleEditProduct(detailProduct); }}>
                <Pencil className="h-3 w-3 mr-1" /> Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={(open) => { setShowEditProductDialog(open); if (!open) setEditProductData(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chỉnh sửa sản phẩm</DialogTitle></DialogHeader>
          {editProductData && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">Tên sản phẩm</label>
                <Input value={editProductData.name} onChange={(e) => setEditProductData({ ...editProductData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Giá gốc (đ)</label>
                  <Input type="number" value={editProductData.price} onChange={(e) => setEditProductData({ ...editProductData, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Tồn kho</label>
                  <Input type="number" value={editProductData.stock} onChange={(e) => setEditProductData({ ...editProductData, stock: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Thương hiệu</label>
                <Input value={editProductData.brand} onChange={(e) => setEditProductData({ ...editProductData, brand: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea value={editProductData.description} onChange={(e) => setEditProductData({ ...editProductData, description: e.target.value })} rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={editProductData.is_active} onCheckedChange={(checked) => setEditProductData({ ...editProductData, is_active: !!checked })} />
                <label className="text-sm">Đang bán (hiển thị trên Marketplace)</label>
              </div>

              {/* Quản lý giá nhà cung cấp */}
              {productSuppliers[editProductData.id]?.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Giá theo nhà cung cấp</div>
                  <div className="space-y-2">
                    {productSuppliers[editProductData.id].map((ps: any) => (
                      <div key={ps.id} className="flex items-center gap-2 bg-muted/50 rounded p-2">
                        <span className="text-sm flex-1 font-medium">{ps.suppliers?.name || "N/A"}</span>
                        <Input
                          type="number"
                          className="w-28 h-8 text-sm"
                          defaultValue={ps.price}
                          onBlur={async (e) => {
                            const newPrice = Number(e.target.value);
                            if (newPrice > 0 && newPrice !== ps.price) {
                              await supabase.from("product_suppliers").update({ price: newPrice }).eq("id", ps.id);
                              fetchAllData();
                              toast({ title: "Đã cập nhật giá", description: `${ps.suppliers?.name}: ${formatPrice(newPrice)}` });
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">đ</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={async () => {
                            await supabase.from("product_suppliers").delete().eq("id", ps.id);
                            fetchAllData();
                            toast({ title: "Đã xóa nhà cung cấp", description: ps.suppliers?.name });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditProductDialog(false); setEditProductData(null); }}>Hủy</Button>
            <Button onClick={handleSaveProduct}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Product Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={(open) => { setShowMergeDialog(open); if (!open) { setMergeSourceId(""); setMergeTargetId(""); setMergeSearchQuery(""); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Gộp sản phẩm trùng
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Sản phẩm nguồn */}
            <div className="bg-destructive/10 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Sản phẩm sẽ bị XÓA (nguồn)</div>
              <div className="flex items-center gap-2">
                {products.find(p => p.id === mergeSourceId)?.image_url && (
                  <img src={products.find(p => p.id === mergeSourceId)?.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                )}
                <div>
                  <div className="font-semibold text-sm">{products.find(p => p.id === mergeSourceId)?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(products.find(p => p.id === mergeSourceId)?.price || 0)} • 
                    {productSuppliers[mergeSourceId]?.length || 0} NCC
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-muted-foreground text-sm">↓ Gộp nhà cung cấp vào ↓</div>

            {/* Tìm sản phẩm đích */}
            <div>
              <label className="text-sm font-medium">Chọn sản phẩm đích (giữ lại)</label>
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={mergeSearchQuery}
                onChange={(e) => setMergeSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {products
                .filter(p => p.id !== mergeSourceId)
                .filter(p => !mergeSearchQuery || 
                  p.name.toLowerCase().includes(mergeSearchQuery.toLowerCase()) ||
                  p.brand?.toLowerCase().includes(mergeSearchQuery.toLowerCase())
                )
                .map(p => (
                  <button
                    key={p.id}
                    className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                      mergeTargetId === p.id ? "bg-primary/10 border border-primary" : "hover:bg-muted/50 border border-transparent"
                    }`}
                    onClick={() => setMergeTargetId(p.id)}
                  >
                    {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(p.price)} • {p.brand || "N/A"} • {productSuppliers[p.id]?.length || 0} NCC
                      </div>
                    </div>
                    {mergeTargetId === p.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                ))
              }
            </div>

            {mergeTargetId && (
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Sản phẩm đích (GIỮ LẠI)</div>
                <div className="flex items-center gap-2">
                  {products.find(p => p.id === mergeTargetId)?.image_url && (
                    <img src={products.find(p => p.id === mergeTargetId)?.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">{products.find(p => p.id === mergeTargetId)?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPrice(products.find(p => p.id === mergeTargetId)?.price || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-destructive">
              ⚠️ Hành động này sẽ chuyển tất cả nhà cung cấp từ sản phẩm nguồn sang sản phẩm đích, sau đó xóa sản phẩm nguồn. Không thể hoàn tác!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMergeDialog(false); setMergeSourceId(""); setMergeTargetId(""); setMergeSearchQuery(""); }}>Hủy</Button>
            <Button variant="destructive" onClick={handleMergeProduct} disabled={!mergeTargetId}>
              <Link2 className="h-4 w-4 mr-1" /> Gộp sản phẩm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pet Detail Dialog */}
      <Dialog open={showPetDetail} onOpenChange={setShowPetDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" /> Thú cưng đã đăng ký ({detailPets.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {detailPets.map((pet) => (
              <div key={pet.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-3">
                  {pet.image_url && <img src={pet.image_url} alt="" className="h-12 w-12 rounded-full object-cover border" />}
                  <div>
                    <div className="font-semibold">{pet.name} {pet.nickname ? `(${pet.nickname})` : ""}</div>
                    <div className="text-xs text-muted-foreground capitalize">{pet.type} {pet.breed ? `• ${pet.breed}` : ""}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <InfoRow label="Giới tính" value={pet.gender === "male" ? "Đực" : pet.gender === "female" ? "Cái" : "Không rõ"} />
                  <InfoRow label="Cân nặng" value={pet.weight ? `${pet.weight} kg` : "Chưa cập nhật"} />
                  <InfoRow label="Ngày sinh" value={pet.birth_date ? new Date(pet.birth_date).toLocaleDateString("vi-VN") : "Chưa cập nhật"} />
                  <InfoRow label="Ngày tạo" value={new Date(pet.created_at).toLocaleDateString("vi-VN")} />
                  {pet.notes && <InfoRow label="Ghi chú" value={pet.notes} full />}
                </div>

                {/* Hồ sơ y tế */}
                <div>
                  <div className="text-sm font-medium mb-1">Hồ sơ y tế</div>
                  {(petMedicalRecords[pet.id]?.length || 0) > 0 ? (
                    <div className="space-y-1">
                      {petMedicalRecords[pet.id].map((rec: any) => (
                        <div key={rec.id} className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
                          <div className="flex justify-between">
                            <span className="font-medium">{rec.title}</span>
                            <span className="text-muted-foreground">{new Date(rec.date).toLocaleDateString("vi-VN")}</span>
                          </div>
                          {rec.record_type && <div className="text-muted-foreground">Loại: {rec.record_type}</div>}
                          {rec.veterinarian && <div className="text-muted-foreground">Bác sĩ: {rec.veterinarian}</div>}
                          {rec.clinic_name && <div className="text-muted-foreground">Phòng khám: {rec.clinic_name}</div>}
                          {rec.description && <div className="text-muted-foreground">{rec.description}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Không có hồ sơ y tế</p>
                  )}
                </div>

                {/* Tiêm chủng */}
                <div>
                  <div className="text-sm font-medium mb-1">Tiêm chủng</div>
                  {(petVaccines[pet.id]?.length || 0) > 0 ? (
                    <div className="space-y-1">
                      {petVaccines[pet.id].map((vac: any) => (
                        <div key={vac.id} className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
                          <div className="flex justify-between">
                            <span className="font-medium">{vac.name}</span>
                            <span className="text-muted-foreground">{new Date(vac.date).toLocaleDateString("vi-VN")}</span>
                          </div>
                          {vac.veterinarian && <div className="text-muted-foreground">Bác sĩ: {vac.veterinarian}</div>}
                          {vac.clinic && <div className="text-muted-foreground">Phòng khám: {vac.clinic}</div>}
                          {vac.batch_no && <div className="text-muted-foreground">Số lô: {vac.batch_no}</div>}
                          {vac.next_date && <div className="text-muted-foreground">Lần tiếp: {new Date(vac.next_date).toLocaleDateString("vi-VN")}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Không có lịch tiêm chủng</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPetDetail(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
