import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";

const passwordSchema = z.string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số");

const emailSchema = z.string().email("Email không hợp lệ").max(255, "Email quá dài");

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn quay lại PurriPaws 🐾",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!username.trim() || username.trim().length < 3) {
        throw new Error("Tên đăng nhập phải có ít nhất 3 ký tự");
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        throw new Error("Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới");
      }

      // Validate password
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        throw new Error(passwordValidation.error.errors[0].message);
      }

      // Tạo email ảo từ username để dùng với Supabase Auth
      const generatedEmail = `${username.trim().toLowerCase()}@shoppet.local`;

      const { error } = await supabase.auth.signUp({
        email: generatedEmail,
        password,
        options: {
          data: {
            display_name: displayName || username.trim(),
            username: username.trim().toLowerCase(),
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("Tên đăng nhập đã tồn tại, vui lòng chọn tên khác");
        }
        throw error;
      }

      toast({
        title: "Đăng ký thành công!",
        description: "Chào mừng bạn đến với PurriPaws 🎉",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Vui lòng kiểm tra lại thông tin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.redirected) {
        return;
      }

      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn quay lại PurriPaws 🐾",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Không thể kết nối với Google",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setShowPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Chào mừng đến PurriPaws 🐾
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="login" className="text-sm sm:text-base">Đăng nhập</TabsTrigger>
            <TabsTrigger value="signup" className="text-sm sm:text-base">Đăng ký</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-solid-blue h-11 text-base touch-manipulation" disabled={isLoading}>
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  hoặc
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base touch-manipulation"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng nhập với Google
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-sm">Tên hiển thị</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 text-base pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
                </p>
              </div>

              <Button type="submit" className="w-full btn-hero h-11 text-base touch-manipulation" disabled={isLoading}>
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  hoặc
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base touch-manipulation"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng ký với Google
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
