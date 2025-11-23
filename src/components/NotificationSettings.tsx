import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save } from "lucide-react";

export const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    food_reminder_enabled: true,
    food_reminder_days_before: 5,
    vaccine_reminder_enabled: true,
    vaccine_reminder_days_before: 7,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setPreferences({
        food_reminder_enabled: data.food_reminder_enabled,
        food_reminder_days_before: data.food_reminder_days_before,
        vaccine_reminder_enabled: data.vaccine_reminder_enabled,
        vaccine_reminder_days_before: data.vaccine_reminder_days_before,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_notification_preferences")
      .upsert({
        user_id: user.id,
        ...preferences,
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt thông báo",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đã lưu! ✨",
        description: "Cài đặt thông báo đã được cập nhật",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="animate-pulse">Đang tải...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Cài đặt thông báo
        </CardTitle>
        <CardDescription>
          Tùy chỉnh các nhắc nhở về thức ăn và lịch tiêm chủng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Food reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="food-enabled" className="text-base">
                Nhắc nhở thức ăn sắp hết
              </Label>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo khi thức ăn sắp hết
              </p>
            </div>
            <Switch
              id="food-enabled"
              checked={preferences.food_reminder_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, food_reminder_enabled: checked })
              }
            />
          </div>
          {preferences.food_reminder_enabled && (
            <div className="ml-4 space-y-2">
              <Label htmlFor="food-days">Nhắc trước (ngày)</Label>
              <Input
                id="food-days"
                type="number"
                min="1"
                max="30"
                value={preferences.food_reminder_days_before}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    food_reminder_days_before: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nhắc nhở {preferences.food_reminder_days_before} ngày trước khi hết thức ăn
              </p>
            </div>
          )}
        </div>

        {/* Vaccine reminders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="vaccine-enabled" className="text-base">
                Nhắc lịch tiêm chủng
              </Label>
              <p className="text-sm text-muted-foreground">
                Nhận thông báo về lịch tiêm chủng sắp tới
              </p>
            </div>
            <Switch
              id="vaccine-enabled"
              checked={preferences.vaccine_reminder_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, vaccine_reminder_enabled: checked })
              }
            />
          </div>
          {preferences.vaccine_reminder_enabled && (
            <div className="ml-4 space-y-2">
              <Label htmlFor="vaccine-days">Nhắc trước (ngày)</Label>
              <Input
                id="vaccine-days"
                type="number"
                min="1"
                max="30"
                value={preferences.vaccine_reminder_days_before}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    vaccine_reminder_days_before: parseInt(e.target.value) || 7,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nhắc nhở {preferences.vaccine_reminder_days_before} ngày trước khi đến lịch tiêm
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </CardContent>
    </Card>
  );
};
