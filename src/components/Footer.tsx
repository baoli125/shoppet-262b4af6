import { useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const footerLinks = {
    company: [
      { label: "Về chúng tôi", path: "/" },
      { label: "Liên hệ", path: "/" },
      { label: "Tuyển dụng", path: "/" },
      { label: "Blog", path: "/" },
    ],
    support: [
      { label: "Trung tâm hỗ trợ", path: "/" },
      { label: "Điều khoản dịch vụ", path: "/" },
      { label: "Chính sách bảo mật", path: "/" },
      { label: "Chính sách đổi trả", path: "/" },
    ],
    services: [
      { label: "Marketplace", path: "/marketplace" },
      { label: "Trợ lý AI", path: "/ai-chat" },
      { label: "Cộng đồng", path: "/community" },
      { label: "Quản lý thú cưng", path: "/pets" },
    ],
  };

  return (
    <footer className="bg-muted border-t">
      <div className="container mx-auto px-6 py-16 md:py-20">
        {/* Main Footer Content - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 mb-12">
          
          {/* About Column */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">🐾</div>
                <h3 className="text-xl font-bold text-foreground">PurriPaws</h3>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Nền tảng chăm sóc thú cưng toàn diện - Nơi tình yêu thương và công nghệ gặp nhau.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Về chúng tôi</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-muted-foreground hover:text-accent text-xs transition-colors block"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted-foreground/10 hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted-foreground/10 hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-muted-foreground/10 hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-300"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Dịch vụ</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-muted-foreground hover:text-accent text-xs transition-colors block"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Hỗ trợ</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-muted-foreground hover:text-accent text-xs transition-colors block"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Liên hệ</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <a 
                    href="mailto:PurriPawsLazyBeo@gmail.com"
                    className="text-muted-foreground hover:text-accent text-xs transition-colors break-all"
                  >
                    PurriPawsLazyBeo@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href="tel:0900123456"
                    className="text-muted-foreground hover:text-accent text-xs transition-colors"
                  >
                    0900 123 456
                  </a>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground text-xs">
                    Việt Nam
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chúng tôi luôn sẵn sàng hỗ trợ bạn và người bạn bốn chân của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-muted-foreground text-center md:text-left">
              © 2025 PurriPaws. {t('footer.allRightsReserved')}
            </p>
            <div className="flex flex-wrap items-center gap-4 justify-center text-xs">
              <button className="text-muted-foreground hover:text-accent transition-colors">
                Điều khoản sử dụng
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button className="text-muted-foreground hover:text-accent transition-colors">
                Chính sách bảo mật
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button className="text-muted-foreground hover:text-accent transition-colors">
                Cookie
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
