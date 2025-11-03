import { useState, useEffect } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t } = useLanguage();

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

        {/* About Section - Mobile Optimized */}
        <section id="about" className="py-8 sm:py-12 md:py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 text-foreground animate-fade-in">
                {t('about.title')}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-2 animate-fade-in-up">
                {t('about.subtitle')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-10">
                <div className="card-modern animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <div className="text-3xl sm:text-4xl mb-3">🛍️</div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-foreground">{t('about.marketplace.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {t('about.marketplace.description')}
                  </p>
                </div>
                <div className="card-modern animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="text-3xl sm:text-4xl mb-3">🤖</div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-foreground">{t('about.aiAssistant.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {t('about.aiAssistant.description')}
                  </p>
                </div>
                <div className="card-modern animate-fade-in-up sm:col-span-2 md:col-span-1" style={{ animationDelay: '0.3s' }}>
                  <div className="text-3xl sm:text-4xl mb-3">👥</div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2 text-foreground">{t('about.community.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {t('about.community.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Mobile Optimized */}
        <footer className="bg-card border-t border-border py-6 sm:py-8 md:py-10 lg:py-12">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8 text-center sm:text-left">
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">{t('about.title')}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('footer.description')}
                </p>
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
                  {t('header.language') === 'Ngôn ngữ' ? 'Liên hệ' : 'Contact'}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="break-all">📧 ShoppetLazyBeo@gmail.com</li>
                  <li>📞 0900 123 456</li>
                  <li>📍 Việt Nam</li>
                </ul>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">{t('footer.followUs')}</h4>
                <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start flex-wrap">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation py-2">
                    Facebook
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation py-2">
                    Instagram
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm touch-manipulation py-2">
                    TikTok
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center pt-6 sm:pt-8 border-t border-border">
              <p className="text-xs sm:text-sm text-muted-foreground">
                © 2025 Shoppet. {t('footer.allRightsReserved')}
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
