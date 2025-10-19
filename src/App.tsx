import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import AIChat from "./pages/AIChat";
import Pets from "./pages/Pets";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import SellerDashboard from "./pages/SellerDashboard";
import NotFound from "./pages/NotFound";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import FloatingChatbot from "@/components/FloatingChatbot";
import GuidedTour from "@/components/GuidedTour";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth changes FIRST (best practice)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Defer Supabase calls to avoid deadlock
        setTimeout(() => {
          fetchProfile(currentSession.user.id);
          fetchCartCount(currentSession.user.id);
        }, 0);
      } else {
        // Clear all state when logged out
        setProfile(null);
        setCartCount(0);
        setIsNewUser(false);
        setShowGuidedTour(false);
        setShowAuthModal(false);
      }
      
      // Handle SIGNED_OUT event - redirect to home
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
        fetchCartCount(currentSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Refetch cart count when location changes or cart updated
  useEffect(() => {
    if (user) {
      fetchCartCount(user.id);
    }

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (user) {
        fetchCartCount(user.id);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [location.pathname, user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      setProfile(data);
      
      if (data?.is_new_user !== undefined) {
        setIsNewUser(data.is_new_user);
        // Show guided tour for new users who have completed onboarding
        if (data.is_new_user && data.has_completed_onboarding) {
          // Small delay to ensure UI is ready
          setTimeout(() => {
            setShowGuidedTour(true);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    }
  };

  const fetchCartCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity", { count: "exact" })
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error fetching cart count:", error);
        return;
      }
      
      const total = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      setCartCount(total);
    } catch (err) {
      console.error("Unexpected error fetching cart count:", err);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all state immediately to prevent conflicts
      setUser(null);
      setSession(null);
      setProfile(null);
      setCartCount(0);
      setIsNewUser(false);
      setShowGuidedTour(false);
      setShowAuthModal(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        toast({
          title: "Lỗi đăng xuất",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Redirect to home page to avoid conflicts
      navigate('/');
      
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
    } catch (err) {
      console.error("Unexpected logout error:", err);
      toast({
        title: "Lỗi không mong đợi",
        description: "Vui lòng thử lại",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast({
      title: "Chào mừng!",
      description: "Bạn đã đăng nhập thành công vào Shoppet 🐾",
    });
  };

  const handleGuidedTourComplete = async () => {
    setShowGuidedTour(false);
    
    // Update user profile to mark as not new anymore
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_new_user: false })
        .eq("id", user.id);
      
      setIsNewUser(false);
    }

    toast({
      title: "Hoàn thành hướng dẫn! 🎉",
      description: "Bạn đã sẵn sàng khám phá Shoppet!",
    });
  };

  return (
    <>
      <Header
        isLoggedIn={!!user}
        userName={profile?.display_name || user?.email || "User"}
        userAvatar={profile?.avatar_url}
        cartCount={cartCount}
        onLoginClick={() => setShowAuthModal(true)}
        onRegisterClick={() => setShowAuthModal(true)}
        onLogoutClick={handleLogout}
      />
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/pets" element={<Pets />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <FloatingChatbot user={user} isNewUser={isNewUser} />

      <GuidedTour 
        isActive={showGuidedTour} 
        onComplete={handleGuidedTourComplete}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
