import { useState, useEffect } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import OnboardingModal from "@/components/OnboardingModal";
import FeaturedProducts from "@/components/FeaturedProducts";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
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
      <main className="pt-14 sm:pt-16 md:pt-20">
        {/* Hero Section with Carousel */}
        <HeroCarousel />

        {/* Featured Products Section */}
        <FeaturedProducts />

        {/* Why Choose Us Section */}
        <WhyChooseUs />

        {/* About Section - Quick Actions */}
        <section id="about" className="py-12 md:py-16 bg-gradient-to-b from-card to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground animate-fade-in">
                {t('about.title')}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-in-up">
                {t('about.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="quick-action-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="text-4xl md:text-5xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('about.marketplace.title')}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t('about.marketplace.description')}
                </p>
              </div>
              <div className="quick-action-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-4xl md:text-5xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('about.aiAssistant.title')}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t('about.aiAssistant.description')}
                </p>
              </div>
              <div className="quick-action-card animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-4xl md:text-5xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('about.community.title')}</h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {t('about.community.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <Testimonials />

        {/* Newsletter Section */}
        <Newsletter />

        {/* Modern Footer */}
        <Footer />
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
