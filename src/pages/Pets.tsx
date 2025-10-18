import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  nickname?: string;
  type: string;
  breed?: string;
  gender: string;
  birth_date?: string;
  weight?: number;
  image_url?: string;
  notes?: string;
}

const Pets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    type: "dog",
    breed: "",
    gender: "unknown",
    birth_date: "",
    weight: "",
    notes: "",
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thú cưng",
        variant: "destructive",
      });
    } else {
      setPets(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const petData = {
        user_id: user.id,
        name: formData.name,
        nickname: formData.nickname || null,
        type: formData.type as "dog" | "cat" | "bird" | "fish" | "other",
        breed: formData.breed || null,
        gender: formData.gender as "male" | "female" | "unknown",
        birth_date: formData.birth_date || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes || null,
      };

      if (editingPet) {
        const { error } = await supabase
          .from("pets")
          .update(petData)
          .eq("id", editingPet.id);

        if (error) throw error;
        toast({ title: "Cập nhật thành công!" });
      } else {
        const { error } = await supabase.from("pets").insert([petData]);
        if (error) throw error;
        toast({ title: "Thêm thú cưng thành công! 🐾" });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchPets();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      nickname: pet.nickname || "",
      type: pet.type,
      breed: pet.breed || "",
      gender: pet.gender,
      birth_date: pet.birth_date || "",
      weight: pet.weight?.toString() || "",
      notes: pet.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thú cưng này?")) return;

    const { error } = await supabase.from("pets").delete().eq("id", id);
    
    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa thú cưng",
        variant: "destructive",
      });
    } else {
      toast({ title: "Đã xóa thú cưng" });
      fetchPets();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nickname: "",
      type: "dog",
      breed: "",
      gender: "unknown",
      birth_date: "",
      weight: "",
      notes: "",
    });
    setEditingPet(null);
  };

  const getPetIcon = (type: string) => {
    const icons: Record<string, string> = {
      dog: "🐕",
      cat: "🐈",
      bird: "🦜",
      fish: "🐠",
      other: "🐾",
    };
    return icons[type] || "🐾";
  };

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (years > 0) return `${years} tuổi`;
    if (months > 0) return `${months} tháng`;
    return "Dưới 1 tháng";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hồ sơ Thú cưng</h1>
                <p className="text-sm text-muted-foreground">
                  Quản lý thông tin và sức khỏe thú cưng
                </p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-hero" onClick={resetForm}>
                  <Plus className="w-5 h-5 mr-2" />
                  Thêm thú cưng
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPet ? "Chỉnh sửa thú cưng" : "Thêm thú cưng mới"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên thú cưng *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nickname">Tên thân mật</Label>
                      <Input
                        id="nickname"
                        value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Loài *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">🐕 Chó</SelectItem>
                          <SelectItem value="cat">🐈 Mèo</SelectItem>
                          <SelectItem value="bird">🦜 Chim</SelectItem>
                          <SelectItem value="fish">🐠 Cá</SelectItem>
                          <SelectItem value="other">🐾 Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed">Giống</Label>
                      <Input
                        id="breed"
                        value={formData.breed}
                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Giới tính</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Đực</SelectItem>
                          <SelectItem value="female">Cái</SelectItem>
                          <SelectItem value="unknown">Chưa rõ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Ngày sinh</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Cân nặng (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" className="btn-hero" disabled={isLoading}>
                      {isLoading ? "Đang lưu..." : editingPet ? "Cập nhật" : "Thêm mới"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Pets Grid */}
      <div className="container mx-auto px-4 py-8">
        {pets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold mb-2">Chưa có thú cưng nào</h2>
            <p className="text-muted-foreground mb-6">
              Thêm thú cưng đầu tiên để bắt đầu quản lý sức khỏe của bạn ấy
            </p>
            <Button className="btn-hero" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Thêm thú cưng
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <Card key={pet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{getPetIcon(pet.type)}</div>
                    <div>
                      <h3 className="text-xl font-bold">{pet.name}</h3>
                      {pet.nickname && (
                        <p className="text-sm text-muted-foreground">"{pet.nickname}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(pet)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pet.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {pet.breed && (
                    <p className="text-sm">
                      <span className="font-semibold">Giống:</span> {pet.breed}
                    </p>
                  )}
                  {pet.birth_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{getAge(pet.birth_date)}</span>
                    </div>
                  )}
                  {pet.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Weight className="w-4 h-4" />
                      <span>{pet.weight} kg</span>
                    </div>
                  )}
                  {pet.notes && (
                    <p className="text-sm text-muted-foreground mt-3">{pet.notes}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pets;
