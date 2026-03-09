import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import AIChat from "./pages/AIChat";
import Pets from "./pages/Pets";
import PetsDetail from "./pages/PetsDetail";
import PetShare from "./pages/PetShare";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SellerDetailAdmin from "./pages/SellerDetailAdmin";
import NotFound from "./pages/NotFound";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import FloatingChatbot from "@/components/FloatingChatbot";
import { GuidedTourProvider, useGuidedTour } from "@/contexts/GuidedTourContext";
import { GuidedTourOverlay } from "@/components/GuidedTourOverlay";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DeletionNoticePopup from "@/components/DeletionNoticePopup";
import DeletedAccountPopup from "@/components/DeletedAccountPopup";
import type { User, Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deletedAccountInfo, setDeletedAccountInfo] = useState<{ reason: string; userId: string } | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { startTour } = useGuidedTour();

  useEffect(() => {
    // Listen for auth changes FIRST (best practice)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        // Defer Supabase calls to avoid deadlock
        setTimeout(async () => {
          fetchProfile(currentSession.user.id);
          fetchCartCount(currentSession.user.id);
          // Check if admin/manager and redirect
          if (event === 'SIGNED_IN') {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', currentSession.user.id)
              .in('role', ['admin', 'manager']);
            if (roles && roles.length > 0) {
              navigate('/admin');
            }
          }
        }, 0);
      } else {
        // Clear all state when logged out
        setProfile(null);
        setCartCount(0);
        setIsNewUser(false);
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

    // Listen for guided tour trigger from onboarding
    const handleStartGuidedTour = () => {
      console.log("Guided tour triggered by onboarding");
      startTour();
    };
    
    window.addEventListener('startGuidedTour', handleStartGuidedTour);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('startGuidedTour', handleStartGuidedTour);
    };
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
      
      // Kiểm tra tài khoản đã bị xóa mềm
      if (data?.is_deleted) {
        setDeletedAccountInfo({ reason: data.delete_reason || "", userId: data.id });
      }
      
      if (data?.is_new_user !== undefined) {
        setIsNewUser(data.is_new_user);
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
        <Route path="/pets/:id" element={<PetsDetail />} />
        <Route path="/pets/:id/share" element={<PetShare />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <FloatingChatbot 
        user={user} 
        isNewUser={isNewUser}
        onLoginRequired={() => setShowAuthModal(true)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <GuidedTourOverlay />

      {/* Popup thông báo tài khoản bị xóa */}
      {deletedAccountInfo && (
        <DeletedAccountPopup
          open={!!deletedAccountInfo}
          reason={deletedAccountInfo.reason}
          userId={deletedAccountInfo.userId}
          onClose={() => { setDeletedAccountInfo(null); navigate("/"); }}
          onRestored={() => { setDeletedAccountInfo(null); if (user) fetchProfile(user.id); }}
        />
      )}

      {/* Popup thông báo nội dung bị xóa */}
      {user && !deletedAccountInfo && <DeletionNoticePopup userId={user.id} />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <GuidedTourProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </GuidedTourProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
