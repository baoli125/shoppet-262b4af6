import { useState } from "react";
import { Menu, X, ShoppingCart, User, LogOut, Settings, Package, FileText, MessageSquare, Store, Users } from "lucide-react";
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
import shoppetLogo from "@/assets/shoppet-logo.png";

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

  const menuItems = [
    { label: "Trang Chủ", href: "#home", active: true },
    { label: "Giới Thiệu", href: "#about", active: false },
  ];

  const userMenuItems = [
    { icon: Store, label: "Marketplace", href: "/marketplace" },
    { icon: MessageSquare, label: "Trợ lý AI", href: "/ai-chat" },
    { icon: FileText, label: "Hồ sơ Thú cưng", href: "/pets" },
    { icon: Users, label: "Cộng đồng", href: "/community" },
    { icon: ShoppingCart, label: "Giỏ hàng", href: "/cart" },
    { icon: Package, label: "Đơn hàng", href: "/orders" },
    { icon: User, label: "Tài khoản", href: "/profile" },
    { icon: Settings, label: "Seller Dashboard", href: "/seller-dashboard" },
  ];

  const handleMenuItemClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href.startsWith('/')) {
      window.location.href = href;
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
            <img src={shoppetLogo} alt="Shoppet Logo" className="w-10 h-10 md:w-12 md:h-12" />
            <span className="text-2xl md:text-3xl font-bold text-primary">Shoppet</span>
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
                <Button 
                  onClick={onLoginClick}
                  className="btn-solid-blue"
                >
                  Đăng nhập
                </Button>
                <Button 
                  onClick={onRegisterClick}
                  className="btn-outline-blue"
                >
                  Đăng ký
                </Button>
              </>
            ) : (
              <>
                {/* Cart Icon */}
                <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
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
                    <button className="flex items-center gap-2 hover:bg-muted px-3 py-2 rounded-full transition-colors">
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
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem 
                        key={item.label}
                        onClick={() => handleMenuItemClick(item.href)}
                        className="cursor-pointer"
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onLogoutClick}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
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
                <Button onClick={onLoginClick} className="btn-solid-blue w-full">
                  Đăng nhập
                </Button>
                <Button onClick={onRegisterClick} className="btn-outline-blue w-full">
                  Đăng ký
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4 border-t border-header-border">
                {/* Mobile Cart */}
                <button className="flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Giỏ hàng
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
                  Đăng xuất
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
