import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Sparkles } from "lucide-react";
import chatbotGuideImage from "@/assets/chatbot-guide.png";
import cartEmptyGuide from "@/assets/cart-empty-guide.png";
import ordersEmptyGuide from "@/assets/orders-empty-guide.png";
import petsEmptyGuide from "@/assets/pets-empty-guide.png";

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
  showCartImage?: boolean;
  showOrdersImage?: boolean;
  showPetsImage?: boolean;
}

const GuidedTour = ({ isActive, onComplete }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  const clickListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      description: "Đây là cổng vào trung tâm của PurriPaws! Click để mở và khám phá 4 tính năng chính.",
      position: "center",
      forceClick: true,
    },
    {
      id: "chatbot-overview",
      selector: null,
      title: "🛍️ Khám phá Marketplace\n\n🤖 Hỏi Trợ lý AI\n\n📋 Quản lý Hồ sơ Thú cưng\n\n👥 Vào Cộng đồng",
      description: "Bạn có thể truy cập nhanh các ứng dụng từ chatbot Tay nhỏ!\nTay nhỏ có thể làm mọi thứ",
      position: "left",
      forceClick: false,
      showChatbotImage: true,
    },
    {
      id: "chatbot-close",
      selector: '[data-tour="chatbot"]',
      title: "Đóng Chatbot",
      description: "Bạn có thể tắt chatbot ở đây khi cần.",
      position: "center",
      forceClick: true,
    },

    // === PHẦN DROPDOWN & MARKETPLACE ===
    {
      id: "dropdown-menu",
      selector: '[data-tour="user-dropdown"]',
      title: "Menu Chính",
      description: "Nếu bạn muốn xem chi tiết từng chức năng, hãy bấm vào đây",
      position: "center",
      forceClick: true,
    },
    {
      id: "dropdown-to-marketplace",
      selector: '[data-tour="marketplace-menu"]',
      title: "Marketplace",
      description: "Click để khám phá Marketplace - nơi mua sắm tất cả sản phẩm cho thú cưng!",
      position: "center",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "marketplace-overview",
      selector: '[data-tour="marketplace-search"]',
      title: "Chào mừng đến Marketplace! 🛍️",
      description:
        "Đây là Marketplace - nơi mua sắm tất cả sản phẩm cho thú cưng. Hãy bắt đầu với khung tìm kiếm để tìm sản phẩm bạn cần.",
      position: "center",
      forceClick: false,
    },
    {
      id: "marketplace-category",
      selector: '[data-tour="marketplace-category"]',
      title: "Lọc theo Danh mục 📂",
      description: "Chọn danh mục để xem sản phẩm theo loại: Thức ăn, Đồ chơi, Phụ kiện, Thuốc, hoặc Chăm sóc.",
      position: "center",
      forceClick: false,
    },
    {
      id: "marketplace-pet-type",
      selector: '[data-tour="marketplace-pet-type"]',
      title: "Lọc theo Loại Thú Cưng 🐾",
      description: "Chọn loại thú cưng để xem sản phẩm phù hợp: Chó, Mèo, Chim, hoặc Cá.",
      position: "center",
      forceClick: false,
    },
    {
      id: "marketplace-sort",
      selector: '[data-tour="marketplace-sort"]',
      title: "Sắp xếp Sản phẩm 🔄",
      description: "Sắp xếp sản phẩm theo giá hoặc tên để dễ tìm kiếm hơn. Bạn cũng có thể đảo chiều sắp xếp!",
      position: "center",
      forceClick: false,
    },

    // === PHẦN AI ASSISTANT ===
    {
      id: "back-to-dropdown-1",
      selector: '[data-tour="user-dropdown"]',
      title: "Quay lại Menu 🔙",
      description: "Hãy click để quay lại menu chính và khám phá tính năng tiếp theo",
      position: "center",
      forceClick: true,
    },
    {
      id: "dropdown-to-ai",
      selector: '[data-tour="ai-chat-menu"]',
      title: "Trợ lý AI Tư vấn 🤖",
      description: "Click để khám phá trợ lý AI thông minh của chúng tôi",
      position: "center",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "ai-overview",
      selector: '[data-tour="ai-chat-input"]',
      title: "Trợ lý AI của bạn! 🤖",
      description:
        "Tại đây bạn có thể hỏi bất kỳ câu hỏi nào về thú cưng. Tôi có thể tư vấn sức khỏe, dinh dưỡng 24/7.",
      position: "center",
      forceClick: false,
    },

    // === PHẦN PET PROFILES ===
    {
      id: "back-to-dropdown-2",
      selector: '[data-tour="user-dropdown"]',
      title: "Tiếp tục Khám phá 🔙",
      description: "Click để tiếp tục khám phá các tính năng khác",
      position: "center",
      forceClick: true,
    },
    {
      id: "dropdown-to-pets",
      selector: '[data-tour="pets-menu"]',
      title: "Hồ sơ Thú cưng 📋",
      description: "Click để quản lý thông tin thú cưng của bạn",
      position: "center",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "pets-overview",
      selector: null,
      title: "Quản lý Thú cưng! 📋",
      description:
        "Tại đây bạn có thể thêm và quản lý thông tin sức khỏe, lịch tiêm phòng cho tất cả thú cưng của mình.",
      position: "bottom",
      forceClick: false,
      showPetsImage: true,
    },

    // === PHẦN COMMUNITY ===
    {
      id: "back-to-dropdown-3",
      selector: '[data-tour="user-dropdown"]',
      title: "Khám phá Cộng đồng 🔙",
      description: "Click để khám phá tính năng cộng đồng",
      position: "center",
      forceClick: true,
    },
    {
      id: "dropdown-to-community",
      selector: '[data-tour="community-menu"]',
      title: "Cộng đồng Yêu Thú Cưng 👥",
      description: "Click để tham gia cộng đồng yêu thú cưng",
      position: "center",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "community-overview",
      selector: '[data-tour="community-post-input"]',
      title: "Cộng đồng PurriPaws! 👥",
      description: "Chia sẻ kinh nghiệm, kết nối với những người yêu thú cưng khác. Đây là nơi để học hỏi và giao lưu!",
      position: "center",
      forceClick: false,
    },

    // === PHẦN BỔ SUNG ===
    {
      id: "back-to-dropdown-4",
      selector: '[data-tour="user-dropdown"]',
      title: "Các tính năng khác 🔙",
      description: "Click để xem các tính năng quản lý khác",
      position: "center",
      forceClick: true,
    },
    {
      id: "dropdown-to-orders",
      selector: '[data-tour="orders-menu"]',
      title: "Đơn hàng của tôi 📦",
      description: "Click để xem đơn hàng và lịch sử mua sắm của bạn",
      position: "center",
      forceClick: true,
      requireDropdownOpen: true,
    },
    {
      id: "orders-overview",
      selector: null,
      title: "Quản lý Đơn hàng! 📦",
      description: "Theo dõi tình trạng đơn hàng, xem lịch sử mua sắm và quản lý các đơn hàng của bạn tại đây.",
      position: "bottom",
      forceClick: false,
      showOrdersImage: true,
    },
    {
      id: "back-to-home",
      selector: '[data-tour="logo"]',
      title: "Quay về Trang chủ 🏠",
      description: "Click vào logo để quay về trang chủ",
      position: "center",
      forceClick: true,
    },
    {
      id: "cart-icon-click",
      selector: '[data-tour="cart-icon"]',
      title: "Giỏ hàng Nhanh 🛒",
      description: "Click vào icon giỏ hàng để xem các sản phẩm bạn đã chọn",
      position: "center",
      forceClick: true,
    },
    {
      id: "cart-overview",
      selector: null,
      title: "Giỏ hàng của bạn! 🛒",
      description: "Tại đây bạn có thể xem tất cả sản phẩm đã chọn, điều chỉnh số lượng và tiến hành thanh toán.",
      position: "bottom",
      forceClick: false,
      showCartImage: true,
    },
    {
      id: "tour-complete",
      selector: null,
      title: "🎉 Hoàn thành Hướng dẫn!",
      description:
        "Tuyệt vời! Bạn đã làm quen với tất cả tính năng chính của PurriPaws. Giờ hãy bắt đầu khám phá và chăm sóc thú cưng của bạn thật tốt nhé! 🐾",
      position: "center",
      forceClick: false,
    },
  ];
  // Tối ưu tooltip position cho mobile
  const getTooltipPosition = () => {
    const step = steps[currentStep];
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 16 : 20;
    const tooltipMaxWidth = isMobile ? window.innerWidth - (padding * 2) : 448;

    // Không có target element → center screen
    if (!step.selector || !targetElement) {
      if (isMobile) {
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      }

      switch (step.position) {
        case "top":
          return {
            top: `${padding}px`,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: `${tooltipMaxWidth}px`,
          };
        case "bottom":
          return {
            bottom: `${padding}px`,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: `${tooltipMaxWidth}px`,
          };
        case "center":
        default:
          return {
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: `${tooltipMaxWidth}px`,
          };
      }
    }

    // Có target element
    const rect = highlightPosition;
    const tooltipHeight = 280; // ước tính

    if (isMobile) {
      // Mobile: ưu tiên bottom, fallback top
      const spaceBelow = window.innerHeight - (rect.top + rect.height);
      const spaceAbove = rect.top;

      if (spaceBelow > tooltipHeight + padding) {
        // Đủ chỗ phía dưới
        return {
          top: `${rect.top + rect.height + 12}px`,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      } else if (spaceAbove > tooltipHeight + padding) {
        // Đủ chỗ phía trên
        return {
          bottom: `${window.innerHeight - rect.top + 12}px`,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      } else {
        // Không đủ chỗ → center screen
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      }
    }

    // Desktop: theo position
    switch (step.position) {
      case "top": {
        const top = Math.max(rect.top - tooltipHeight - 20, padding);
        return {
          top: `${top}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      }
      case "bottom": {
        const top = Math.min(
          rect.top + rect.height + 20,
          window.innerHeight - tooltipHeight - padding
        );
        return {
          top: `${top}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
      }
      case "center":
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: `${tooltipMaxWidth}px`,
        };
    }
  };

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

        // Ensure target is above overlay
        element.style.position = "relative";
        element.style.zIndex = "200";

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
    let resizeTimeout: ReturnType<typeof setTimeout>;
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
    if (!step || !step.forceClick || !targetElement) return;

    console.log(`👆 Setting up ADVANCED click listener for step ${currentStep}:`, step.id);

    const handleClick = (e: MouseEvent) => {
      console.log("🖱 ADVANCED Click detected", e.target);

      if (isProcessingClick) return;

      const target = e.target as HTMLElement;
      const rect = targetElement.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      const isWithinBounds =
        clickX >= rect.left - 10 && clickX <= rect.right + 10 && clickY >= rect.top - 10 && clickY <= rect.bottom + 10;

      if (isWithinBounds || targetElement.contains(target)) {
        console.log(`✓ ADVANCED Valid click on step ${currentStep}:`, step.id);

        setIsProcessingClick(true);

        // Visual feedback
        targetElement.style.transform = "scale(0.95)";
        targetElement.style.transition = "transform 0.15s";

        // SMART DROPDOWN MANAGEMENT
        const handleDropdownAndProceed = () => {
          // Đảm bảo dropdown đã mở (nếu cần)
          if (step.requireDropdownOpen) {
            const dropdownContent = document.querySelector('[role="menu"]');
            if (!dropdownContent) {
              console.log("🔄 Dropdown chưa mở, triggering programmatically...");
              targetElement.click();

              // Đợi dropdown mở rồi mới chuyển bước
              setTimeout(() => {
                proceedToNextStep();
              }, 400);
              return;
            }
          }

          // Nếu không cần dropdown, chuyển bước ngay
          proceedToNextStep();
        };

        const proceedToNextStep = () => {
          console.log(`➡️ ADVANCED Moving to step ${currentStep + 1}`);

          // Khôi phục visual
          if (targetElement) {
            targetElement.style.transform = "";
          }

          // Chuyển bước tour
          if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
          } else {
            handleComplete();
          }

          setTimeout(() => {
            setIsProcessingClick(false);
          }, 200);
        };

        // Bắt đầu quy trình
        handleDropdownAndProceed();
      }
    };

    // Cleanup previous listener
    if (clickListenerRef.current) {
      document.removeEventListener("click", clickListenerRef.current, true);
    }

    clickListenerRef.current = handleClick;
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener("click", clickListenerRef.current, true);
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

  return (
    <>
      {/* Single overlay with clip-path cutout */}
      {targetElement ? (
        <div
          className="fixed inset-0 z-[100] bg-black/70 pointer-events-auto"
          style={{
            clipPath: `polygon(
              0 0,
              100% 0,
              100% 100%,
              0 100%,
              0 ${highlightPosition.top - 4}px,
              ${highlightPosition.left - 4}px ${highlightPosition.top - 4}px,
              ${highlightPosition.left - 4}px ${highlightPosition.top + highlightPosition.height + 4}px,
              ${highlightPosition.left + highlightPosition.width + 4}px ${highlightPosition.top + highlightPosition.height + 4}px,
              ${highlightPosition.left + highlightPosition.width + 4}px ${highlightPosition.top - 4}px,
              0 ${highlightPosition.top - 4}px
            )`
          }}
        />
      ) : (
        <div className="fixed inset-0 z-[100] bg-black/70 pointer-events-auto" />
      )}

      {/* Chatbot Image - Mobile Optimized */}
      {currentStepData.showChatbotImage && (
        <div
          className="fixed z-[101] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
          style={{
            bottom: (() => {
              const width = window.innerWidth;
              if (width < 480) return "calc(10vh + 60px)"; // Extra small
              if (width < 768) return "calc(12vh + 65px)"; // Mobile
              return "calc(15vh + 80px)"; // Desktop
            })(),
            right: window.innerWidth < 768 ? "8px" : "24px",
            width: (() => {
              const width = window.innerWidth;
              if (width < 480) return "calc(100vw - 16px)"; // Extra small
              if (width < 768) return "calc(100vw - 20px)"; // Mobile
              return "384px"; // Desktop
            })(),
            height: "auto",
            maxWidth: window.innerWidth < 768 ? "100%" : "384px",
            maxHeight: window.innerWidth < 480 ? "40vh" : "50vh",
            animation: "slide-in-tooltip 0.4s ease-out",
            pointerEvents: "none",
          }}
        >
          <img 
            src={chatbotGuideImage} 
            alt="Chatbot Guide" 
            className="w-full h-auto object-contain rounded-lg" 
          />
          <div
            className="absolute inset-0 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-primary"
            style={{
              animation: "blink-highlight 1.5s infinite ease-in-out",
              boxShadow: "0 0 30px hsl(var(--primary) / 0.6)",
              pointerEvents: "none",
            }}
          />
          <Sparkles
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary animate-pulse"
            style={{ animationDelay: "0s", pointerEvents: "none" }}
          />
          <Sparkles
            className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-secondary animate-pulse"
            style={{ animationDelay: "0.5s", pointerEvents: "none" }}
          />
        </div>
      )}

      {/* Pets/Orders/Cart Images - Mobile First Optimized */}
      {(currentStepData.showPetsImage || currentStepData.showOrdersImage || currentStepData.showCartImage) && (
        <div
          className="fixed z-[101] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden bg-background/95 backdrop-blur-sm flex items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: (() => {
              const width = window.innerWidth;
              if (width < 480) return "translate(-50%, -50%) scale(0.55)"; // Extra small
              if (width < 640) return "translate(-50%, -50%) scale(0.65)"; // Small mobile
              if (width < 768) return "translate(-50%, -50%) scale(0.75)"; // Large mobile
              return "translate(-50%, -50%) scale(0.5)"; // Desktop
            })(),
            width: (() => {
              const width = window.innerWidth;
              if (width < 480) return "95vw";
              if (width < 768) return "92vw";
              return "min(90vw, 1000px)";
            })(),
            height: (() => {
              const width = window.innerWidth;
              if (width < 480) return "60vh";
              if (width < 768) return "65vh";
              return "calc(100vh - 160px)";
            })(),
            maxHeight: window.innerWidth < 768 ? "70vh" : "800px",
            animation: "slide-in-tooltip 0.4s ease-out",
            pointerEvents: "none",
            border: window.innerWidth < 768 ? "2px solid hsl(var(--primary))" : "3px solid hsl(var(--primary))",
            transformOrigin: "center center",
          }}
        >
          <img 
            src={
              currentStepData.showPetsImage ? petsEmptyGuide :
              currentStepData.showOrdersImage ? ordersEmptyGuide :
              cartEmptyGuide
            } 
            alt="Guide" 
            className="w-full h-full object-contain rounded-lg p-1 sm:p-2" 
          />
          <div
            className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-primary"
            style={{
              animation: "blink-highlight 1.5s infinite ease-in-out",
              boxShadow: "0 0 20px hsl(var(--primary) / 0.5)",
              pointerEvents: "none",
            }}
          />
          <Sparkles
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary animate-pulse"
            style={{ animationDelay: "0s", pointerEvents: "none" }}
          />
          <Sparkles
            className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-secondary animate-pulse"
            style={{ animationDelay: "0.5s", pointerEvents: "none" }}
          />
        </div>
      )}


      {/* Highlight - Hollow animated border - Mobile Optimized */}
      {targetElement && (
        <div
          className="fixed pointer-events-none transition-all duration-500"
          style={{
            top: `${highlightPosition.top - (window.innerWidth < 768 ? 6 : 8)}px`,
            left: `${highlightPosition.left - (window.innerWidth < 768 ? 6 : 8)}px`,
            width: `${highlightPosition.width + (window.innerWidth < 768 ? 12 : 16)}px`,
            height: `${highlightPosition.height + (window.innerWidth < 768 ? 12 : 16)}px`,
            zIndex: 101,
          }}
        >
          <div
            className="absolute inset-0 rounded-lg sm:rounded-xl border-[2.5px] sm:border-[3px] md:border-4 border-primary pointer-events-none"
            style={{
              animation: "blink-highlight 1.5s infinite ease-in-out",
              boxShadow: window.innerWidth < 768 
                ? "0 0 20px hsl(var(--primary) / 0.5)" 
                : "0 0 30px hsl(var(--primary) / 0.6)",
              background: "transparent",
            }}
          />
          <Sparkles
            className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-primary animate-pulse pointer-events-none"
            style={{ animationDelay: "0s" }}
          />
          <Sparkles
            className="absolute -bottom-1.5 -left-1.5 sm:-bottom-2 sm:-left-2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5 text-secondary animate-pulse pointer-events-none"
            style={{ animationDelay: "0.5s" }}
          />
        </div>
      )}

      {/* Tooltip - Mobile First */}
      <Card
        className="fixed z-[103] shadow-2xl border-2 border-primary/20"
        style={{
          ...getTooltipPosition(),
          animation: "slide-in-tooltip 0.4s ease-out",
          padding: (() => {
            const width = window.innerWidth;
            if (width < 480) return "12px";
            if (width < 768) return "14px";
            return "24px";
          })(),
          width: (() => {
            const width = window.innerWidth;
            if (width < 480) return "calc(100vw - 24px)";
            if (width < 768) return "calc(100vw - 32px)";
            return "auto";
          })(),
          margin: window.innerWidth < 768 ? "0 auto" : "0",
        }}
      >
        <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-primary leading-tight">{currentStepData.title}</h3>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed break-words">{currentStepData.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipTour}
            className="ml-1 sm:ml-2 -mt-1 sm:-mt-2 -mr-1 sm:-mr-2 hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 touch-manipulation flex-shrink-0"
            title="Bỏ qua hướng dẫn"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
          </Button>
        </div>

        {currentStepData.showCartIcon && (
          <div className="mb-2 sm:mb-3 md:mb-4 p-2 sm:p-2.5 md:p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <p className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base md:text-lg flex-shrink-0">👆</span>
              <span className="break-words">Sau khi xem xong ở đây, hãy chú ý đến icon giỏ hàng nhấp nháy ở góc trên!</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
              {currentStep + 1}/{steps.length}
            </span>
          </div>

          {!currentStepData.forceClick && (
            <Button onClick={nextStep} className="btn-hero shadow-lg h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 touch-manipulation flex-shrink-0">
              {currentStep === steps.length - 1 ? "🎉 Xong" : "Tiếp →"}
            </Button>
          )}

          {currentStepData.forceClick && (
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm font-medium text-primary animate-pulse">
              <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-ping"></span>
              <span className="hidden sm:inline">Click vào phần được đánh dấu</span>
              <span className="sm:hidden">Click đây</span>
            </div>
          )}
        </div>

        {/* Progress bar - Mobile Optimized */}
        <div className="mt-2 sm:mt-3 md:mt-4 h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Special highlight for cart icon - Mobile Optimized */}
      {currentStepData.showCartIcon && (
        <div
          className="fixed z-[101] pointer-events-none"
          style={{
            top: (() => {
              const width = window.innerWidth;
              if (width < 480) return "12px";
              if (width < 768) return "14px";
              return "16px";
            })(),
            right: (() => {
              const width = window.innerWidth;
              if (width < 480) return "50px";
              if (width < 768) return "55px";
              return "240px";
            })(),
          }}
        >
          <div style={{ animation: "blink-highlight 1.5s infinite ease-in-out" }}>
            <div 
              className="rounded-full border-primary shadow-[0_0_30px_hsl(var(--primary)/0.7)]"
              style={{
                width: window.innerWidth < 768 ? "48px" : "56px",
                height: window.innerWidth < 768 ? "48px" : "56px",
                borderWidth: window.innerWidth < 768 ? "3px" : "4px",
              }}
            />
          </div>
          {/* Pulse rings */}
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            style={{ 
              animation: "pulse-ring 2s infinite ease-out",
              width: window.innerWidth < 768 ? "48px" : "56px",
              height: window.innerWidth < 768 ? "48px" : "56px",
            }}
          />
        </div>
      )}
    </>
  );
};

export default GuidedTour;
