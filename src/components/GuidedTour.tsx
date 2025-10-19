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
  const [isProcessingClick, setIsProcessingClick] = useState(false);
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
      id: 'cart-orders-menu',
      selector: '[data-tour="cart-menu"]',
      title: "Giỏ hàng & Theo dõi Đơn hàng 🛒",
      description: "Theo dõi giỏ hàng và đơn hàng của bạn tại đây. Bạn cũng có thể xem nhanh bằng icon giỏ hàng trên header!",
      position: 'left' as const,
      forceClick: false,
      showCartIcon: true,
      requireDropdownOpen: true,
    },
    {
      id: 'community-intro',
      selector: null,
      title: "Cộng đồng Yêu Thú Cưng 👥",
      description: "Kết nối với hàng ngàn người yêu thú cưng! Chia sẻ câu chuyện, kinh nghiệm, và học hỏi từ cộng đồng.",
      position: 'center' as const,
      forceClick: false,
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
          // Check if dropdown is already open
          const dropdownContent = document.querySelector('[role="menu"]');
          if (!dropdownContent) {
            console.log("Opening dropdown for tour step");
            dropdownTrigger.click();
            // Wait longer for dropdown to fully render
            setTimeout(() => {
              findAndHighlightElement();
            }, 300);
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
        console.log(`Found element for step ${currentStep}:`, step.id);
        setTargetElement(element);
        
        // Boost z-index to ensure element is clickable above overlay
        element.style.position = 'relative';
        element.style.zIndex = '102';
        
        // Force reflow to ensure position update
        element.offsetHeight;
        
        const rect = element.getBoundingClientRect();
        console.log('Element position:', rect);
        
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll to element with more padding
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        console.warn(`Element not found for selector: ${step.selector}`);
        // If element not found after 3 seconds, skip to next step
        setTimeout(() => {
          if (!document.querySelector(step.selector!)) {
            console.log("Skipping step due to missing element");
            nextStep();
          }
        }, 3000);
      }
    };

    // Initial highlight
    updateHighlight();

    // Update on window resize or scroll with debounce
    let resizeTimeout: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateHighlight, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('scroll', debouncedUpdate, true);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('scroll', debouncedUpdate, true);
      clearTimeout(resizeTimeout);
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
      clickListenerRef.current = null;
    }

    const handleClick = (e: MouseEvent) => {
      // Prevent multiple rapid clicks
      if (isProcessingClick) {
        console.log("Already processing a click, ignoring...");
        return;
      }

      const target = e.target as HTMLElement;
      
      // More flexible click detection - check if click is within highlight area
      const rect = targetElement.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      const isWithinBounds = 
        clickX >= rect.left - 5 && 
        clickX <= rect.right + 5 && 
        clickY >= rect.top - 5 && 
        clickY <= rect.bottom + 5;
      
      // Check if it's the target element or its children
      const isTargetOrChild = targetElement.contains(target);
      
      if (isWithinBounds || isTargetOrChild) {
        console.log(`Click detected on step ${currentStep}:`, step.id);
        
        e.stopPropagation();
        e.preventDefault();
        
        setIsProcessingClick(true);
        
        // Visual feedback
        targetElement.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
          if (targetElement) {
            targetElement.style.transform = '';
          }
          nextStep();
          // Reset processing flag after step changes
          setTimeout(() => setIsProcessingClick(false), 500);
        }, 200);
      }
    };

    clickListenerRef.current = handleClick;
    
    // Add listener with high priority
    document.addEventListener('click', handleClick, { capture: true });
    
    // Also listen on the target element directly
    targetElement.addEventListener('click', handleClick, { capture: true });

    console.log(`Waiting for click on step ${currentStep}:`, step.id);

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener('click', clickListenerRef.current, true);
        targetElement.removeEventListener('click', clickListenerRef.current, true);
      }
    };
  }, [targetElement, currentStep, isActive, isProcessingClick]);

  const nextStep = () => {
    console.log(`Moving from step ${currentStep} to ${currentStep + 1}`);
    
    // Reset previous element's z-index
    if (targetElement) {
      targetElement.style.zIndex = '';
      targetElement.style.position = '';
      targetElement.style.transform = '';
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsProcessingClick(false);
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
  
  // Safety check: if current step is out of bounds, complete the tour
  if (!currentStepData) {
    handleComplete();
    return null;
  }
  
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
                background: 'transparent',
              }}
            />
            
            {/* Click indicator for forceClick steps */}
            {currentStepData.forceClick && (
              <div 
                className={`absolute pointer-events-none ${
                  currentStepData.position === 'bottom-right' 
                    ? 'top-[-40px] left-1/2 -translate-x-1/2' 
                    : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
                style={{
                  animation: 'pulse 1s infinite ease-in-out'
                }}
              >
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-bold whitespace-nowrap">
                  👆 Click vào đây
                </div>
              </div>
            )}
            
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
      // Tooltip for chatbot - fixed position at bottom RIGHT corner
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Mobile: center bottom, above chatbot
        style.position = 'fixed';
        style.bottom = '140px'; // Above chatbot button
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.maxWidth = 'calc(100vw - 32px)';
        style.width = '90%';
      } else {
        // Desktop: bottom RIGHT corner, above chatbot 
        style.position = 'fixed';
        style.bottom = '140px'; // Above chatbot button  
        style.right = '24px'; // RIGHT corner
        style.maxWidth = '380px';
      }
      break;
  }

  return style;
}

export default GuidedTour;
