import { useState } from "react";
import { Menu, X, ShoppingCart, User, LogOut, Settings, Package, FileText, MessageSquare, Store, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import shoppetLogoSmall from "@/assets/logo-small.png";
import shoppetLogoMedium from "@/assets/logo-medium.png";
import shoppetLogo from "@/assets/logo.png";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
  cartCount?: number;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onLogoutClick?: () => void;
}

const Header = ({ 
  isLoggedIn = false, 
  userName = "User",
  userAvatar,
  cartCount = 0,
  onLoginClick,
  onRegisterClick,
  onLogoutClick
}: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const menuItems = [
    { label: t('header.home'), href: "#home", active: true },
    { label: t('header.about'), href: "#about", active: false },
  ];

  const userMenuItems = [
    { icon: Store, label: t('header.marketplace'), href: "/marketplace" },
    { icon: MessageSquare, label: t('header.aiChat'), href: "/ai-chat" },
    { icon: FileText, label: t('header.pets'), href: "/pets" },
    { icon: Users, label: t('header.community'), href: "/community" },
    { icon: ShoppingCart, label: t('header.cart'), href: "/cart" },
    { icon: Package, label: t('header.orders'), href: "/orders" },
    { icon: User, label: t('header.account'), href: "/profile" },
    { icon: Settings, label: t('header.sellerDashboard'), href: "/seller-dashboard" },
  ];

  const handleMenuItemClick = (href: string) => {
    if (href.startsWith('#')) {
      // If not on home page, navigate to home first
      if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation to complete, then scroll
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (href.startsWith('/')) {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-header-bg border-b border-header-border header-shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand */}
          <a 
            href="#home" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              handleMenuItemClick('#home');
            }}
          >
            <img 
              src={shoppetLogoSmall} 
              srcSet={`${shoppetLogoSmall} 1x, ${shoppetLogoMedium} 2x, ${shoppetLogo} 3x`}
              alt="Shoppet Logo" 
              width="128"
              height="86"
              className="h-12 md:h-16 w-auto object-contain" 
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuItemClick(item.href);
                }}
                className={`text-base font-medium transition-colors relative ${
                  item.active 
                    ? "text-primary after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-primary" 
                    : "text-header-text hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-full transition-colors"
                  title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                >
                  <Globe className="w-5 h-5 text-header-text" />
                  <span className="text-sm font-medium text-header-text">{language.toUpperCase()}</span>
                </button>
                
                <Button 
                  onClick={onLoginClick}
                  className="btn-solid-blue"
                >
                  {t('header.login')}
                </Button>
                <Button 
                  onClick={onRegisterClick}
                  className="btn-outline-blue"
                >
                  {t('header.register')}
                </Button>
              </>
            ) : (
              <>
                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-full transition-colors"
                  title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                >
                  <Globe className="w-5 h-5 text-header-text" />
                  <span className="text-sm font-medium text-header-text">{language.toUpperCase()}</span>
                </button>

                {/* Cart Icon */}
                <button 
                  onClick={() => handleMenuItemClick('/cart')}
                  className="relative p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-header-text" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground px-1.5 py-0.5 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      data-tour="user-dropdown"
                      className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-full transition-colors"
                    >
                      <Avatar className="w-8 h-8 border-2 border-primary">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-header-text">{userName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover">
                    {userMenuItems.map((item) => {
                      // Add data-tour attributes for guided tour
                      const tourMap: Record<string, string> = {
                        '/marketplace': 'marketplace-menu',
                        '/ai-chat': 'ai-chat-menu',
                        '/pets': 'pets-menu',
                        '/community': 'community-menu',
                        '/cart': 'cart-menu',
                      };
                      
                      return (
                        <DropdownMenuItem 
                          key={item.label}
                          data-tour={tourMap[item.href]}
                          onClick={() => handleMenuItemClick(item.href)}
                          className="cursor-pointer"
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onLogoutClick}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('header.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-header-text" />
            ) : (
              <Menu className="w-6 h-6 text-header-text" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-header-border animate-fade-in">
            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-2 mb-4">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuItemClick(item.href);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-header-text hover:bg-muted"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Mobile Auth Section */}
            {!isLoggedIn ? (
              <div className="flex flex-col gap-2 pt-4 border-t border-header-border">
                {/* Mobile Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {t('header.language')}
                  </span>
                  <span className="text-sm font-medium">{language.toUpperCase()}</span>
                </button>
                
                <Button onClick={onLoginClick} className="btn-solid-blue w-full">
                  {t('header.login')}
                </Button>
                <Button onClick={onRegisterClick} className="btn-outline-blue w-full">
                  {t('header.register')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4 border-t border-header-border">
                {/* Mobile Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    {t('header.language')}
                  </span>
                  <span className="text-sm font-medium">{language.toUpperCase()}</span>
                </button>
                
                {/* Mobile Cart */}
                <button 
                  onClick={() => handleMenuItemClick('/cart')}
                  className="flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    {t('header.cart')}
                  </span>
                  {cartCount > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      {cartCount}
                    </Badge>
                  )}
                </button>

                {/* Mobile User Menu */}
                {userMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleMenuItemClick(item.href)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={onLogoutClick}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  {t('header.logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
