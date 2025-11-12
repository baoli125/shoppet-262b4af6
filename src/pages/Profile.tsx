import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Edit, TrendingUp, Save, X, Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      await Promise.all([
        fetchProfile(user.id),
        fetchBadges(user.id)
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name);
      setPhone(data.phone || "");
    }
  };

  const fetchBadges = async (userId: string) => {
    const { data } = await supabase
      .from("user_badges")
      .select(`
        *,
        badges (*)
      `)
      .eq("user_id", userId);

    setBadges(data || []);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          phone: phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      setIsEditing(false);
      await fetchProfile(user.id);
      toast({
        title: "Cập nhật thành công! ✨",
        description: "Thông tin cá nhân đã được cập nhật.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await fetchProfile(user.id);
      toast({
        title: "Thành công! ✨",
        description: "Ảnh đại diện đã được cập nhật.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên ảnh đại diện.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const levelThresholds = [
    { level: 1, points: 0, discount: 0, color: "text-gray-500" },
    { level: 2, points: 100, discount: 2, color: "text-green-500" },
    { level: 3, points: 300, discount: 5, color: "text-green-600" },
    { level: 4, points: 600, discount: 8, color: "text-blue-500" },
    { level: 5, points: 1000, discount: 12, color: "text-blue-600" },
    { level: 6, points: 1500, discount: 15, color: "text-purple-500" },
    { level: 7, points: 2100, discount: 18, color: "text-purple-600" },
    { level: 8, points: 2800, discount: 20, color: "text-yellow-500" },
  ];

  const getLevel = (points: number) => {
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (points >= levelThresholds[i].points) {
        return levelThresholds[i].level;
      }
    }
    return 1;
  };

  const getDiscount = (points: number) => {
    const level = getLevel(points);
    const threshold = levelThresholds.find(t => t.level === level);
    return threshold?.discount || 0;
  };

  const getLevelColor = (points: number) => {
    const level = getLevel(points);
    const threshold = levelThresholds.find(t => t.level === level);
    return threshold?.color || "text-gray-500";
  };

  const getNextLevelPoints = (points: number) => {
    const currentLevel = getLevel(points);
    if (currentLevel >= 8) return 0;
    const nextThreshold = levelThresholds.find(t => t.level === currentLevel + 1);
    return nextThreshold ? nextThreshold.points - points : 0;
  };

  const getCurrentLevelPoints = (points: number) => {
    const currentLevel = getLevel(points);
    const currentThreshold = levelThresholds.find(t => t.level === currentLevel);
    return currentThreshold?.points || 0;
  };

  const getProgressPercentage = (points: number) => {
    const currentLevel = getLevel(points);
    if (currentLevel >= 8) return 100;
    
    const currentThreshold = levelThresholds.find(t => t.level === currentLevel);
    const nextThreshold = levelThresholds.find(t => t.level === currentLevel + 1);
    
    if (!currentThreshold || !nextThreshold) return 0;
    
    const pointsInLevel = points - currentThreshold.points;
    const pointsNeeded = nextThreshold.points - currentThreshold.points;
    
    return Math.min(100, (pointsInLevel / pointsNeeded) * 100);
  };

  return (
    <div className="min-h-screen bg-background pt-14 sm:pt-16 md:pt-20">
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-4xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="md:col-span-2 p-4 sm:p-5 md:p-6">
              <div className="flex items-start gap-4 mb-6">
                <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-60" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
            <Card className="p-4 sm:p-5 md:p-6">
              <div className="text-center mb-6">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-3" />
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile Info */}
            <Card className="md:col-span-2 p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 ring-4 ring-primary/10 transition-all group-hover:ring-primary/30">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {profile?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 text-center sm:text-left w-full min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 truncate">{profile?.display_name}</h2>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 break-all">{user?.email}</p>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa thông tin
                  </Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0900 123 456"
                    className="h-11 text-base"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleUpdateProfile} 
                    className="flex-1 h-11 btn-hero touch-manipulation"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.display_name || "");
                      setPhone(profile?.phone || "");
                    }} 
                    className="flex-1 h-11 touch-manipulation"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm sm:text-base">
                <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                  <span className="font-semibold">Số điện thoại:</span> 
                  <span className="text-muted-foreground">{profile?.phone || "Chưa cập nhật"}</span>
                </p>
              </div>
            )}
          </Card>

          {/* Gamification Stats */}
          <Card className="p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in border-2 border-primary/10">
            <div className="text-center mb-4 sm:mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-3`}>
                <Trophy className={`h-8 w-8 sm:h-10 sm:w-10 text-white`} />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-bold mb-1 ${getLevelColor(profile?.points || 0)}`}>
                Level {getLevel(profile?.points || 0)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {profile?.points || 0} điểm
              </p>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-1.5">
                Giảm {getDiscount(profile?.points || 0)}% tất cả đơn hàng
              </p>
            </div>

            {getNextLevelPoints(profile?.points || 0) > 0 && (
              <div className="mb-5 sm:mb-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Level {getLevel(profile?.points || 0)}</span>
                  <span>Level {getLevel(profile?.points || 0) + 1}</span>
                </div>
                <Progress value={getProgressPercentage(profile?.points || 0)} className="h-2" />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Còn {getNextLevelPoints(profile?.points || 0)} điểm để lên level
                </p>
              </div>
            )}

            <div className="space-y-2.5 text-sm mb-5 sm:mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Đơn hàng hoàn thành:</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bài viết:</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Discount Benefits Card */}
        {!isLoading && (
        <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="truncate">🎯 Ưu đãi giảm giá theo level</span>
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {levelThresholds.map((threshold) => (
              <div
                key={threshold.level}
                className={`flex justify-between items-center p-2.5 sm:p-3 rounded-lg transition-colors ${
                  getLevel(profile?.points || 0) === threshold.level
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`font-bold text-sm sm:text-base ${threshold.color} flex-shrink-0`}>
                    Lv {threshold.level}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">
                    ({threshold.points} điểm)
                  </div>
                </div>
                <div className="font-semibold text-primary text-sm sm:text-base flex-shrink-0 ml-2">
                  -{threshold.discount}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xs sm:text-sm text-center leading-relaxed">
              💡 <span className="font-semibold">Mẹo:</span> Mỗi 10,000 VND = 1 điểm | Mỗi bài viết = 10 điểm
            </p>
          </div>
        </Card>
        )}

        {/* Badges */}
        {!isLoading && (
        <Card className="p-4 sm:p-5 md:p-6 mt-4 sm:mt-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Huy hiệu của tôi</span>
          </h3>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {badges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors touch-manipulation"
                >
                  <div className="text-3xl sm:text-4xl mb-2">{userBadge.badges.icon}</div>
                  <p className="font-semibold text-xs sm:text-sm text-center line-clamp-2">{userBadge.badges.name}</p>
                  <p className="text-xs text-muted-foreground text-center line-clamp-2 mt-1">{userBadge.badges.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Star className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base mb-1">Chưa có huy hiệu nào</p>
              <p className="text-xs sm:text-sm">Hoàn thành các nhiệm vụ để nhận huy hiệu!</p>
            </div>
          )}
        </Card>
        )}
      </main>
    </div>
  );
};

export default Profile;
