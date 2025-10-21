import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const getLevel = (points: number) => {
    if (points < 100) return 1;
    if (points < 500) return 2;
    if (points < 1000) return 3;
    if (points < 2000) return 4;
    return 5;
  };

  const getNextLevelPoints = (points: number) => {
    const levels = [100, 500, 1000, 2000];
    const currentLevel = getLevel(points);
    if (currentLevel >= 5) return 0;
    return levels[currentLevel - 1] - points;
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

      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <Card className="md:col-span-2 p-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">{profile?.display_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{profile?.display_name}</h2>
                <p className="text-muted-foreground mb-4">{user?.email}</p>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
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
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full mb-4">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-1">Level {getLevel(profile?.points || 0)}</h3>
              <p className="text-sm text-muted-foreground">
                {profile?.points || 0} điểm
              </p>
              {getNextLevelPoints(profile?.points || 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Còn {getNextLevelPoints(profile?.points || 0)} điểm để lên level
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
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
