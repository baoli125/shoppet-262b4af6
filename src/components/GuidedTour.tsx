import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";

interface GuidedTourProps {
  isActive: boolean;
  onComplete: () => void;
}

interface TourStep {
  id: string;
  selector: string | null;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'bottom-right';
  forceClick: boolean;
  requireDropdownOpen?: boolean;
  showCartIcon?: boolean;
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
      id: 'user-dropdown',
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Quản lý Tài khoản 👤",
      description: "Đây là trung tâm điều khiển! Click vào đây để mở menu và xem tất cả các tính năng.",
      position: 'bottom' as const,
      forceClick: true,
    },
    {
      id: 'marketplace-menu',
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace - Mua sắm Thông minh 🛍️",
      description: "Tại đây bạn có thể mua tất cả sản phẩm cho thú cưng: thức ăn, đồ chơi, phụ kiện với giá tốt nhất.",
      position: 'left' as const,
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: 'ai-chat-menu',
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI Tư vấn 🤖",
      description: "Nhận tư vấn sức khỏe, dinh dưỡng cá nhân hóa cho từng loại thú cưng của bạn.",
      position: 'left' as const,
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: 'pets-menu',
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 📋",
      description: "Quản lý thông tin sức khỏe, lịch tiêm phòng, bệnh án của tất cả thú cưng trong một nơi.",
      position: 'left' as const,
      forceClick: true,
      requireDropdownOpen: true,
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
      requireDropdownOpen: true,
    },
    {
      id: 'cart-orders-menu',
      selector: '[data-tour="cart-menu"]',
      title: "Giỏ hàng & Theo dõi Đơn hàng 🛒",
      description: "Theo dõi giỏ hàng và đơn hàng của bạn tại đây. Bạn cũng có thể xem nhanh bằng icon giỏ hàng trên header!",
      position: 'left' as const,
      forceClick: false,
      showCartIcon: true,
      requireDropdownOpen: true,
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

      // If step requires dropdown to be open, make sure it's visible
      if (step.requireDropdownOpen) {
        const dropdownTrigger = document.querySelector('[data-tour="user-dropdown"]') as HTMLElement;
        if (dropdownTrigger) {
          // Simulate click to open dropdown if not already open
          const dropdownContent = document.querySelector('[role="menu"]');
          if (!dropdownContent) {
            dropdownTrigger.click();
            // Wait for dropdown to open
            setTimeout(() => {
              findAndHighlightElement();
            }, 200);
            return;
          }
        }
      }

      findAndHighlightElement();
    };

    const findAndHighlightElement = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.selector!) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        
        // Boost z-index to ensure element is clickable above overlay
        element.style.position = 'relative';
        element.style.zIndex = '102';
        
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn(`Element not found for selector: ${step.selector}`);
        // If element not found after 2 seconds, skip to next step
        setTimeout(() => {
          if (!document.querySelector(step.selector!)) {
            console.log("Skipping step due to missing element");
            nextStep();
          }
        }, 2000);
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
    // Cleanup function when tour ends
    return () => {
      if (targetElement) {
        targetElement.style.zIndex = '';
        targetElement.style.position = '';
      }
    };
  }, [targetElement, isActive]);

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
    // Reset previous element's z-index
    if (targetElement) {
      targetElement.style.zIndex = '';
      targetElement.style.position = '';
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Reset z-index of target element
    if (targetElement) {
      targetElement.style.zIndex = '';
      targetElement.style.position = '';
    }
    
    onComplete();
  };

  const skipTour = () => {
    const confirmed = window.confirm("Bạn có chắc muốn bỏ qua hướng dẫn? Bạn có thể xem lại sau trong phần cài đặt.");
    if (confirmed) {
      // Reset z-index before completing
      if (targetElement) {
        targetElement.style.zIndex = '';
        targetElement.style.position = '';
      }
      handleComplete();
    }
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];
  const tooltipPosition = getTooltipPosition(currentStepData.position, highlightPosition);

  return (
    <>
      {/* Overlay with cutout - 4 divs creating darkness around target */}
      {targetElement ? (
        <>
          {/* Top overlay */}
          <div 
            className="fixed left-0 right-0 z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto"
            style={{
              top: 0,
              height: `${highlightPosition.top - 4}px`,
            }}
          />
          
          {/* Bottom overlay */}
          <div 
            className="fixed left-0 right-0 z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto"
            style={{
              top: `${highlightPosition.top + highlightPosition.height + 4}px`,
              bottom: 0,
            }}
          />
          
          {/* Left overlay */}
          <div 
            className="fixed z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: 0,
              width: `${highlightPosition.left - 4}px`,
              height: `${highlightPosition.height + 8}px`,
            }}
          />
          
          {/* Right overlay */}
          <div 
            className="fixed z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: `${highlightPosition.left + highlightPosition.width + 4}px`,
              right: 0,
              height: `${highlightPosition.height + 8}px`,
            }}
          />
        </>
      ) : (
        // Fallback full overlay when no target
        <div 
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto"
        />
      )}

      {/* Highlight - Hollow animated border */}
      {targetElement && (
        <>
          {/* Outer pulsing border - HOLLOW SQUARE */}
          <div
            className="fixed pointer-events-none transition-all duration-500"
            style={{
              top: `${highlightPosition.top - 12}px`,
              left: `${highlightPosition.left - 12}px`,
              width: `${highlightPosition.width + 24}px`,
              height: `${highlightPosition.height + 24}px`,
              zIndex: 101,
            }}
          >
            {/* Animated hollow border */}
            <div 
              className="absolute inset-0 rounded-xl border-4 border-primary pointer-events-none"
              style={{
                animation: 'blink-highlight 1.5s infinite ease-in-out',
                boxShadow: '0 0 40px hsl(var(--primary) / 0.6)',
                background: 'transparent', // Rỗng hoàn toàn
              }}
            />
            
            {/* Corner sparkles */}
            <Sparkles 
              className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-pulse pointer-events-none" 
              style={{ animationDelay: '0s' }}
            />
            <Sparkles 
              className="absolute -bottom-3 -left-3 w-5 h-5 text-secondary animate-pulse pointer-events-none" 
              style={{ animationDelay: '0.5s' }}
            />
          </div>

          {/* KHÔNG có overlay che nút - để nút hoàn toàn clickable */}
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
