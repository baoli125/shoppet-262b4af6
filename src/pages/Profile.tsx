import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Edit, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      fetchProfile(user.id);
      fetchBadges(user.id);
    });
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
      fetchProfile(user.id);
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
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        userName={profile?.display_name || user?.email}
        userAvatar={profile?.avatar_url}
        cartCount={0}
        onLoginClick={() => {}}
        onLogoutClick={handleLogout}
      />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20 sm:pt-24 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Info */}
          <Card className="md:col-span-2 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto sm:mx-0">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xl sm:text-2xl">{profile?.display_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left w-full">
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{profile?.display_name}</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-all">{user?.email}</p>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0900 123 456"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateProfile}>Lưu</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Số điện thoại:</span> {profile?.phone || "Chưa cập nhật"}
                </p>
              </div>
            )}
          </Card>

          {/* Gamification Stats */}
          <Card className="p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-3 sm:mb-4`}>
                <Trophy className={`h-8 w-8 sm:h-10 sm:w-10 text-white`} />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-bold mb-1 ${getLevelColor(profile?.points || 0)}`}>
                Level {getLevel(profile?.points || 0)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {profile?.points || 0} điểm
              </p>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                Giảm {getDiscount(profile?.points || 0)}% tất cả đơn hàng
              </p>
            </div>

            {getNextLevelPoints(profile?.points || 0) > 0 && (
              <div className="mb-6">
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

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đơn hàng hoàn thành:</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bài viết:</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Discount Benefits Card */}
        <Card className="p-6 mt-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            🎯 Ưu đãi giảm giá theo level
          </h3>
          <div className="space-y-3">
            {levelThresholds.map((threshold) => (
              <div
                key={threshold.level}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  getLevel(profile?.points || 0) === threshold.level
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`font-bold ${threshold.color}`}>
                    Level {threshold.level}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({threshold.points} điểm)
                  </div>
                </div>
                <div className="font-semibold text-primary">
                  Giảm {threshold.discount}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
            <p className="text-sm text-center">
              💡 <span className="font-semibold">Mẹo:</span> Mỗi 10,000 VND = 1 điểm | Mỗi bài viết = 10 điểm
            </p>
          </div>
        </Card>

        {/* Badges */}
        <Card className="p-6 mt-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Huy hiệu của tôi
          </h3>
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="text-4xl mb-2">{userBadge.badges.icon}</div>
                  <p className="font-semibold text-sm text-center">{userBadge.badges.name}</p>
                  <p className="text-xs text-muted-foreground text-center">{userBadge.badges.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có huy hiệu nào</p>
              <p className="text-sm">Hoàn thành các nhiệm vụ để nhận huy hiệu!</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Profile;
