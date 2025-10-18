import { useState } from "react";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import WelcomeSection from "@/components/WelcomeSection";
import LoginModal from "@/components/LoginModal";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    // TODO: Implement actual login logic
    setShowLoginModal(false);
    toast({
      title: "Chức năng đang phát triển",
      description: "Tính năng đăng nhập sẽ sớm được hoàn thiện!",
    });
  };

  const handleRegister = () => {
    // TODO: Implement actual register logic
    toast({
      title: "Chức năng đang phát triển",
      description: "Tính năng đăng ký sẽ sớm được hoàn thiện!",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  const handleQuickAction = (action: string) => {
    if (!isLoggedIn) {
      const messages: Record<string, string> = {
        marketplace: "Đăng nhập để khám phá Marketplace và mua sắm sản phẩm cho thú cưng của bạn",
        "ai-assistant": "Đăng nhập để trò chuyện với trợ lý AI và nhận tư vấn sức khỏe 24/7",
        "pet-profiles": "Đăng nhập để quản lý hồ sơ và theo dõi sức khỏe thú cưng của bạn",
        community: "Đăng nhập để tham gia cộng đồng và kết nối với những người yêu thú cưng"
      };
      
      setLoginMessage(messages[action] || "Vui lòng đăng nhập để sử dụng tính năng này");
      setShowLoginModal(true);
    } else {
      // TODO: Navigate to respective sections when logged in
      toast({
        title: "Đang chuyển hướng...",
        description: `Chuyển đến ${action}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={isLoggedIn}
        userName="Lazy Beo"
        cartCount={3}
        onLoginClick={() => setShowLoginModal(true)}
        onRegisterClick={handleRegister}
        onLogoutClick={handleLogout}
      />

      <main>
        <HeroCarousel />
        
        {!isLoggedIn && (
          <WelcomeSection onActionClick={handleQuickAction} />
        )}

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

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginClick={handleLogin}
        message={loginMessage}
      />
    </div>
  );
};

export default Index;
