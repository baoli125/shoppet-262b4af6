import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export const GuidedTourOverlay = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    isPaused,
    pausedStep,
    getCurrentStep,
    nextStep,
    previousStep,
    endTour,
    resumeTour,
    pauseTour,
  } = useGuidedTour();

  const location = useLocation();
  const { toast } = useToast();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedRoute, setSavedRoute] = useState<string>("");
  const [hasLeftRoute, setHasLeftRoute] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);

  const step = getCurrentStep();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Recalculate position from viewport (fixed positioning = no scroll offset)
  const updatePosition = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHighlightPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  // Find target with retry mechanism
  useEffect(() => {
    // Cleanup previous retry
    if (retryRef.current) {
      clearInterval(retryRef.current);
      retryRef.current = null;
    }

    if (!isActive || !step?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const tryFind = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement;
      if (el) {
        if (retryRef.current) {
          clearInterval(retryRef.current);
          retryRef.current = null;
        }
        setTargetElement(el);
        updatePosition(el);
        return true;
      }
      return false;
    };

    // Try immediately
    if (!tryFind()) {
      // Retry every 200ms for up to 3s
      let attempts = 0;
      retryRef.current = setInterval(() => {
        attempts++;
        if (tryFind() || attempts > 15) {
          if (retryRef.current) {
            clearInterval(retryRef.current);
            retryRef.current = null;
          }
          // Fallback: show centered if target not found
          if (attempts > 15) {
            console.warn(`Target not found: ${step.targetSelector}`);
            setTargetElement(null);
          }
        }
      }, 200);
    }

    return () => {
      if (retryRef.current) {
        clearInterval(retryRef.current);
        retryRef.current = null;
      }
    };
  }, [isActive, step, currentStep, updatePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const recalc = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => updatePosition(targetElement));
    };

    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, targetElement, updatePosition]);

  // Boost z-index of allowed interaction elements (dropdowns, menus) above overlay
  // Uses MutationObserver to catch dynamically rendered elements (e.g. dropdown menus)
  useEffect(() => {
    if (!isActive || !step) return;

    const boostedElements = new Map<HTMLElement, { origZIndex: string; origPosition: string }>();

    const boostElement = (el: HTMLElement) => {
      if (boostedElements.has(el)) return;
      const computed = window.getComputedStyle(el);
      boostedElements.set(el, {
        origZIndex: el.style.zIndex,
        origPosition: el.style.position,
      });
      el.style.zIndex = "10001";
      // Only set position: relative if element is static (don't break fixed/absolute/sticky)
      if (computed.position === "static") {
        el.style.position = "relative";
      }
    };

    const boostContainer = (el: HTMLElement) => {
      if (boostedElements.has(el)) return;
      boostedElements.set(el, {
        origZIndex: el.style.zIndex,
        origPosition: el.style.position,
      });
      el.style.zIndex = "10001";
    };

    const scanAndBoost = () => {
      step.allowedInteractions.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            const htmlEl = el as HTMLElement;
            boostElement(htmlEl);

            // Boost parent stacking contexts (header, nav, etc.) so z-index is effective
            let parent = htmlEl.parentElement;
            while (parent && parent !== document.body) {
              const ps = window.getComputedStyle(parent);
              // If parent creates a stacking context with z-index, boost it
              if (ps.position !== "static" && ps.zIndex !== "auto") {
                boostContainer(parent);
              }
              parent = parent.parentElement;
            }

            // Boost Radix portal containers (dropdown, popover)
            const wrapper = htmlEl.closest('[data-radix-popper-content-wrapper]') as HTMLElement;
            if (wrapper) boostContainer(wrapper);

            const menu = htmlEl.closest('[role="menu"]') as HTMLElement;
            if (menu) boostContainer(menu);

            const menuContent = htmlEl.closest('[data-radix-menu-content]') as HTMLElement;
            if (menuContent) boostContainer(menuContent);
          });
        } catch { /* invalid selector */ }
      });
    };

    // Initial scan
    scanAndBoost();

    // Watch for dynamically added elements (dropdown menus opening)
    const observer = new MutationObserver(() => {
      scanAndBoost();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      boostedElements.forEach(({ origZIndex, origPosition }, el) => {
        el.style.zIndex = origZIndex;
        el.style.position = origPosition;
      });
    };
  }, [isActive, step, currentStep]);

  // Route tracking for pause/resume
  useEffect(() => {
    if (isActive && !isPaused) {
      setSavedRoute(location.pathname);
      setHasLeftRoute(false);
    }
  }, [isActive, isPaused, location.pathname]);

  useEffect(() => {
    if (isActive && savedRoute && location.pathname !== savedRoute) {
      setHasLeftRoute(true);
    }
  }, [isActive, savedRoute, location.pathname]);

  useEffect(() => {
    if (isPaused && hasLeftRoute && location.pathname === savedRoute && pausedStep !== null) {
      setShowResumeDialog(true);
      setHasLeftRoute(false);
    }
  }, [isPaused, hasLeftRoute, location.pathname, savedRoute, pausedStep]);

  const getTooltipPosition = () => {
  const fallback = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  if (!step) return fallback;

  // Mobile hoặc không có target -> căn giữa màn hình
  if (isMobile || step.position === "center" || !targetElement) {
    return { ...fallback, maxHeight: "80vh", overflowY: "auto" as const };
  }

  // Lấy vị trí từ highlightPosition (đã được tính toán từ getBoundingClientRect)
  const { top, left, width, height } = highlightPosition;
  const pad = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = 448; // Chiều rộng tối đa của tooltip

  // Hàm clampX để đảm bảo tooltip không văng ra khỏi màn hình
  const clampX = (x: number) => {
    const min = pad;
    const max = vw - (isMobile ? 300 : tw) - pad; // Giới hạn dựa trên chiều rộng tooltip
    return `${Math.max(min, Math.min(x, max))}px`;
  };

  // LOGIC ĐẶC BIỆT CHO STEP 2 VÀ 3 (Dời qua trái)
  // Giả sử Step 2 có index là 1, Step 3 có index là 2
  let customLeft = left + width / 2;
  if (currentStep === 1 || currentStep === 2) {
    // Dời tâm điểm hiển thị của tooltip sang trái 100px so với vật thể
    customLeft = left - 100; 
  }

  switch (step.position) {
    case "top":
      return top > 300
        ? { top: `${top - pad}px`, left: clampX(customLeft), transform: "translate(-50%, -100%)" }
        : { top: `${top + height + pad}px`, left: clampX(customLeft), transform: "translate(-50%, 0)" };
    
    case "bottom":
      // Ưu tiên hiển thị bên dưới, nếu không đủ chỗ (cách đáy < 300px) thì đẩy lên trên
      return vh - (top + height + pad) > 300
        ? { top: `${top + height + pad}px`, left: clampX(customLeft), transform: "translate(-50%, 0)" }
        : { top: `${top - pad}px`, left: clampX(customLeft), transform: "translate(-50%, -100%)" };

    case "left":
      return left > tw + pad
        ? { top: `${Math.max(pad, Math.min(top + height / 2, vh - 200))}px`, left: `${left - pad}px`, transform: "translate(-100%, -50%)" }
        : { top: `${Math.max(pad, Math.min(top + height / 2, vh - 200))}px`, left: `${left + width + pad}px`, transform: "translate(0, -50%)" };

    case "right":
      return vw - (left + width + pad) > tw
        ? { top: `${Math.max(pad, Math.min(top + height / 2, vh - 200))}px`, left: `${left + width + pad}px`, transform: "translate(0, -50%)" }
        : { top: `${Math.max(pad, Math.min(top + height / 2, vh - 200))}px`, left: `${left - pad}px`, transform: "translate(-100%, -50%)" };

    default:
      return fallback;
  }
};

  const blockUnallowedInteraction = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-tour-ui]')) return;

    const isAllowed = step?.allowedInteractions.some(selector => {
      try { return target.closest(selector) !== null; } catch { return false; }
    });

    if (isAllowed && step?.requiresAction) {
      setSavedRoute(location.pathname);
      pauseTour();
      toast({
        title: "Hướng dẫn đã tạm dừng",
        description: "Thực hiện hành động của bạn. Chúng tôi sẽ hỏi bạn có muốn tiếp tục sau khi hoàn tất.",
        duration: 3000,
      });
      return;
    }

    if (!isAllowed) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (!isActive || !step) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const hp = highlightPosition;

  // Trong phần return của GuidedTourOverlay.tsx
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* HIGHLIGHT LAYER - Chỉ tạo khung viền quanh mục tiêu, không làm tối màn hình */}
      {targetElement && (
        <div 
          className="fixed transition-all duration-300 pointer-events-none"
          style={{
            // SỬA LỖI VỊ TRÍ: Dùng trực tiếp getBoundingClientRect để luôn khớp với icon/input
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            borderRadius: steps[currentStep].selector?.includes('input') ? '8px' : '50%',
            
            // Thay đổi Border thay vì dùng Shadow phủ kín màn hình
            border: '3px solid hsl(var(--primary))',
            boxShadow: '0 0 0 4px rgba(var(--primary), 0.2), 0 0 15px rgba(0,0,0,0.3)',
            zIndex: 101,
          }}
        >
          {/* Hiệu ứng vòng tròn đồng tâm để gây chú ý mà không che nội dung */}
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        </div>
      )}

      {/* TOOLTIP CONTAINER - Hộp thoại hướng dẫn */}
      <div 
        className="fixed transition-all duration-300 pointer-events-auto" // pointer-events-auto để bấm được nút Next
        style={getTooltipPosition()}
      >
        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {currentStep + 1}
                </span>
                {steps[currentStep].title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {steps[currentStep].description}
              </p>
              
              {/* Các nút bấm Step 3, 4 ... */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">{currentStep + 1}/{steps.length}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>Trước</Button>
                  <Button size="sm" onClick={nextStep}>
                    {currentStep === steps.length - 1 ? "Hoàn tất" : "Tiếp theo"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
