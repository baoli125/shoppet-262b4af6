import { Heart, Shield, Sparkles, Users } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    {
      icon: Heart,
      title: "Yêu thương & Chăm sóc",
      description: "Chúng tôi hiểu rằng thú cưng là thành viên trong gia đình. Mỗi sản phẩm được chọn lọc kỹ lưỡng với tình yêu thương.",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: Shield,
      title: "An toàn & Chất lượng",
      description: "100% sản phẩm chính hãng, được kiểm định an toàn. Cam kết hoàn tiền nếu không hài lòng.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Sparkles,
      title: "Trợ lý AI thông minh",
      description: "Tư vấn sức khỏe thú cưng 24/7 với công nghệ AI tiên tiến. Luôn bên cạnh khi bạn cần.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Users,
      title: "Cộng đồng yêu thú cưng",
      description: "Kết nối với hàng ngàn người yêu thú cưng. Chia sẻ kinh nghiệm, nhận quà tặng hấp dẫn.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  return (
    <section className="py-12 md:py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Tại sao chọn Shoppet?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Chúng tôi không chỉ bán sản phẩm, mà còn đồng hành cùng bạn chăm sóc thú cưng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-modern text-center group hover:shadow-xl animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
