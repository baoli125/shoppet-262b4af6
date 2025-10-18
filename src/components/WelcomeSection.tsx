import { Store, MessageSquare, FileText, Users } from "lucide-react";

interface WelcomeSectionProps {
  onActionClick: (action: string) => void;
}

const quickActions = [
  {
    icon: Store,
    title: "Khám phá Marketplace",
    description: "Mua sắm sản phẩm & dịch vụ cho thú cưng",
    action: "marketplace",
    color: "from-primary to-secondary"
  },
  {
    icon: MessageSquare,
    title: "Hỏi Trợ lý AI",
    description: "Tư vấn sức khỏe & dinh dưỡng 24/7",
    action: "ai-assistant",
    color: "from-secondary to-accent"
  },
  {
    icon: FileText,
    title: "Quản lý Hồ sơ Thú cưng",
    description: "Theo dõi sức khỏe & tiêm chủng",
    action: "pet-profiles",
    color: "from-accent to-primary"
  },
  {
    icon: Users,
    title: "Vào Cộng đồng",
    description: "Kết nối với người yêu thú cưng",
    action: "community",
    color: "from-primary/80 to-secondary/80"
  }
];

const WelcomeSection = ({ onActionClick }: WelcomeSectionProps) => {
  return (
    <section id="get-started" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Welcome Message */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl animate-bounce-subtle">👋</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Xin chào! Tôi là trợ lý ảo Shoppet
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hôm nay bạn muốn gì?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {quickActions.map((action, index) => (
            <div
              key={action.action}
              className="quick-action-card group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onActionClick(action.action)}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "500ms" }}>
          <p className="text-muted-foreground mb-6">
            Đăng nhập để trải nghiệm đầy đủ tính năng của Shoppet
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Miễn phí sử dụng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span>An toàn & Bảo mật</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeSection;
