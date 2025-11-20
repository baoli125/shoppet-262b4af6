import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, Weight, Cake, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PetHealthSection } from "@/components/PetHealthSection";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

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

interface FeedingLog {
  id: string;
  product_name: string;
  product_weight?: string;
  start_date: string;
  estimated_days: number;
  end_date: string;
  actual_end_date?: string;
  notes?: string;
}

const PetsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPetDetails();
      fetchFeedingLogs();
    }
  }, [id]);

  const fetchPetDetails = async () => {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin thú cưng",
        variant: "destructive",
      });
      navigate("/pets");
    } else {
      setPet(data);
    }
    setLoading(false);
  };

  const fetchFeedingLogs = async () => {
    const { data } = await supabase
      .from("feeding_logs")
      .select("*")
      .eq("pet_id", id)
      .order("start_date", { ascending: false });

    if (data) {
      setFeedingLogs(data);
    }
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                        (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} tháng tuổi`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
    }
  };

  const getPetIcon = (type: string) => {
    switch (type) {
      case 'dog': return '🐕';
      case 'cat': return '🐈';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      case 'fish': return '🐠';
      case 'hamster': return '🐹';
      default: return '🐾';
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Đực';
      case 'female': return 'Cái';
      default: return 'Chưa xác định';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/pets")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{pet.name}</h1>
                {pet.nickname && (
                  <p className="text-sm text-muted-foreground">Biệt danh: {pet.nickname}</p>
                )}
              </div>
            </div>
            <Button onClick={() => navigate(`/pets/edit/${pet.id}`)}>
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Pet Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-32 h-32 rounded-full bg-muted flex items-center justify-center text-6xl mb-4 overflow-hidden">
                  {pet.image_url ? (
                    <img src={pet.image_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getPetIcon(pet.type)}</span>
                  )}
                </div>
                <CardTitle className="text-2xl">{pet.name}</CardTitle>
                {pet.nickname && (
                  <CardDescription className="text-lg">"{pet.nickname}"</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loại</span>
                  <Badge variant="secondary">{getPetIcon(pet.type)} {pet.type}</Badge>
                </div>
                {pet.breed && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Giống</span>
                    <span className="font-medium">{pet.breed}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Giới tính</span>
                  <span className="font-medium">{getGenderLabel(pet.gender)}</span>
                </div>
                {pet.birth_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Cake className="w-4 h-4" />
                      Tuổi
                    </span>
                    <span className="font-medium">{getAge(pet.birth_date)}</span>
                  </div>
                )}
                {pet.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      Cân nặng
                    </span>
                    <span className="font-medium">{pet.weight} kg</span>
                  </div>
                )}
                {pet.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Ghi chú</p>
                    <p className="text-sm">{pet.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="health" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="health">
                  <Activity className="w-4 h-4 mr-2" />
                  Sức Khỏe
                </TabsTrigger>
                <TabsTrigger value="feeding">
                  <Calendar className="w-4 h-4 mr-2" />
                  Dinh Dưỡng
                </TabsTrigger>
              </TabsList>

              <TabsContent value="health" className="mt-6">
                <PetHealthSection petId={pet.id} />
              </TabsContent>

              <TabsContent value="feeding" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Nhật Ký Dinh Dưỡng</CardTitle>
                    <CardDescription>
                      Theo dõi lịch sử thức ăn và dự kiến hết hàng
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedingLogs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Chưa có nhật ký dinh dưỡng</p>
                        <p className="text-sm mt-2">Mua thức ăn từ Marketplace để tự động ghi nhận</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feedingLogs.map((log) => {
                          const daysRemaining = getDaysRemaining(log.end_date);
                          const isRunningLow = daysRemaining > 0 && daysRemaining <= 5;
                          const isExpired = daysRemaining <= 0;

                          return (
                            <div
                              key={log.id}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{log.product_name}</h4>
                                  {log.product_weight && (
                                    <p className="text-sm text-muted-foreground">
                                      {log.product_weight}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant={
                                    isExpired ? "destructive" :
                                    isRunningLow ? "default" : "secondary"
                                  }
                                >
                                  {isExpired
                                    ? "Đã hết"
                                    : isRunningLow
                                    ? `Còn ${daysRemaining} ngày`
                                    : `${log.estimated_days} ngày`}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>
                                  Bắt đầu: {new Date(log.start_date).toLocaleDateString("vi-VN")}
                                </p>
                                <p>
                                  Dự kiến hết: {new Date(log.end_date).toLocaleDateString("vi-VN")}
                                </p>
                                {log.actual_end_date && (
                                  <p>
                                    Thực tế hết: {new Date(log.actual_end_date).toLocaleDateString("vi-VN")}
                                  </p>
                                )}
                              </div>
                              {log.notes && (
                                <p className="text-sm bg-accent/50 p-2 rounded">{log.notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetsDetail;
