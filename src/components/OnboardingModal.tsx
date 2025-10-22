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
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingModalProps {
  open: boolean;
  onComplete: (isNewUser: boolean) => void;
}

const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleChoice = async (isNewUser: boolean) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No user found");
      }

      console.log(`User chose: ${isNewUser ? 'New User' : 'Experienced User'}`);

      const { error } = await supabase
        .from("profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }

      console.log("Onboarding status updated successfully");
      onComplete(isNewUser);
      
      if (isNewUser) {
        toast({
          title: t('onboarding.welcome') + " 🎉",
          description: "Tay Nhỏ sẽ hướng dẫn bạn khám phá Shoppet ngay bây giờ!",
          duration: 3000,
        });
      } else {
        toast({
          title: "Chúc bạn có trải nghiệm tuyệt vời! 🚀",
          description: "Hãy khám phá Shoppet theo cách của bạn!",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error in handleChoice:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="w-[95vw] max-w-md mx-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl sm:text-2xl px-2">
            {t('onboarding.welcome')} 🐾
          </DialogTitle>
          <DialogDescription className="text-center pt-3 sm:pt-4 px-2 text-sm sm:text-base">
            {t('onboarding.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-4 sm:py-6 px-2">
          <Button
            onClick={() => handleChoice(true)}
            disabled={isLoading}
            className="w-full h-auto py-5 sm:py-6 flex flex-col gap-1.5 sm:gap-2 bg-gradient-to-br from-primary to-primary/80 hover:scale-105 transition-transform touch-manipulation min-h-[80px] sm:min-h-[100px]"
          >
            <span className="text-2xl sm:text-3xl">🌟</span>
            <span className="font-semibold text-base sm:text-lg">{t('onboarding.petOwner')}</span>
            <span className="text-xs opacity-90 font-normal px-2">
              {t('onboarding.petOwnerDesc')}
            </span>
          </Button>

          <Button
            onClick={() => handleChoice(false)}
            disabled={isLoading}
            variant="outline"
            className="w-full h-auto py-5 sm:py-6 flex flex-col gap-1.5 sm:gap-2 hover:scale-105 transition-transform touch-manipulation min-h-[80px] sm:min-h-[100px]"
          >
            <span className="text-2xl sm:text-3xl">🚀</span>
            <span className="font-semibold text-base sm:text-lg">{t('onboarding.seller')}</span>
            <span className="text-xs opacity-70 font-normal px-2">
              {t('onboarding.sellerDesc')}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
