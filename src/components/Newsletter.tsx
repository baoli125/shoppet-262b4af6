import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Vui lòng nhập email",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement newsletter subscription logic
    toast({
      title: "Đăng ký thành công! 🎉",
      description: "Cảm ơn bạn đã đăng ký nhận tin từ Shoppet.",
    });
    setEmail("");
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Nhận tin tức & ưu đãi đặc biệt
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Đăng ký ngay để không bỏ lỡ các chương trình khuyến mãi, mẹo chăm sóc thú cưng và sản phẩm mới
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto animate-fade-in-up">
            <Input
              type="email"
              placeholder="Nhập email của bạn..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-6 text-base flex-1"
            />
            <Button type="submit" size="lg" className="btn-hero h-12 px-8 whitespace-nowrap">
              Đăng ký ngay
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
