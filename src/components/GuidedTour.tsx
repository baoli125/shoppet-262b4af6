import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
}

const GuidedTour = ({ isActive, onComplete }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const steps = [
    {
      id: 'chatbot',
      selector: '[data-tour="chatbot"]',
      title: "Chatbot Tay Nhỏ 🤖",
      description: "Đây là trợ lý AI của bạn! Click vào đây bất cứ khi nào cần hỗ trợ về thú cưng.",
      position: 'bottom-right' as const,
      forceClick: true,
    },
    {
      id: 'marketplace-menu',
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace 🛍️",
      description: "Nơi bạn có thể mua sắm các sản phẩm chất lượng cho thú cưng của mình.",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'user-dropdown',
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Người Dùng 👤",
      description: "Đây là nơi bạn có thể thao tác để xem chi tiết từng phần. Hãy click vào để xem các tính năng!",
      position: 'bottom' as const,
      forceClick: true,
    },
    {
      id: 'ai-chat-menu',
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI 🤖",
      description: "Tư vấn về chăm sóc thú cưng, dinh dưỡng, sức khỏe và nhiều hơn nữa!",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'pets-menu',
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 🐾",
      description: "Quản lý thông tin về các bé cưng của bạn, lịch chích ngừa, khám bệnh...",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'add-pet-prompt',
      selector: null,
      title: "Thêm Thú Cưng Đầu Tiên! 🎉",
      description: "Hãy thêm thông tin về thú cưng của bạn để nhận được các tư vấn và chăm sóc phù hợp nhất!",
      position: 'center' as const,
      forceClick: false,
    },
    {
      id: 'community-menu',
      selector: '[data-tour="community-menu"]',
      title: "Cộng đồng 👥",
      description: "Kết nối với những người yêu thú cưng khác, chia sẻ kinh nghiệm và câu chuyện!",
      position: 'left' as const,
      forceClick: true,
    },
    {
      id: 'cart-orders-menu',
      selector: '[data-tour="cart-menu"]',
      title: "Giỏ hàng & Đơn hàng 🛒",
      description: "Bạn có thể truy cập vào đây để kiểm tra giỏ hàng và đơn hàng khi mua hoặc click vào icon giỏ hàng ở bên cạnh.",
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
    if (!isActive || !targetElement) return;

    const step = steps[currentStep];
    if (!step.forceClick) return;

    const handleClick = (e: MouseEvent) => {
      if (targetElement.contains(e.target as Node)) {
        e.stopPropagation();
        setTimeout(() => {
          nextStep();
        }, 300);
      }
    };

    // Listen for clicks on the target element
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] transition-opacity" />

      {/* Highlight */}
      {targetElement && (
        <>
          {/* Pulsing highlight */}
          <div
            className="fixed z-[101] pointer-events-none transition-all duration-300"
            style={{
              top: `${highlightPosition.top - 8}px`,
              left: `${highlightPosition.left - 8}px`,
              width: `${highlightPosition.width + 16}px`,
              height: `${highlightPosition.height + 16}px`,
            }}
          >
            <div className="w-full h-full rounded-lg border-4 border-primary animate-pulse shadow-[0_0_30px_rgba(var(--primary),0.6)]" />
          </div>

          {/* Clickable area */}
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
        className="fixed z-[103] p-6 shadow-2xl max-w-md animate-fade-in"
        style={tooltipPosition}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipTour}
            className="ml-2 -mt-2 -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {currentStepData.showCartIcon && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              👆 Sau khi xem xong ở đây, hãy chú ý đến icon giỏ hàng ở góc trên!
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Bước {currentStep + 1}/{steps.length}
          </span>
          
          {!currentStepData.forceClick && (
            <Button onClick={nextStep} className="btn-hero">
              {currentStep === steps.length - 1 ? "Hoàn thành" : "Tiếp theo"}
            </Button>
          )}
          
          {currentStepData.forceClick && (
            <span className="text-sm font-medium text-primary">
              Click vào phần được đánh dấu để tiếp tục
            </span>
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
            top: '20px',
            right: '20px',
          }}
        >
          <div className="animate-bounce">
            <div className="w-12 h-12 rounded-full border-4 border-primary shadow-[0_0_30px_rgba(var(--primary),0.8)]" />
          </div>
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
