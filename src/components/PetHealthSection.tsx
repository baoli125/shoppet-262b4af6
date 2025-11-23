import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Syringe, Stethoscope, Calendar, Trash2, Edit, FileText, CheckCircle, Upload, X, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { PetQRShare } from "./PetQRShare";

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
  attachments: string[] | null;
}

interface MedicalRecord {
  id: string;
  record_type: 'condition' | 'checkup' | 'prescription';
  date: string;
  title: string;
  description: string | null;
  veterinarian: string | null;
  clinic_name: string | null;
  next_checkup_date: string | null;
  prescription_details: string | null;
  attachments: string[] | null;
}

interface PetHealthSectionProps {
  petId: string;
}

export const PetHealthSection = ({ petId }: PetHealthSectionProps) => {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isVaccineDialogOpen, setIsVaccineDialogOpen] = useState(false);
  const [isMedicalDialogOpen, setIsMedicalDialogOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const [editingMedical, setEditingMedical] = useState<MedicalRecord | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [vaccineFiles, setVaccineFiles] = useState<File[]>([]);
  const [medicalFiles, setMedicalFiles] = useState<File[]>([]);
  const [vaccineDragActive, setVaccineDragActive] = useState(false);
  const [medicalDragActive, setMedicalDragActive] = useState(false);
  const { toast } = useToast();

  // Vaccine form state
  const [vaccineForm, setVaccineForm] = useState({
    name: "",
    date: "",
    next_date: "",
    valid_until: "",
    batch_no: "",
    clinic: "",
    veterinarian: "",
    notes: "",
    attachments: [] as string[],
  });

  // Medical record form state
  const [medicalForm, setMedicalForm] = useState({
    record_type: "checkup" as 'condition' | 'checkup' | 'prescription',
    date: "",
    title: "",
    description: "",
    veterinarian: "",
    clinic_name: "",
    next_checkup_date: "",
    prescription_details: "",
  });

  useEffect(() => {
    fetchVaccines();
    fetchMedicalRecords();
  }, [petId]);

  const fetchVaccines = async () => {
    const { data, error } = await supabase
      .from("vaccines")
      .select("*")
      .eq("pet_id", petId)
      .order("date", { ascending: false });

    if (!error && data) {
      setVaccines(data);
    }
  };

  const fetchMedicalRecords = async () => {
    const { data, error } = await supabase
      .from("medical_records")
      .select("*")
      .eq("pet_id", petId)
      .order("date", { ascending: false });

    if (!error && data) {
      setMedicalRecords(data as MedicalRecord[]);
    }
  };

  const handleSaveVaccine = async () => {
    if (!vaccineForm.name || !vaccineForm.date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Upload files first if any
    let attachmentUrls: string[] = editingVaccine?.attachments || [];
    if (vaccineFiles.length > 0) {
      const uploaded = await uploadFiles(vaccineFiles, 'vaccines');
      if (uploaded) {
        attachmentUrls = [...attachmentUrls, ...uploaded];
      }
    }

    const vaccineData = {
      pet_id: petId,
      name: vaccineForm.name,
      date: vaccineForm.date,
      next_date: vaccineForm.next_date || null,
      valid_until: vaccineForm.valid_until || null,
      batch_no: vaccineForm.batch_no || null,
      clinic: vaccineForm.clinic || null,
      veterinarian: vaccineForm.veterinarian || null,
      notes: vaccineForm.notes || null,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
    };

    let error;
    if (editingVaccine) {
      ({ error } = await supabase
        .from("vaccines")
        .update(vaccineData)
        .eq("id", editingVaccine.id));
    } else {
      ({ error } = await supabase.from("vaccines").insert([vaccineData]));
    }

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin tiêm chủng",
        variant: "destructive",
      });
    } else {
      toast({ title: editingVaccine ? "Đã cập nhật" : "Đã thêm mới" });
      setIsVaccineDialogOpen(false);
      resetVaccineForm();
      setVaccineFiles([]);
      fetchVaccines();
    }
  };

  const handleSaveMedical = async () => {
    if (!medicalForm.title || !medicalForm.date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Upload files first if any
    let attachmentUrls: string[] = editingMedical?.attachments || [];
    if (medicalFiles.length > 0) {
      const uploaded = await uploadFiles(medicalFiles, 'medical');
      if (uploaded) {
        attachmentUrls = [...attachmentUrls, ...uploaded];
      }
    }

    const medicalData = {
      pet_id: petId,
      record_type: medicalForm.record_type,
      date: medicalForm.date,
      title: medicalForm.title,
      description: medicalForm.description || null,
      veterinarian: medicalForm.veterinarian || null,
      clinic_name: medicalForm.clinic_name || null,
      next_checkup_date: medicalForm.next_checkup_date || null,
      prescription_details: medicalForm.prescription_details || null,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
    };

    let error;
    if (editingMedical) {
      ({ error } = await supabase
        .from("medical_records")
        .update(medicalData)
        .eq("id", editingMedical.id));
    } else {
      ({ error } = await supabase.from("medical_records").insert([medicalData]));
    }

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu hồ sơ y tế",
        variant: "destructive",
      });
    } else {
      toast({ title: editingMedical ? "Đã cập nhật" : "Đã thêm mới" });
      setIsMedicalDialogOpen(false);
      resetMedicalForm();
      setMedicalFiles([]);
      fetchMedicalRecords();
    }
  };

  const uploadFiles = async (files: File[], type: 'vaccines' | 'medical') => {
    setUploadingFiles(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Lỗi",
          description: `File ${file.name} quá lớn (tối đa 10MB)`,
          variant: "destructive",
        });
        continue;
      }

      const allowedTypes = ['image/', 'application/pdf'];
      if (!allowedTypes.some(t => file.type.startsWith(t))) {
        toast({
          title: "Lỗi",
          description: `File ${file.name} không hợp lệ (chỉ chấp nhận ảnh và PDF)`,
          variant: "destructive",
        });
        continue;
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Lỗi",
          description: `Không thể tải lên ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    setUploadingFiles(false);
    return uploadedUrls;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'vaccine' | 'medical') => {
    const files = Array.from(e.target.files || []);
    if (type === 'vaccine') {
      setVaccineFiles(prev => [...prev, ...files]);
    } else {
      setMedicalFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number, type: 'vaccine' | 'medical') => {
    if (type === 'vaccine') {
      setVaccineFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setMedicalFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'vaccine' | 'medical') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'vaccine') {
      setVaccineDragActive(true);
    } else {
      setMedicalDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: 'vaccine' | 'medical') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'vaccine') {
      setVaccineDragActive(false);
    } else {
      setMedicalDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'vaccine' | 'medical') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'vaccine') {
      setVaccineDragActive(false);
    } else {
      setMedicalDragActive(false);
    }
    
    const files = Array.from(e.dataTransfer.files);
    if (type === 'vaccine') {
      setVaccineFiles(prev => [...prev, ...files]);
    } else {
      setMedicalFiles(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = async (url: string, type: 'vaccine' | 'medical', recordId: string) => {
    const record = type === 'vaccine' 
      ? vaccines.find(v => v.id === recordId)
      : medicalRecords.find(m => m.id === recordId);
    
    if (!record?.attachments) return;

    const updatedAttachments = record.attachments.filter(a => a !== url);

    const { error } = await supabase
      .from(type === 'vaccine' ? 'vaccines' : 'medical_records')
      .update({ attachments: updatedAttachments.length > 0 ? updatedAttachments : null })
      .eq('id', recordId);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa file đính kèm",
        variant: "destructive",
      });
    } else {
      toast({ title: "Đã xóa file đính kèm" });
      if (type === 'vaccine') {
        fetchVaccines();
      } else {
        fetchMedicalRecords();
      }
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    const { error } = await supabase.from("vaccines").delete().eq("id", id);
    if (!error) {
      toast({ title: "Đã xóa" });
      fetchVaccines();
    }
  };

  const handleDeleteMedical = async (id: string) => {
    const { error } = await supabase.from("medical_records").delete().eq("id", id);
    if (!error) {
      toast({ title: "Đã xóa" });
      fetchMedicalRecords();
    }
  };

  const resetVaccineForm = () => {
    setVaccineForm({
      name: "",
      date: "",
      next_date: "",
      valid_until: "",
      batch_no: "",
      clinic: "",
      veterinarian: "",
      notes: "",
      attachments: [],
    });
    setEditingVaccine(null);
  };

  const resetMedicalForm = () => {
    setMedicalForm({
      record_type: "checkup",
      date: "",
      title: "",
      description: "",
      veterinarian: "",
      clinic_name: "",
      next_checkup_date: "",
      prescription_details: "",
    });
    setEditingMedical(null);
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'condition': return 'Bệnh lý';
      case 'checkup': return 'Khám bệnh';
      case 'prescription': return 'Đơn thuốc';
      default: return type;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'condition': return 'destructive';
      case 'checkup': return 'default';
      case 'prescription': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Vaccines Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Hồ Sơ Tiêm Chủng
              </CardTitle>
              <CardDescription>Lịch sử và lịch nhắc tiêm chủng</CardDescription>
            </div>
            <Dialog open={isVaccineDialogOpen} onOpenChange={setIsVaccineDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetVaccineForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm mũi tiêm
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingVaccine ? 'Cập nhật' : 'Thêm'} mũi tiêm</DialogTitle>
                  <DialogDescription>
                    Ghi nhận thông tin tiêm chủng cho thú cưng
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vaccine-name">Tên vắc-xin *</Label>
                    <Input
                      id="vaccine-name"
                      value={vaccineForm.name}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })}
                      placeholder="VD: Vắc-xin 5 bệnh"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaccine-date">Ngày tiêm *</Label>
                    <Input
                      id="vaccine-date"
                      type="date"
                      value={vaccineForm.date}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaccine-next">Ngày nhắc tiêm</Label>
                    <Input
                      id="vaccine-next"
                      type="date"
                      value={vaccineForm.next_date}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, next_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaccine-vet">Bác sĩ thú y</Label>
                    <Input
                      id="vaccine-vet"
                      value={vaccineForm.veterinarian}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian: e.target.value })}
                      placeholder="Tên bác sĩ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vaccine-notes">Ghi chú</Label>
                    <Textarea
                      id="vaccine-notes"
                      value={vaccineForm.notes}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                      placeholder="Ghi chú thêm"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <Label>Ảnh/PDF chứng nhận tiêm chủng</Label>
                    <div
                      onDragOver={(e) => handleDragOver(e, 'vaccine')}
                      onDragLeave={(e) => handleDragLeave(e, 'vaccine')}
                      onDrop={(e) => handleDrop(e, 'vaccine')}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        vaccineDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      <input
                        type="file"
                        id="vaccine-files"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'vaccine')}
                        className="hidden"
                      />
                      <label htmlFor="vaccine-files" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">
                          Kéo thả file vào đây hoặc click để chọn
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hỗ trợ ảnh (JPG, PNG) và PDF, tối đa 10MB
                        </p>
                      </label>
                    </div>

                    {/* Preview uploaded files */}
                    {vaccineFiles.length > 0 && (
                      <div className="space-y-2">
                        {vaccineFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <File className="w-10 h-10 p-2 bg-background rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index, 'vaccine')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show existing attachments when editing */}
                    {editingVaccine?.attachments && editingVaccine.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">File đính kèm hiện tại:</p>
                        {editingVaccine.attachments.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            {url.includes('.pdf') ? (
                              <File className="w-10 h-10 p-2 bg-background rounded" />
                            ) : (
                              <img
                                src={url}
                                alt="Attachment"
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Xem file
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment(url, 'vaccine', editingVaccine.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveVaccine} className="w-full" disabled={uploadingFiles}>
                    {uploadingFiles ? 'Đang tải lên...' : editingVaccine ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {vaccines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Syringe className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Chưa có lịch sử tiêm chủng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaccines.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{vaccine.name}</h4>
                      {vaccine.next_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Nhắc: {new Date(vaccine.next_date).toLocaleDateString('vi-VN')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ngày tiêm: {new Date(vaccine.date).toLocaleDateString('vi-VN')}
                    </p>
                    {vaccine.veterinarian && (
                      <p className="text-sm text-muted-foreground">
                        Bác sĩ: {vaccine.veterinarian}
                      </p>
                    )}
                    {vaccine.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{vaccine.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingVaccine(vaccine);
                        setVaccineForm({
                          name: vaccine.name,
                          date: vaccine.date,
                          next_date: vaccine.next_date || "",
                          valid_until: vaccine.valid_until || "",
                          batch_no: vaccine.batch_no || "",
                          clinic: vaccine.clinic || "",
                          veterinarian: vaccine.veterinarian || "",
                          notes: vaccine.notes || "",
                          attachments: vaccine.attachments || [],
                        });
                        setIsVaccineDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteVaccine(vaccine.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Records Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Hồ Sơ Y Tế
              </CardTitle>
              <CardDescription>Bệnh lý, lịch khám & đơn thuốc</CardDescription>
            </div>
            <Dialog open={isMedicalDialogOpen} onOpenChange={setIsMedicalDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetMedicalForm}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm hồ sơ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMedical ? 'Cập nhật' : 'Thêm'} hồ sơ y tế</DialogTitle>
                  <DialogDescription>
                    Ghi nhận thông tin y tế cho thú cưng
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="medical-type">Loại hồ sơ *</Label>
                    <Select
                      value={medicalForm.record_type}
                      onValueChange={(value: any) =>
                        setMedicalForm({ ...medicalForm, record_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="condition">Bệnh lý</SelectItem>
                        <SelectItem value="checkup">Khám bệnh</SelectItem>
                        <SelectItem value="prescription">Đơn thuốc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="medical-title">Tiêu đề *</Label>
                    <Input
                      id="medical-title"
                      value={medicalForm.title}
                      onChange={(e) => setMedicalForm({ ...medicalForm, title: e.target.value })}
                      placeholder="VD: Khám định kỳ, Viêm da, ..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="medical-date">Ngày *</Label>
                    <Input
                      id="medical-date"
                      type="date"
                      value={medicalForm.date}
                      onChange={(e) => setMedicalForm({ ...medicalForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="medical-description">Mô tả</Label>
                    <Textarea
                      id="medical-description"
                      value={medicalForm.description}
                      onChange={(e) => setMedicalForm({ ...medicalForm, description: e.target.value })}
                      placeholder="Triệu chứng, chẩn đoán, ..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medical-vet">Bác sĩ thú y</Label>
                      <Input
                        id="medical-vet"
                        value={medicalForm.veterinarian}
                        onChange={(e) => setMedicalForm({ ...medicalForm, veterinarian: e.target.value })}
                        placeholder="Tên bác sĩ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medical-clinic">Phòng khám</Label>
                      <Input
                        id="medical-clinic"
                        value={medicalForm.clinic_name}
                        onChange={(e) => setMedicalForm({ ...medicalForm, clinic_name: e.target.value })}
                        placeholder="Tên phòng khám"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="medical-next">Ngày tái khám</Label>
                    <Input
                      id="medical-next"
                      type="date"
                      value={medicalForm.next_checkup_date}
                      onChange={(e) =>
                        setMedicalForm({ ...medicalForm, next_checkup_date: e.target.value })
                      }
                    />
                  </div>
                  {medicalForm.record_type === 'prescription' && (
                    <div>
                      <Label htmlFor="medical-prescription">Chi tiết đơn thuốc</Label>
                      <Textarea
                        id="medical-prescription"
                        value={medicalForm.prescription_details}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, prescription_details: e.target.value })
                        }
                        placeholder="Tên thuốc, liều lượng, cách dùng..."
                        rows={4}
                      />
                    </div>
                  )}

                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <Label>Ảnh/PDF hồ sơ y tế</Label>
                    <div
                      onDragOver={(e) => handleDragOver(e, 'medical')}
                      onDragLeave={(e) => handleDragLeave(e, 'medical')}
                      onDrop={(e) => handleDrop(e, 'medical')}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        medicalDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                    >
                      <input
                        type="file"
                        id="medical-files"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'medical')}
                        className="hidden"
                      />
                      <label htmlFor="medical-files" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">
                          Kéo thả file vào đây hoặc click để chọn
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hỗ trợ ảnh (JPG, PNG) và PDF, tối đa 10MB
                        </p>
                      </label>
                    </div>

                    {/* Preview uploaded files */}
                    {medicalFiles.length > 0 && (
                      <div className="space-y-2">
                        {medicalFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <File className="w-10 h-10 p-2 bg-background rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(index, 'medical')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show existing attachments when editing */}
                    {editingMedical?.attachments && editingMedical.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">File đính kèm hiện tại:</p>
                        {editingMedical.attachments.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            {url.includes('.pdf') ? (
                              <File className="w-10 h-10 p-2 bg-background rounded" />
                            ) : (
                              <img
                                src={url}
                                alt="Attachment"
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Xem file
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment(url, 'medical', editingMedical.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button onClick={handleSaveMedical} className="w-full" disabled={uploadingFiles}>
                    {uploadingFiles ? 'Đang tải lên...' : editingMedical ? 'Cập nhật' : 'Thêm mới'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {medicalRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Chưa có hồ sơ y tế</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medicalRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getRecordTypeColor(record.record_type) as any}>
                        {getRecordTypeLabel(record.record_type)}
                      </Badge>
                      <h4 className="font-medium">{record.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(record.date).toLocaleDateString('vi-VN')}
                    </p>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mb-1">{record.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {record.veterinarian && <span>👨‍⚕️ {record.veterinarian}</span>}
                      {record.clinic_name && <span>🏥 {record.clinic_name}</span>}
                      {record.next_checkup_date && (
                        <span className="text-primary">
                          📅 Tái khám: {new Date(record.next_checkup_date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    {record.prescription_details && (
                      <p className="text-sm bg-accent/50 p-2 rounded mt-2">
                        💊 {record.prescription_details}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMedical(record);
                        setMedicalForm({
                          record_type: record.record_type,
                          date: record.date,
                          title: record.title,
                          description: record.description || "",
                          veterinarian: record.veterinarian || "",
                          clinic_name: record.clinic_name || "",
                          next_checkup_date: record.next_checkup_date || "",
                          prescription_details: record.prescription_details || "",
                        });
                        setIsMedicalDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMedical(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
