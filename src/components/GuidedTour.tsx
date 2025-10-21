import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";
import chatbotGuideImage from "@/assets/chatbot-guide.png";

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
  showChatbotImage?: boolean;
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
      forceClick: true,
    },
    {
      id: "chatbot-overview",
      selector: null,
      title: "🛍️ Khám phá Marketplace\n\n🤖 Hỏi Trợ lý AI\n\n📋 Quản lý Hồ sơ Thú cưng\n\n👥 Vào Cộng đồng",
      description: "Bạn có thể truy cập nhanh các ứng dụng từ chatbot Tay nhỏ!\nTay nhỏ có thể làm mọi thứ",
      position: "right",
      forceClick: false,
      showChatbotImage: true,
    },
    {
      id: "chatbot",
      selector: '[data-tour="chatbot-close"]',
      title: "Đóng Chatbot",
      description: "Chỉ cần nhấn lại nút này 1 lần nữa để đóng.",
      position: "left",
      forceClick: true,
    },

    // === PHẦN DROPDOWN & MARKETPLACE ===
    {
      id: "dropdown-menu",
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Chính",
      description: "Nếu bạn muốn xem chi tiết từng chức năng, hãy bấm vào đây",
      position: "bottom",
      forceClick: true,
    },
    {
      id: "dropdown-to-marketplace",
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace",
      description: "Click để khám phá Marketplace - nơi mua sắm tất cả sản phẩm cho thú cưng!",
      position: "left",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "marketplace-overview",
      selector: '[data-tour="marketplace-search"]',
      title: "Chào mừng đến Marketplace! 🛍️",
      description:
        "Đây là Marketplace - nơi mua sắm tất cả sản phẩm cho thú cưng. Bạn có thể tìm kiếm, lọc danh mục và xem chi tiết sản phẩm tại đây.",
      position: "bottom",
      forceClick: false,
    },

    // === PHẦN AI ASSISTANT ===
    {
      id: "back-to-dropdown-1",
      selector: '[data-tour="user-dropdown"]',
      title: "Quay lại Menu 🔙",
      description: "Hãy click để quay lại menu chính và khám phá tính năng tiếp theo",
      position: "bottom",
      forceClick: true,
    },
    {
      id: "dropdown-to-ai",
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI Tư vấn 🤖",
      description: "Click để khám phá trợ lý AI thông minh của chúng tôi",
      position: "left",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "ai-overview",
      selector: '[data-tour="ai-chat-input"]',
      title: "Trợ lý AI của bạn! 🤖",
      description:
        "Tại đây bạn có thể hỏi bất kỳ câu hỏi nào về thú cưng. Tôi có thể tư vấn sức khỏe, dinh dưỡng 24/7.",
      position: "top",
      forceClick: false,
    },

    // === PHẦN PET PROFILES ===
    {
      id: "back-to-dropdown-2",
      selector: '[data-tour="user-dropdown"]',
      title: "Tiếp tục Khám phá 🔙",
      description: "Click để tiếp tục khám phá các tính năng khác",
      position: "bottom",
      forceClick: true,
    },
    {
      id: "dropdown-to-pets",
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 📋",
      description: "Click để quản lý thông tin thú cưng của bạn",
      position: "left",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "pets-overview",
      selector: '[data-tour="pets-add-button"]',
      title: "Quản lý Thú cưng! 📋",
      description:
        "Tại đây bạn có thể thêm và quản lý thông tin sức khỏe, lịch tiêm phòng cho tất cả thú cưng của mình.",
      position: "bottom",
      forceClick: false,
    },

    // === PHẦN COMMUNITY ===
    {
      id: "back-to-dropdown-3",
      selector: '[data-tour="user-dropdown"]',
      title: "Khám phá Cộng đồng 🔙",
      description: "Click để khám phá tính năng cộng đồng",
      position: "bottom",
      forceClick: true,
    },
    {
      id: "dropdown-to-community",
      selector: '[data-tour="community-menu"]',
      title: "Cộng đồng Yêu Thú Cưng 👥",
      description: "Click để tham gia cộng đồng yêu thú cưng",
      position: "left",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "community-overview",
      selector: '[data-tour="community-post-input"]',
      title: "Cộng đồng Shoppet! 👥",
      description: "Chia sẻ kinh nghiệm, kết nối với những người yêu thú cưng khác. Đây là nơi để học hỏi và giao lưu!",
      position: "top",
      forceClick: false,
    },

    // === PHẦN BỔ SUNG ===
    {
      id: "back-to-dropdown-4",
      selector: '[data-tour="user-dropdown"]',
      title: "Các tính năng khác 🔙",
      description: "Click để xem các tính năng quản lý khác",
      position: "bottom",
      forceClick: true,
    },
    {
      id: "orders-menu",
      selector: '[data-tour="orders-menu"]',
      title: "Đơn hàng của tôi 📦",
      description: "Theo dõi tình trạng đơn hàng, xem lịch sử mua sắm và quản lý các đơn hàng của bạn.",
      position: "left",
      forceClick: false,
      requireDropdownOpen: true,
    },
    {
      id: "cart-icon",
      selector: '[data-tour="cart-icon"]',
      title: "Giỏ hàng Nhanh 🛒",
      description: "Icon này cho phép bạn truy cập nhanh vào giỏ hàng. Click vào để xem các sản phẩm bạn đã chọn!",
      position: "bottom",
      forceClick: false,
    },
    {
      id: "tour-complete",
      selector: null,
      title: "🎉 Hoàn thành Hướng dẫn!",
      description:
        "Tuyệt vời! Bạn đã làm quen với tất cả tính năng chính của Shoppet. Giờ hãy bắt đầu khám phá và chăm sóc thú cưng của bạn thật tốt nhé! 🐾",
      position: "center",
      forceClick: false,
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

        // Clear retry interval
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }

        setTargetElement(element);

        // SPECIAL: For dropdown steps, automatically open dropdown
        if (step.requireDropdownOpen) {
          console.log("🔓 Auto-opening dropdown for step:", step.id);
          const dropdownTrigger = document.querySelector('[data-tour="user-dropdown"]') as HTMLElement;
          if (dropdownTrigger) {
            // Close any existing dropdown first
            const existingDropdown = document.querySelector('[role="menu"]');
            if (!existingDropdown) {
              dropdownTrigger.click();
              // Wait for dropdown to open then proceed
              setTimeout(() => {
                // Now highlight the target element inside dropdown
                const dropdownElement = document.querySelector(step.selector!) as HTMLElement;
                if (dropdownElement) {
                  setTargetElement(dropdownElement);
                  dropdownElement.style.zIndex = "102";

                  const rect = dropdownElement.getBoundingClientRect();
                  setHighlightPosition({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  });
                }
              }, 300);
              return;
            }
          }
        }

        // Normal highlighting for non-dropdown elements
        element.style.zIndex = "102";

        // Force reflow
        element.offsetHeight;

        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Scroll only if not fixed position
        const isFixed = window.getComputedStyle(element).position === "fixed";
        if (!isFixed) {
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      } else {
        console.warn(`✗ Element not found for step ${currentStep}:`, step.selector);

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
        targetElement.style.position = "";
      }
    };
  }, [targetElement, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];

    // Safety check
    if (!step) {
      console.error("Invalid step in click handler:", currentStep);
      return;
    }

    // Only add click listener if step requires forced click AND element exists
    if (!step.forceClick || !targetElement) {
      console.log(`Step ${currentStep} doesn't require force click or no target element`);
      return;
    }

    console.log(`👆 Setting up click listener for step ${currentStep}:`, step.id);

    const handleClick = (e: MouseEvent) => {
      console.log("🖱 Click detected in guided tour", e.target);

      // CRITICAL: Prevent multiple rapid clicks
      if (isProcessingClick) {
        console.log("🛑 Already processing a click, ignoring...");
        return;
      }

      const target = e.target as HTMLElement;

      // Check if it's the target element or its children
      const isTargetOrChild = targetElement.contains(target);

      // More flexible click detection - check if click is within highlight area
      const rect = targetElement.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      const isWithinBounds =
        clickX >= rect.left - 10 && clickX <= rect.right + 10 && clickY >= rect.top - 10 && clickY <= rect.bottom + 10;

      if (isWithinBounds || isTargetOrChild) {
        console.log(`✓ Valid click detected on step ${currentStep}:`, step.id);

        // STOP event propagation immediately
        e.stopPropagation();
        e.preventDefault();

        // Set processing flag FIRST
        setIsProcessingClick(true);

        // Visual feedback
        targetElement.style.transform = "scale(0.95)";

        // Move to next step after animation - SIMPLIFIED
        setTimeout(() => {
          if (targetElement) {
            targetElement.style.transform = "";
          }

          console.log(`➡️ Advancing from step ${currentStep} to ${currentStep + 1}`);

          // Directly move to next step without complex state management
          if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
          } else {
            handleComplete();
          }

          // Reset processing flag
          setIsProcessingClick(false);
        }, 300);
      } else {
        console.log(`❌ Click outside target area, ignoring`);
      }
    };

    // Remove previous listener if exists
    if (clickListenerRef.current) {
      document.removeEventListener("click", clickListenerRef.current, true);
      targetElement.removeEventListener("click", clickListenerRef.current, true);
    }

    clickListenerRef.current = handleClick;

    // Add listener with high priority (capture phase)
    document.addEventListener("click", handleClick, { capture: true });
    targetElement.addEventListener("click", handleClick, { capture: true });

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener("click", clickListenerRef.current, true);
        if (targetElement) {
          targetElement.removeEventListener("click", clickListenerRef.current, true);
        }
        clickListenerRef.current = null;
      }
    };
  }, [targetElement, currentStep, isActive, isProcessingClick]);

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
      targetElement.style.position = "";
    }

    onComplete();
  };

  const skipTour = () => {
    const confirmed = window.confirm("Bạn có chắc muốn bỏ qua hướng dẫn? Bạn có thể xem lại sau trong phần cài đặt.");
    if (confirmed) {
      // Reset z-index before completing
      if (targetElement) {
        targetElement.style.zIndex = "";
        targetElement.style.position = "";
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

      {/* Chatbot Image - hiển thị khi showChatbotImage = true */}
      {currentStepData.showChatbotImage && (
        <div
          className="fixed z-[101] rounded-2xl shadow-2xl overflow-hidden"
          style={{
            bottom: "calc(15vh + 80px)",
            right: "24px",
            width: "384px",
            height: "500px",
            animation: "slide-in-tooltip 0.4s ease-out",
            pointerEvents: "none",
          }}
        >
          <img src={chatbotGuideImage} alt="Chatbot Guide" className="w-full h-full object-cover rounded-lg" />
          {/* Highlight border around chatbot image */}
          <div
            className="absolute inset-0 rounded-2xl border-4 border-primary"
            style={{
              animation: "blink-highlight 1.5s infinite ease-in-out",
              boxShadow: "0 0 40px hsl(var(--primary) / 0.6)",
              pointerEvents: "none",
            }}
          />
          {/* Corner sparkles */}
          <Sparkles
            className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-pulse"
            style={{ animationDelay: "0s", pointerEvents: "none" }}
          />
          <Sparkles
            className="absolute -bottom-3 -left-3 w-5 h-5 text-secondary animate-pulse"
            style={{ animationDelay: "0.5s", pointerEvents: "none" }}
          />
        </div>
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

            {/* Click indicator for forceClick steps */}
            {currentStepData.forceClick && (
              <div
                className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  animation: "pulse 1s infinite ease-in-out",
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
