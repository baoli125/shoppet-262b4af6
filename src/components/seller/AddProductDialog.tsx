import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, Plus, ArrowLeft, Check, Upload, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageCropper from "@/components/ImageCropper";

const CATEGORY_LABELS: Record<string, string> = {
  food: "Thức ăn", toy: "Đồ chơi", accessory: "Phụ kiện",
  medicine: "Thuốc", grooming: "Chăm sóc", other: "Khác",
};

type Step = "choose-mode" | "select-existing" | "new-product" | "set-price";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
  editingProduct?: any;
}

export const AddProductDialog = ({ open, onOpenChange, userId, onSuccess, editingProduct }: AddProductDialogProps) => {
  const [step, setStep] = useState<Step>("choose-mode");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [supplierPrice, setSupplierPrice] = useState("");
  const [supplierStock, setSupplierStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string>("");
  const { toast } = useToast();

  // New product form
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", stock: "", category: "", pet_type: "",
    brand: "", weight: "", image_url: "", ingredients: "", features: "", usage_instructions: "",
  });

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setStep("new-product");
        setFormData({
          name: editingProduct.name, description: editingProduct.description || "",
          price: editingProduct.price.toString(), stock: (editingProduct.stock || 0).toString(),
          category: editingProduct.category, pet_type: editingProduct.pet_type || "",
          brand: editingProduct.brand || "", weight: editingProduct.weight || "",
          image_url: editingProduct.image_url || "", ingredients: editingProduct.ingredients || "",
          features: editingProduct.features || "", usage_instructions: editingProduct.usage_instructions || "",
        });
        setImagePreview(editingProduct.image_url || "");
      } else {
        resetAll();
      }
    }
  }, [open, editingProduct]);

  const resetAll = () => {
    setStep("choose-mode");
    setSelectedCategory("");
    setSearchQuery("");
    setExistingProducts([]);
    setSelectedProduct(null);
    setSupplierPrice("");
    setSupplierStock("");
    setImagePreview("");
    setFormData({ name: "", description: "", price: "", stock: "", category: "", pet_type: "", brand: "", weight: "", image_url: "", ingredients: "", features: "", usage_instructions: "" });
  };
  // Open cropper when user selects a file
  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Lỗi", description: "Vui lòng chọn file ảnh", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Lỗi", description: "Kích thước ảnh không được vượt quá 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Upload cropped image blob
  const handleCroppedImage = async (blob: Blob) => {
    setIsUploadingImage(true);
    try {
      const fileName = `${Date.now()}.jpg`;
      const filePath = `products/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      toast({ title: "Thành công! ✨", description: "Ảnh sản phẩm đã được tải lên" });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({ title: "Lỗi", description: "Không thể tải lên ảnh", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Delete uploaded image
  const handleDeleteImage = async () => {
    if (!formData.image_url) return;

    try {
      // Extract file path from URL
      const urlParts = formData.image_url.split('/storage/v1/object/public/product-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('product-images').remove([filePath]);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }

    setFormData({ ...formData, image_url: "" });
    setImagePreview("");
    toast({ title: "Đã xóa ảnh" });
  };

  // Fetch existing marketplace products
  const fetchExistingProducts = async (category?: string) => {
    let query = supabase.from("products").select("*, product_suppliers(supplier_id)").eq("is_active", true);
    if (category && category !== "all") query = query.eq("category", category as any);
    const { data } = await query.order("name");
    setExistingProducts(data || []);
  };

  useEffect(() => {
    if (step === "select-existing") {
      fetchExistingProducts(selectedCategory || undefined);
    }
  }, [step, selectedCategory]);

  const filteredExisting = useMemo(() => {
    if (!searchQuery) return existingProducts;
    return existingProducts.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [existingProducts, searchQuery]);

  // Check if seller already supplies this product
  const checkAlreadySupplier = async (productId: string) => {
    const { data: supplierData } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!supplierData) return false;

    const { data: existing } = await supabase
      .from("product_suppliers")
      .select("id")
      .eq("product_id", productId)
      .eq("supplier_id", supplierData.id)
      .maybeSingle();

    return !!existing;
  };

  const handleSelectExisting = async (product: any) => {
    const alreadyLinked = await checkAlreadySupplier(product.id);
    if (alreadyLinked) {
      toast({ title: "Đã liên kết", description: "Bạn đã cung cấp sản phẩm này rồi.", variant: "destructive" });
      return;
    }
    setSelectedProduct(product);
    setStep("set-price");
  };

  // Link existing product to seller's supplier
  const handleLinkExisting = async () => {
    if (!supplierPrice || parseFloat(supplierPrice) <= 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập giá hợp lệ", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Get or create supplier for this seller
      const { data: supplierId, error: rpcError } = await supabase.rpc("get_or_create_supplier", { p_user_id: userId });
      if (rpcError) throw rpcError;

      // Insert product_suppliers entry
      const { error } = await supabase.from("product_suppliers").insert({
        product_id: selectedProduct.id,
        supplier_id: supplierId,
        price: parseFloat(supplierPrice),
        stock: parseInt(supplierStock) || 0,
      });
      if (error) throw error;

      toast({ title: "Liên kết thành công! 🎉", description: `Đã thêm "${selectedProduct.name}" vào danh sách cung cấp` });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể liên kết sản phẩm", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Create brand new product + link supplier
  const handleCreateNew = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }
    setLoading(true);
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

        const { data: supplierId, error: rpcError } = await supabase.rpc("get_or_create_supplier", { p_user_id: userId });
        if (rpcError) throw rpcError;

        if (supplierId) {
          const { data: existingSupplierLink, error: supplierFetchError } = await supabase
            .from("product_suppliers")
            .select("id")
            .eq("product_id", editingProduct.id)
            .eq("supplier_id", supplierId)
            .maybeSingle();
          if (supplierFetchError) throw supplierFetchError;

          const supplierPayload = {
            product_id: editingProduct.id,
            supplier_id: supplierId,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock) || 0,
          };

          if (existingSupplierLink) {
            const { error: supplierUpdateError } = await supabase
              .from("product_suppliers")
              .update(supplierPayload)
              .eq("product_id", editingProduct.id)
              .eq("supplier_id", supplierId);
            if (supplierUpdateError) throw supplierUpdateError;
          } else {
            const { error: supplierInsertError } = await supabase
              .from("product_suppliers")
              .insert(supplierPayload);
            if (supplierInsertError) throw supplierInsertError;
          }
        }

        toast({ title: "Cập nhật thành công! ✨" });
      } else {
        // Create product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({ ...payload, seller_id: userId })
          .select("id")
          .single();
        if (error) throw error;

        // Also create product_suppliers entry
        const { data: supplierId, error: rpcError } = await supabase.rpc("get_or_create_supplier", { p_user_id: userId });
        if (!rpcError && supplierId && newProduct) {
          await supabase.from("product_suppliers").insert({
            product_id: newProduct.id,
            supplier_id: supplierId,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock) || 0,
          });
        }
        toast({ title: "Thêm sản phẩm thành công! 🎉" });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể lưu sản phẩm.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderChooseMode = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Bạn muốn thêm sản phẩm như thế nào?</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card
          className="p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
          onClick={() => setStep("select-existing")}
        >
          <Search className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-1">Liên kết sản phẩm đã có</h3>
          <p className="text-xs text-muted-foreground">Tìm sản phẩm đang bán trên marketplace và thêm giá cung cấp của bạn</p>
        </Card>
        <Card
          className="p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all group"
          onClick={() => setStep("new-product")}
        >
          <Plus className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-1">Tạo sản phẩm mới</h3>
          <p className="text-xs text-muted-foreground">Thêm sản phẩm chưa có trên marketplace</p>
        </Card>
      </div>
    </div>
  );

  const renderSelectExisting = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("choose-mode")} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm sản phẩm..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[400px] pr-2">
        <div className="space-y-2">
          {filteredExisting.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Không tìm thấy sản phẩm</p>
              <Button variant="link" size="sm" onClick={() => setStep("new-product")} className="mt-2">
                Tạo sản phẩm mới
              </Button>
            </div>
          ) : (
            filteredExisting.map(product => (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                onClick={() => handleSelectExisting(product)}
              >
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                      <Badge variant="outline" className="text-[10px] px-1.5">{CATEGORY_LABELS[product.category]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {(product.product_suppliers?.length || 0)} nhà cung cấp
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-primary">{product.price.toLocaleString()}đ</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderSetPrice = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setStep("select-existing")} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>

      {selectedProduct && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            {selectedProduct.image_url ? (
              <img src={selectedProduct.image_url} alt="" className="h-14 w-14 rounded object-cover" />
            ) : (
              <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-semibold">{selectedProduct.name}</p>
              <p className="text-xs text-muted-foreground">{selectedProduct.brand} • {CATEGORY_LABELS[selectedProduct.category]}</p>
              <p className="text-sm text-primary font-medium mt-0.5">Giá gốc: {selectedProduct.price.toLocaleString()}đ</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Giá bán của bạn (đ) <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            value={supplierPrice}
            onChange={e => setSupplierPrice(e.target.value)}
            placeholder="Nhập giá bán"
          />
        </div>
        <div>
          <Label>Số lượng tồn kho</Label>
          <Input
            type="number"
            value={supplierStock}
            onChange={e => setSupplierStock(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <Button onClick={handleLinkExisting} disabled={loading} className="w-full gap-2">
        <Check className="h-4 w-4" />
        {loading ? "Đang xử lý..." : "Xác nhận liên kết"}
      </Button>
    </div>
  );

  const renderNewProduct = () => (
    <div className="space-y-4">
      {!editingProduct && (
        <Button variant="ghost" size="sm" onClick={() => setStep("choose-mode")} className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
      )}
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
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
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
        {/* 🔥 IMAGE UPLOAD SECTION - Giống Facebook */}
        <div className="sm:col-span-2">
          <Label>Hình ảnh sản phẩm</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all relative group">
            {imagePreview || formData.image_url ? (
              <div className="space-y-3">
                <img src={imagePreview || formData.image_url} alt="preview" className="h-28 w-28 mx-auto object-cover rounded-lg shadow-md" />
                <div className="flex gap-2 justify-center">
                  <label htmlFor="product-image-upload" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full cursor-pointer gap-1"
                      onClick={() => document.getElementById('product-image-upload')?.click()}
                      disabled={isUploadingImage}
                    >
                      <Camera className="h-4 w-4" />
                      {isUploadingImage ? "Đang tải..." : "Đổi ảnh"}
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={handleDeleteImage}
                    disabled={isUploadingImage}
                  >
                    <X className="h-4 w-4" /> Xóa
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="product-image-upload"
                className="flex flex-col items-center gap-2 cursor-pointer w-full"
              >
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chọn ảnh hoặc kéo thả vào</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG (Tối đa 5MB)</p>
                </div>
                {isUploadingImage && (
                  <div className="mt-2">
                    <div className="inline-block animate-spin">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  </div>
                )}
              </label>
            )}
            <input
              id="product-image-upload"
              type="file"
              accept="image/*"
              onChange={handleProductImageSelect}
              disabled={isUploadingImage}
              className="hidden"
            />
          </div>
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
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
        <Button onClick={handleCreateNew} disabled={loading}>
          {loading ? "Đang xử lý..." : editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
        </Button>
      </DialogFooter>
    </div>
  );

  const getTitle = () => {
    if (editingProduct) return "Sửa sản phẩm";
    switch (step) {
      case "choose-mode": return "Thêm sản phẩm";
      case "select-existing": return "Chọn sản phẩm đã có";
      case "set-price": return "Nhập giá cung cấp";
      case "new-product": return "Tạo sản phẩm mới";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{getTitle()}</DialogTitle></DialogHeader>
        {step === "choose-mode" && renderChooseMode()}
        {step === "select-existing" && renderSelectExisting()}
        {step === "set-price" && renderSetPrice()}
        {step === "new-product" && renderNewProduct()}
      </DialogContent>
    </Dialog>
  );
};
