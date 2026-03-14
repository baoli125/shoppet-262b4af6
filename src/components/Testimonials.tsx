import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Testimonials = () => {
  const { elementRef, isVisible } = useScrollAnimation();
  
  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      role: "Chủ nhân của Milo",
      content: "PurriPaws đã giúp tôi chăm sóc Milo tốt hơn rất nhiều. Trợ lý AI rất thông minh, luôn tư vấn kịp thời khi tôi gặp vấn đề.",
      rating: 5,
      petType: "🐕",
    },
    {
      name: "Trần Hoàng Nam",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
      role: "Chủ nhân của Luna & Leo",
      content: "Sản phẩm chất lượng, giao hàng nhanh. Cộng đồng PurriPaws rất thân thiện, tôi đã học được nhiều kinh nghiệm nuôi mèo.",
      rating: 5,
      petType: "🐱",
    },
    {
      name: "Lê Thu Hà",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
      role: "Chủ nhân của Buddy",
      content: "Tôi thích tính năng quản lý hồ sơ thú cưng. Giờ đây tôi có thể theo dõi tiêm phòng, cân nặng của Buddy một cách dễ dàng.",
      rating: 5,
      petType: "🐕",
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Hàng ngàn người yêu thú cưng đã tin tưởng PurriPaws
          </p>
        </div>

        <div 
          ref={elementRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-4 md:p-6 bg-card hover:shadow-lg transition-all duration-300"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <Avatar className="w-10 h-10 md:w-12 md:h-12 mr-3">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm md:text-base text-foreground truncate">{testimonial.name}</h4>
                    <span className="text-lg md:text-xl flex-shrink-0">{testimonial.petType}</span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-secondary text-secondary" />
                ))}
              </div>

              <p className="text-xs md:text-base text-muted-foreground leading-relaxed line-clamp-4 md:line-clamp-none">
                "{testimonial.content}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
