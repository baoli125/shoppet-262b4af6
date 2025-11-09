import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const { elementRef, isVisible } = useScrollAnimation();

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
        <div 
          ref={elementRef}
          className={`max-w-3xl mx-auto text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 mb-4 md:mb-6">
            <Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-foreground">
            Nhận tin tức & ưu đãi đặc biệt
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Đăng ký ngay để không bỏ lỡ các chương trình khuyến mãi, mẹo chăm sóc thú cưng và sản phẩm mới
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto px-4">
            <Input
              type="email"
              placeholder="Nhập email của bạn..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-base flex-1"
            />
            <Button type="submit" size="lg" className="btn-hero h-10 md:h-12 px-6 md:px-8 whitespace-nowrap text-sm md:text-base">
              Đăng ký ngay
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-3 md:mt-4 px-4">
            Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
