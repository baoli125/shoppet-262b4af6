import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

const queryClient = new QueryClient();

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCartCount(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCartCount(session.user.id);
      } else {
        setProfile(null);
        setCartCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refetch cart count when location changes
  useEffect(() => {
    if (user) {
      fetchCartCount(user.id);
    }
  }, [location.pathname, user]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    setProfile(data);
    
    if (data?.is_new_user !== undefined) {
      setIsNewUser(data.is_new_user);
    }
  };

  const fetchCartCount = async (userId: string) => {
    const { data } = await supabase
      .from("cart_items")
      .select("quantity", { count: "exact" })
      .eq("user_id", userId);
    
    const total = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    setCartCount(total);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast({
      title: "Chào mừng!",
      description: "Bạn đã đăng nhập thành công vào Shoppet 🐾",
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
