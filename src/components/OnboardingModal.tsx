import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (isNewUser: boolean) => void;
}

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChoice = async (isNewUser: boolean) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", user.id);

      if (error) throw error;

      onComplete(isNewUser);
      
      toast({
        title: "Chào mừng! 🎉",
        description: isNewUser 
          ? "Tay Nhỏ sẽ hướng dẫn bạn khám phá Shoppet!"
          : "Chúc bạn có trải nghiệm tuyệt vời!",
      });
    } catch (error) {
      console.error("Error updating onboarding status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Chào mừng đến với Shoppet! 🐾
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            Hãy cho chúng tôi biết về bạn để có trải nghiệm tốt nhất
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <Button
            onClick={() => handleChoice(true)}
            disabled={isLoading}
            className="w-full h-auto py-6 flex flex-col gap-2 bg-gradient-to-br from-primary to-primary/80 hover:scale-105 transition-transform"
          >
            <span className="text-3xl">🌟</span>
            <span className="font-semibold text-lg">Tôi là người mới</span>
            <span className="text-xs opacity-90 font-normal">
              Hướng dẫn tôi khám phá Shoppet
            </span>
          </Button>

          <Button
            onClick={() => handleChoice(false)}
            disabled={isLoading}
            variant="outline"
            className="w-full h-auto py-6 flex flex-col gap-2 hover:scale-105 transition-transform"
          >
            <span className="text-3xl">🚀</span>
            <span className="font-semibold text-lg">Tôi đã quen rồi</span>
            <span className="text-xs opacity-70 font-normal">
              Tôi muốn tự khám phá
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
