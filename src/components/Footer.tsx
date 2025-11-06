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
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl">🐾</div>
              <h3 className="text-2xl font-bold">Shoppet</h3>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              Nền tảng chăm sóc thú cưng toàn diện - Nơi tình yêu thương và công nghệ gặp nhau.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Công ty</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-2 mb-6">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Mail className="w-4 h-4" />
                <span className="break-all">ShoppetLazyBeo@gmail.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <Phone className="w-4 h-4" />
                <span>0900 123 456</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                <MapPin className="w-4 h-4" />
                <span>Việt Nam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/80 text-center md:text-left">
              © 2025 Shoppet. {t('footer.allRightsReserved')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Điều khoản sử dụng
              </button>
              <span className="text-primary-foreground/40">|</span>
              <button className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Chính sách bảo mật
              </button>
              <span className="text-primary-foreground/40">|</span>
              <button className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
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
