import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Syringe, Stethoscope, Calendar, ShieldCheck, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  name: string;
  nickname?: string;
  type: string;
  breed?: string;
  birth_date?: string;
  weight?: number;
  image_url?: string;
}

interface Vaccine {
  id: string;
  name: string;
  date: string;
  next_date: string | null;
  valid_until: string | null;
  batch_no: string | null;
  clinic: string | null;
  veterinarian: string | null;
  verified_by: string | null;
  notes: string | null;
}

interface MedicalRecord {
  id: string;
  record_type: string;
  date: string;
  title: string;
  description: string | null;
  veterinarian: string | null;
  clinic_name: string | null;
}

const PetShare = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPetData();
    }
  }, [id]);

  const fetchPetData = async () => {
    try {
      // Fetch pet basic info (public read)
      const { data: petData, error: petError } = await supabase
        .from("pets")
        .select("name, nickname, type, breed, birth_date, weight, image_url")
        .eq("id", id)
        .single();

      if (petError) throw petError;
      setPet(petData);

      // Fetch vaccines
      const { data: vaccineData } = await supabase
        .from("vaccines")
        .select("*")
        .eq("pet_id", id)
        .order("date", { ascending: false });

      if (vaccineData) setVaccines(vaccineData);

      // Fetch medical records
      const { data: medicalData } = await supabase
        .from("medical_records")
        .select("id, record_type, date, title, description, veterinarian, clinic_name")
        .eq("pet_id", id)
        .order("date", { ascending: false });

      if (medicalData) setMedicalRecords(medicalData);

    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin thú cưng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPetIcon = (type: string) => {
    const icons: Record<string, string> = {
      dog: "🐕",
      cat: "🐱",
      bird: "🐦",
      fish: "🐟",
      other: "🐾"
    };
    return icons[type] || "🐾";
  };

  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
    if (months < 12) return `${months} tháng tuổi`;
    const years = Math.floor(months / 12);
    return `${years} tuổi`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Không tìm thấy thông tin thú cưng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card header-shadow sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Hồ sơ thú cưng</h1>
              <p className="text-sm text-muted-foreground">Chế độ xem công khai - Chỉ xem</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pet Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getPetIcon(pet.type)}</span>
                  <div>
                    <CardTitle>{pet.name}</CardTitle>
                    {pet.nickname && <p className="text-sm text-muted-foreground">"{pet.nickname}"</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {pet.image_url && (
                  <img 
                    src={pet.image_url} 
                    alt={pet.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                {pet.breed && (
                  <div>
                    <p className="text-sm text-muted-foreground">Giống</p>
                    <p className="font-semibold">{pet.breed}</p>
                  </div>
                )}
                {pet.birth_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tuổi</p>
                    <p className="font-semibold">{getAge(pet.birth_date)}</p>
                  </div>
                )}
                {pet.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cân nặng</p>
                    <p className="font-semibold">{pet.weight} kg</p>
                  </div>
                )}
                <Badge variant="secondary" className="w-full justify-center">
                  🔒 Xem công khai
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Right: Health Records */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vaccines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="w-5 h-5" />
                  Lịch sử tiêm chủng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vaccines.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có lịch sử tiêm chủng</p>
                ) : (
                  <div className="space-y-3">
                    {vaccines.map((vaccine) => (
                      <Card key={vaccine.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold">{vaccine.name}</h4>
                                {vaccine.verified_by && (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Đã xác minh
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                                <p>📅 Ngày tiêm: {new Date(vaccine.date).toLocaleDateString('vi-VN')}</p>
                                {vaccine.next_date && (
                                  <p>🔄 Tiêm nhắc: {new Date(vaccine.next_date).toLocaleDateString('vi-VN')}</p>
                                )}
                                {vaccine.batch_no && <p>🏷️ Số lô: {vaccine.batch_no}</p>}
                                {vaccine.clinic && <p>🏥 Phòng khám: {vaccine.clinic}</p>}
                                {vaccine.veterinarian && <p>👨‍⚕️ Bác sĩ: {vaccine.veterinarian}</p>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Records */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  Hồ sơ bệnh án
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có hồ sơ bệnh án</p>
                ) : (
                  <div className="space-y-3">
                    {medicalRecords.map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-accent">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold">{record.title}</h4>
                              <div className="text-sm text-muted-foreground space-y-1 mt-2">
                                <p>📅 {new Date(record.date).toLocaleDateString('vi-VN')}</p>
                                {record.clinic_name && <p>🏥 {record.clinic_name}</p>}
                                {record.veterinarian && <p>👨‍⚕️ {record.veterinarian}</p>}
                                {record.description && (
                                  <p className="mt-2 text-foreground">{record.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetShare;