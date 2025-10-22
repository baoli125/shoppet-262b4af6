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
  position: "top" | "bottom" | "left" | "right" | "center";
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
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // CRITICAL: Reset to step 0 when tour becomes active
  useEffect(() => {
    if (isActive) {
      console.log("🎬 Guided tour activated - resetting to step 0");
      setCurrentStep(0);
      setIsProcessingClick(false);
      setTargetElement(null);
    }
  }, [isActive]);

  const steps: TourStep[] = [
    // === PHẦN CHATBOT ===
    {
      id: "chatbot",
      selector: '[data-tour="chatbot"]',
      title: "Trợ lý AI Thông Minh 🤖",
      description: "Đây là cổng vào trung tâm của Shoppet! Click để mở và khám phá 4 tính năng chính.",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Mở chatbot
    },
    {
      id: "chatbot-overview",
      selector: '[data-tour="chatbot-window"]',
      title: "Trung tâm Điều khiển 🎯",
      description:
        "Từ đây bạn có thể truy cập nhanh:\n\n🛍️ Marketplace - Mua sắm sản phẩm\n🤖 AI Assistant - Tư vấn thú cưng\n📋 Pet Profiles - Quản lý hồ sơ\n👥 Community - Kết nối cộng đồng",
      position: "right",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },
    {
      id: "chatbot-close",
      selector: '[data-tour="chatbot-close"]',
      title: "Đóng Chatbot",
      description: "Bạn có thể tắt chatbot ở đây khi cần.",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Đóng chatbot
    },

    // === PHẦN DROPDOWN & MARKETPLACE ===
    {
      id: "dropdown-menu",
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Chính 📱",
      description: "Đây là menu chính chứa tất cả tính năng chi tiết của Shoppet.",
      position: "bottom",
      forceClick: true, // ✅ QUAN TRỌNG: Mở dropdown
    },
    {
      id: "dropdown-to-marketplace",
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace 🛍️",
      description: "Click để vào khu vực mua sắm - nơi bạn có thể tìm tất cả sản phẩm cho thú cưng!",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Vào Marketplace
      requireDropdownOpen: true,
    },
    {
      id: "marketplace-overview",
      selector: '[data-tour="marketplace-search"]',
      title: "Chào mừng đến Marketplace! 🛍️",
      description:
        "Tại đây bạn có thể:\n• Tìm kiếm sản phẩm theo tên\n• Lọc theo danh mục\n• Xem chi tiết sản phẩm\n• Đặt hàng và theo dõi đơn",
      position: "bottom",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },

    // === PHẦN AI ASSISTANT ===
    {
      id: "back-to-dropdown-1",
      selector: '[data-tour="user-dropdown"]',
      title: "Quay lại Menu 🔙",
      description: "Hãy quay lại menu để khám phá tính năng thông minh tiếp theo!",
      position: "bottom",
      forceClick: true, // ✅ QUAN TRỌNG: Mở dropdown lại
    },
    {
      id: "dropdown-to-ai",
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI Tư vấn 🤖",
      description: "Khám phá trợ lý AI thông minh - có thể tư vấn sức khỏe, dinh dưỡng 24/7!",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Vào AI Assistant
      requireDropdownOpen: true,
    },
    {
      id: "ai-overview",
      selector: '[data-tour="ai-chat-input"]',
      title: "Trợ lý AI của bạn! 🧠",
      description:
        "Tại đây bạn có thể:\n• Hỏi về sức khỏe thú cưng\n• Tư vấn dinh dưỡng\n• Hướng dẫn chăm sóc\n• Giải đáp mọi thắc mắc",
      position: "top",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },

    // === PHẦN PET PROFILES ===
    {
      id: "back-to-dropdown-2",
      selector: '[data-tour="user-dropdown"]',
      title: "Tiếp tục Khám phá 🔙",
      description: "Quay lại menu để quản lý thông tin thú cưng của bạn!",
      position: "bottom",
      forceClick: true, // ✅ QUAN TRỌNG: Mở dropdown
    },
    {
      id: "dropdown-to-pets",
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 📋",
      description: "Quản lý thông tin sức khỏe, lịch tiêm phòng cho tất cả thú cưng của bạn!",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Vào Pet Profiles
      requireDropdownOpen: true,
    },
    {
      id: "pets-overview",
      selector: '[data-tour="pets-add-button"]',
      title: "Quản lý Thú cưng! 🐾",
      description:
        "Tại đây bạn có thể:\n• Thêm thú cưng mới\n• Cập nhật thông tin sức khỏe\n• Theo dõi lịch tiêm phòng\n• Quản lý hồ sơ bệnh án",
      position: "bottom",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },

    // === PHẦN COMMUNITY ===
    {
      id: "back-to-dropdown-3",
      selector: '[data-tour="user-dropdown"]',
      title: "Khám phá Cộng đồng 🔙",
      description: "Quay lại menu để tham gia cộng đồng yêu thú cưng!",
      position: "bottom",
      forceClick: true, // ✅ QUAN TRỌNG: Mở dropdown
    },
    {
      id: "dropdown-to-community",
      selector: '[data-tour="community-menu"]',
      title: "Cộng đồng Yêu Thú Cưng 👥",
      description: "Tham gia cộng đồng để chia sẻ kinh nghiệm và kết nối!",
      position: "left",
      forceClick: true, // ✅ QUAN TRỌNG: Vào Community
      requireDropdownOpen: true,
    },
    {
      id: "community-overview",
      selector: '[data-tour="community-post-input"]',
      title: "Cộng đồng Shoppet! 🌟",
      description:
        "Tại đây bạn có thể:\n• Chia sẻ hình ảnh thú cưng\n• Hỏi đáp kinh nghiệm\n• Kết nối với người yêu thú cưng\n• Học hỏi kiến thức chăm sóc",
      position: "top",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },

    // === PHẦN BỔ SUNG ===
    {
      id: "orders-menu",
      selector: '[data-tour="orders-menu"]',
      title: "Đơn hàng của tôi 📦",
      description: "Theo dõi tình trạng đơn hàng và xem lịch sử mua sắm.",
      position: "left",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
      requireDropdownOpen: true,
    },
    {
      id: "cart-icon",
      selector: '[data-tour="cart-icon"]',
      title: "Giỏ hàng Nhanh 🛒",
      description: "Truy cập nhanh vào giỏ hàng để xem các sản phẩm đã chọn!",
      position: "bottom",
      forceClick: false, // ❌ KHÔNG CẦN: Chỉ giới thiệu
    },
    {
      id: "tour-complete",
      selector: null,
      title: "🎉 Hoàn thành Hướng dẫn!",
      description:
        "Tuyệt vời! Bạn đã làm quen với tất cả tính năng chính của Shoppet. Giờ hãy bắt đầu khám phá và chăm sóc thú cưng của bạn thật tốt nhé! 🐾",
      position: "center",
      forceClick: false, // ❌ KHÔNG CẦN: Kết thúc
    },
  ];

  useEffect(() => {
    if (!isActive) return;

    // Clear any existing retry interval when step changes
    if (retryIntervalRef.current) {
      console.log("Clearing previous retry interval");
      clearInterval(retryIntervalRef.current);
      retryIntervalRef.current = null;
    }

    const updateHighlight = () => {
      const step = steps[currentStep];

      // Safety check
      if (!step) {
        console.error("Invalid step index:", currentStep);
        return;
      }

      console.log(`Starting step ${currentStep}:`, step.id);

      if (!step.selector) {
        console.log("Step has no selector (center display)");
        setTargetElement(null);
        return;
      }

      // If step requires dropdown to be open, make sure it's visible
      if (step.requireDropdownOpen) {
        const dropdownTrigger = document.querySelector('[data-tour="user-dropdown"]') as HTMLElement;
        if (dropdownTrigger) {
          // Check if dropdown is already open by looking for the menu content
          const dropdownContent = document.querySelector('[role="menu"]');
          if (!dropdownContent) {
            console.log("Opening dropdown for tour step");
            dropdownTrigger.click();
            // Wait longer for dropdown animation and rendering
            setTimeout(() => {
              findAndHighlightElement();
            }, 500);
            return;
          }
        }
      }

      findAndHighlightElement();
    };

    const findAndHighlightElement = () => {
      const step = steps[currentStep];

      if (!step || !step.selector) {
        console.log("No selector for current step");
        return;
      }

      const element = document.querySelector(step.selector!) as HTMLElement;

      if (element) {
        console.log(`✓ Found element for step ${currentStep}:`, step.id);

        // Clear retry interval if it exists
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }

        setTargetElement(element);

        // 🛠 SỬA: Chỉ set z-index, giữ nguyên position gốc
        element.style.zIndex = "102";

        // Force reflow to ensure position update
        element.offsetHeight;

        const rect = element.getBoundingClientRect();

        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll to element với chatbot (vẫn cần vì có thể bị scroll)
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } else {
        console.warn(`✗ Element not found for step ${currentStep}:`, step.selector);

        // Only start retry interval if one doesn't exist
        if (!retryIntervalRef.current) {
          console.log("Starting retry interval to find element");
          retryIntervalRef.current = setInterval(() => {
            const retryElement = document.querySelector(step.selector!) as HTMLElement;
            if (retryElement) {
              console.log(`✓ Found element on retry for step ${currentStep}`);
              findAndHighlightElement();
            }
          }, 600);
        }
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

    window.addEventListener("resize", debouncedUpdate);
    window.addEventListener("scroll", debouncedUpdate, true);

    return () => {
      window.removeEventListener("resize", debouncedUpdate);
      window.removeEventListener("scroll", debouncedUpdate, true);
      clearTimeout(resizeTimeout);

      // Clear retry interval on cleanup
      if (retryIntervalRef.current) {
        console.log("Cleanup: clearing retry interval");
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [currentStep, isActive]);

  useEffect(() => {
    // Cleanup function when tour ends
    return () => {
      if (targetElement) {
        targetElement.style.zIndex = "";
      }
    };
  }, [targetElement, isActive]);

  useEffect(() => {
    if (!isActive || !targetElement) return;

    const step = steps[currentStep];
    if (!step?.forceClick) return;

    console.log(`🎯 Setting up click listener for step ${currentStep}`);

    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      console.log(`✅ Click processed for step ${currentStep}`);

      // Remove listener immediately
      document.removeEventListener("click", handleClick, true);

      // Visual feedback
      targetElement.style.transform = "scale(0.95)";

      // For chatbot button, trigger its click handler
      if (currentStep === 0) {
        const chatbotButton = document.querySelector('[data-tour="chatbot"]') as HTMLButtonElement;
        if (chatbotButton) {
          chatbotButton.click();
        }
      }

      // Move to next step
      setTimeout(() => {
        if (targetElement) {
          targetElement.style.transform = "";
        }

        console.log(`➡️ Moving to step ${currentStep + 1}`);

        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleComplete();
        }
      }, 300);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [targetElement, currentStep, isActive]);

  const nextStep = () => {
    console.log(`➡️ Moving from step ${currentStep} to ${currentStep + 1}`);

    // Reset previous element's z-index
    if (targetElement) {
      targetElement.style.zIndex = "";
      targetElement.style.transform = "";
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
      targetElement.style.zIndex = "";
    }

    onComplete();
  };

  const skipTour = () => {
    const confirmed = window.confirm("Bạn có chắc muốn bỏ qua hướng dẫn? Bạn có thể xem lại sau trong phần cài đặt.");
    if (confirmed) {
      // Reset z-index before completing
      if (targetElement) {
        targetElement.style.zIndex = "";
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

  // Tooltip luôn ở giữa màn hình
  const tooltipPosition = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

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
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm pointer-events-auto" />
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
                animation: "blink-highlight 1.5s infinite ease-in-out",
                boxShadow: "0 0 40px hsl(var(--primary) / 0.6)",
                background: "transparent",
              }}
            />

            {/* Corner sparkles */}
            <Sparkles
              className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-pulse pointer-events-none"
              style={{ animationDelay: "0s" }}
            />
            <Sparkles
              className="absolute -bottom-3 -left-3 w-5 h-5 text-secondary animate-pulse pointer-events-none"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
        </>
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-[103] p-6 shadow-2xl max-w-md border-2 border-primary/20"
        style={{
          ...tooltipPosition,
          animation: "slide-in-tooltip 0.4s ease-out",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-primary">{currentStepData.title}</h3>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{currentStepData.description}</p>
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
              <span>Click vào vùng được đánh dấu</span>
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
            top: "16px",
            right: window.innerWidth < 768 ? "60px" : "240px", // Adjust for mobile
          }}
        >
          <div style={{ animation: "blink-highlight 1.5s infinite ease-in-out" }}>
            <div className="w-14 h-14 rounded-full border-4 border-primary shadow-[0_0_40px_hsl(var(--primary)/0.8)]" />
          </div>
          {/* Pulse rings */}
          <div
            className="absolute inset-0 w-14 h-14 rounded-full border-2 border-primary/50"
            style={{ animation: "pulse-ring 2s infinite ease-out" }}
          />
        </div>
      )}
    </>
  );
};

export default GuidedTour;
