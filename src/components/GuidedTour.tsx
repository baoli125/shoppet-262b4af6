import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
}

const GuidedTour = ({ isActive, onComplete }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const clickListenerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const steps = [
    {
      id: 'chatbot',
      selector: '[data-tour="chatbot"]',
      title: "Trợ lý AI Thông Minh 🤖",
      description: "Đây là trợ lý AI 24/7 của Shoppet! Bạn có thể hỏi bất kỳ câu hỏi nào về sức khỏe, dinh dưỡng, hoặc chăm sóc thú cưng.",
      position: 'bottom-right' as const,
      forceClick: true,
    },
    {
      id: 'marketplace-menu',
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace - Mua sắm Thông minh 🛍️",
      description: "Tại đây bạn có thể mua tất cả sản phẩm cho thú cưng: thức ăn, đồ chơi, phụ kiện với giá tốt nhất.",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'user-dropdown',
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Quản lý Tài khoản 👤",
      description: "Đây là trung tâm điều khiển! Bạn có thể quản lý hồ sơ, đơn hàng, cài đặt và nhiều tính năng khác. Hãy click để xem!",
      position: 'bottom' as const,
      forceClick: true,
    },
    {
      id: 'ai-chat-menu',
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI Tư vấn 🤖",
      description: "Nhận tư vấn sức khỏe, dinh dưỡng cá nhân hóa cho từng loại thú cưng của bạn.",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'pets-menu',
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 📋",
      description: "Quản lý thông tin sức khỏe, lịch tiêm phòng, bệnh án của tất cả thú cưng trong một nơi.",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'add-pet-prompt',
      selector: null,
      title: "Thêm Thú Cưng Đầu Tiên! 🎉",
      description: "Hãy thêm thông tin về thú cưng của bạn để nhận được các tư vấn và chăm sóc phù hợp nhất! Click vào mục 'Hồ sơ Thú cưng' bên trên để bắt đầu.",
      position: 'center' as const,
      forceClick: false,
    },
    {
      id: 'community-menu',
      selector: '[data-tour="community-menu"]',
      title: "Cộng đồng Yêu thú cưng 👥",
      description: "Kết nối, chia sẻ kinh nghiệm với hàng ngàn người yêu thú cưng khác.",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'cart-orders-menu',
      selector: '[data-tour="cart-menu"]',
      title: "Giỏ hàng & Theo dõi Đơn hàng 🛒",
      description: "Theo dõi giỏ hàng và đơn hàng của bạn tại đây. Bạn cũng có thể xem nhanh bằng icon giỏ hàng trên header!",
      position: 'left' as const,
      forceClick: false,
      showCartIcon: true,
    },
  ];

  useEffect(() => {
    if (!isActive) return;

    const updateHighlight = () => {
      const step = steps[currentStep];
      if (!step.selector) {
        setTargetElement(null);
        return;
      }

      const element = document.querySelector(step.selector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateHighlight();

    // Update on window resize or scroll
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    if (!step.forceClick || !targetElement) return;

    // Remove previous listener if exists
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current, true);
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Check if click is on the target element or its children
      if (targetElement.contains(target)) {
        e.stopPropagation();
        e.preventDefault();
        
        // Visual feedback
        targetElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
          if (targetElement) {
            targetElement.style.transform = '';
          }
          nextStep();
        }, 150);
      }
    };

    clickListenerRef.current = handleClick;
    document.addEventListener('click', handleClick, true);

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener('click', clickListenerRef.current, true);
      }
    };
  }, [targetElement, currentStep, isActive]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const skipTour = () => {
    if (confirm("Bạn có chắc muốn bỏ qua hướng dẫn?")) {
      handleComplete();
    }
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];
  const tooltipPosition = getTooltipPosition(currentStepData.position, highlightPosition);

  return (
    <>
      {/* Overlay with blur */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-all duration-300" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Highlight */}
      {targetElement && (
        <>
          {/* Animated pulsing rings */}
          <div
            className="fixed z-[101] pointer-events-none transition-all duration-500"
            style={{
              top: `${highlightPosition.top - 12}px`,
              left: `${highlightPosition.left - 12}px`,
              width: `${highlightPosition.width + 24}px`,
              height: `${highlightPosition.height + 24}px`,
            }}
          >
            {/* Outer pulsing ring */}
            <div 
              className="absolute inset-0 rounded-xl border-4 border-primary"
              style={{
                animation: 'blink-highlight 1.5s infinite ease-in-out',
                boxShadow: '0 0 40px hsl(var(--primary) / 0.6), inset 0 0 20px hsl(var(--primary) / 0.3)'
              }}
            />
            
            {/* Inner glow */}
            <div 
              className="absolute inset-2 rounded-lg bg-primary/10"
              style={{
                animation: 'pulse 2s infinite ease-in-out'
              }}
            />
            
            {/* Corner sparkles */}
            <Sparkles 
              className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" 
              style={{ animationDelay: '0s' }}
            />
            <Sparkles 
              className="absolute -bottom-2 -left-2 w-5 h-5 text-secondary animate-pulse" 
              style={{ animationDelay: '0.5s' }}
            />
          </div>

          {/* Clickable transparent area to capture clicks */}
          <div
            className="fixed z-[102] cursor-pointer"
            style={{
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left}px`,
              width: `${highlightPosition.width}px`,
              height: `${highlightPosition.height}px`,
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-[103] p-6 shadow-2xl max-w-md border-2 border-primary/20"
        style={{
          ...tooltipPosition,
          animation: 'slide-in-tooltip 0.4s ease-out'
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-primary">{currentStepData.title}</h3>
            </div>
            <p className="text-sm leading-relaxed">{currentStepData.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipTour}
            className="ml-2 -mt-2 -mr-2 hover:bg-destructive/10 hover:text-destructive"
            title="Bỏ qua hướng dẫn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {currentStepData.showCartIcon && (
          <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">👆</span>
              <span>Sau khi xem xong ở đây, hãy chú ý đến icon giỏ hàng nhấp nháy ở góc trên!</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Bước {currentStep + 1}/{steps.length}
            </span>
          </div>
          
          {!currentStepData.forceClick && (
            <Button onClick={nextStep} className="btn-hero shadow-lg">
              {currentStep === steps.length - 1 ? "🎉 Hoàn thành" : "Tiếp theo →"}
            </Button>
          )}
          
          {currentStepData.forceClick && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary animate-pulse">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-ping"></span>
              <span>Click vào phần được đánh dấu</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Special highlight for cart icon in final step */}
      {currentStepData.showCartIcon && (
        <div
          className="fixed z-[101] pointer-events-none"
          style={{
            top: '16px',
            right: window.innerWidth < 768 ? '60px' : '240px', // Adjust for mobile
          }}
        >
          <div style={{ animation: 'blink-highlight 1.5s infinite ease-in-out' }}>
            <div className="w-14 h-14 rounded-full border-4 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.8)]" />
          </div>
          {/* Pulse rings */}
          <div 
            className="absolute inset-0 w-14 h-14 rounded-full border-2 border-primary/50"
            style={{ animation: 'pulse-ring 2s infinite ease-out' }}
          />
        </div>
      )}
    </>
  );
};

function getTooltipPosition(
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'bottom-right',
  highlightPos: { top: number; left: number; width: number; height: number }
) {
  const offset = 20;
  const style: React.CSSProperties = {};

  switch (position) {
    case 'center':
      style.top = '50%';
      style.left = '50%';
      style.transform = 'translate(-50%, -50%)';
      break;
    case 'top':
      style.top = `${highlightPos.top - offset}px`;
      style.left = `${highlightPos.left + highlightPos.width / 2}px`;
      style.transform = 'translate(-50%, -100%)';
      break;
    case 'bottom':
      style.top = `${highlightPos.top + highlightPos.height + offset}px`;
      style.left = `${highlightPos.left + highlightPos.width / 2}px`;
      style.transform = 'translateX(-50%)';
      break;
    case 'left':
      style.top = `${highlightPos.top + highlightPos.height / 2}px`;
      style.left = `${highlightPos.left - offset}px`;
      style.transform = 'translate(-100%, -50%)';
      break;
    case 'right':
      style.top = `${highlightPos.top + highlightPos.height / 2}px`;
      style.left = `${highlightPos.left + highlightPos.width + offset}px`;
      style.transform = 'translateY(-50%)';
      break;
    case 'bottom-right':
      style.bottom = `${window.innerHeight - highlightPos.top + offset}px`;
      style.right = `${window.innerWidth - highlightPos.left - highlightPos.width}px`;
      break;
  }

  return style;
}

export default GuidedTour;
