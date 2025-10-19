import { useState, useEffect } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import OnboardingModal from "@/components/OnboardingModal";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user.id);
      } else {
        // Reset onboarding modal when logged out
        setShowOnboarding(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user.id);
      } else {
        // Reset onboarding modal when logged out
        setShowOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", userId)
      .single();
    
    if (data && !data.has_completed_onboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async (isNewUser: boolean) => {
    setShowOnboarding(false);
    
    if (user) {
      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_new_user: isNewUser,
          has_completed_onboarding: true 
        })
        .eq("id", user.id);
      
      if (!error && isNewUser) {
        // Dispatch event to trigger guided tour in App.tsx
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('startGuidedTour'));
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <main>
        <HeroCarousel />

        {/* About Section */}
        <section id="about" className="py-20 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Về Shoppet
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Shoppet là nền tảng toàn diện dành cho người yêu thú cưng tại Việt Nam. 
                Chúng tôi kết hợp công nghệ AI tiên tiến với kiến thức chuyên môn về chăm sóc thú cưng 
                để mang đến trải nghiệm tốt nhất cho bạn và người bạn bốn chân của bạn.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="p-6 bg-background rounded-2xl">
                  <div className="text-4xl mb-4">🛍️</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Marketplace</h3>
                  <p className="text-muted-foreground">
                    Mua sắm sản phẩm & đặt dịch vụ chất lượng cao
                  </p>
                </div>
                <div className="p-6 bg-background rounded-2xl">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">AI Assistant</h3>
                  <p className="text-muted-foreground">
                    Tư vấn thông minh 24/7 về sức khỏe & dinh dưỡng
                  </p>
                </div>
                <div className="p-6 bg-background rounded-2xl">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Community</h3>
                  <p className="text-muted-foreground">
                    Cộng đồng sôi động với hàng nghìn thành viên
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">Về Shoppet</h4>
                <p className="text-muted-foreground text-sm">
                  Nền tảng chăm sóc thú cưng toàn diện, kết hợp công nghệ AI và cộng đồng người yêu thú cưng.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">Liên hệ</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>📧 ShoppetLazyBeo@gmail.com</li>
                  <li>📞 0900 123 456</li>
                  <li>📍 Việt Nam</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-foreground">Theo dõi</h4>
                <div className="flex gap-4">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Facebook
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Instagram
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    TikTok
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                © 2025 Shoppet. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {showOnboarding && (
        <OnboardingModal 
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
};

export default Index;
