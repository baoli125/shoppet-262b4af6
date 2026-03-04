import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Sparkles } from "lucide-react";

export const GuidedTourOverlay = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    getCurrentStep,
    nextStep,
    endTour,
  } = useGuidedTour();

  const location = useLocation();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = getCurrentStep();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updatePosition = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHighlightPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  // 1. Tìm phần tử mục tiêu liên tục (Quét DOM liên tục để tìm Dropdown khi nó vừa mở)
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const tryFind = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement;
      if (el) {
        setTargetElement(el);
        updatePosition(el);
      }
    };

    tryFind();
    const interval = setInterval(tryFind, 200);
    return () => clearInterval(interval);
  }, [isActive, step, currentStep, updatePosition]);

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

  // 2. LOGIC MỚI: Bắt sự kiện Xuyên Thấu Không Thể Bị Chặn (Giải quyết lỗi kẹt Step 2, 3)
  useEffect(() => {
    if (!isActive || !targetElement) return;

    let hasAdvanced = false;

    // Kiểm tra xem vị trí người dùng click có nằm trong vùng sáng không
    const isAllowedInteraction = (e: Event) => {
      const tooltip = document.getElementById('tour-tooltip');
      const target = e.target as Node;
      if (tooltip?.contains(target)) return true; // Cho phép click vào tooltip (để bấm nút X)
      if (targetElement?.contains(target) || targetElement === target) return true; // Cho phép click vùng sáng
      return false;
    };

    const blockOutside = (e: Event) => {
      if (!isAllowedInteraction(e)) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    // Hàm Xử lý chuyển Step khi người dùng chạm đúng mục tiêu
    const handleAdvance = (e: Event) => {
      const target = e.target as Node;
      if ((targetElement.contains(target) || targetElement === target) && !hasAdvanced) {
        hasAdvanced = true;
        // Đợi 300ms để Dropdown/Modal của web bạn kịp bung ra, sau đó mới đi sang Step tiếp theo
        setTimeout(() => {
          nextStep();
        }, 300);
      }
    };

    // QUAN TRỌNG: Sử dụng 'pointerdown' ở chế độ Capture (true) để bắt sự kiện 
    // TRƯỚC KHI thư viện UI của bạn kịp ngăn chặn nó (e.preventDefault)
    document.addEventListener('pointerdown', blockOutside, true);
    document.addEventListener('click', blockOutside, true);
    document.addEventListener('pointerdown', handleAdvance, true);

    return () => {
      document.removeEventListener('pointerdown', blockOutside, true);
      document.removeEventListener('click', blockOutside, true);
      document.removeEventListener('pointerdown', handleAdvance, true);
    };
  }, [isActive, targetElement, nextStep]);

  // 3. Tính toán vị trí hộp thoại
  const getTooltipPosition = () => {
    const fallback = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    if (!step) return fallback;

    if (isMobile || step.position === "center" || !targetElement) {
      return { ...fallback, maxHeight: "80vh", overflowY: "auto" as const };
    }

    const { top, left, width, height } = highlightPosition;
    const pad = 24;
    const tw = 380;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let leftPos = left + width / 2;
    let transformX = "-50%";

    if (currentStep === 1 || currentStep === 2) {
      leftPos = left - 120;
      transformX = "0";
    }

    const clampedLeft = Math.max(pad, Math.min(leftPos, vw - tw - pad));

    let finalTop = top + height + pad;
    let transformY = "0";

    if (vh - finalTop < 250 || step.position === "top") {
      finalTop = top - pad;
      transformY = "-100%";
    }

    return { 
      top: `${finalTop}px`, 
      left: `${clampedLeft}px`, 
      transform: `translate(${transformX}, ${transformY})`, 
      position: "fixed" as const 
    };
  };

  if (!isActive || !step) return null;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
      {/* HIGHLIGHT LAYER & OVERLAY */}
      {targetElement && (
        <div 
          className="fixed transition-all duration-300 pointer-events-none"
          style={{
            top: highlightPosition.top - 12, 
            left: highlightPosition.left - 12, 
            width: highlightPosition.width + 24, 
            height: highlightPosition.height + 24, 
            borderRadius: step.targetSelector?.includes('input') ? '12px' : '50%',
            border: '4px solid hsl(var(--primary))',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)', 
            zIndex: 10001,
          }}
        >
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        </div>
      )}

      {/* TOOLTIP - Hộp thoại hướng dẫn */}
      <div 
        id="tour-tooltip"
        className="fixed transition-all duration-300 pointer-events-auto z-[10002]"
        style={getTooltipPosition()}
      >
        <Card className="shadow-2xl border-2 border-blue-200 bg-blue-50/95 dark:bg-slate-800 backdrop-blur-md w-[380px] max-w-[90vw]">
          <CardContent className="p-4 pt-5">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Bước {currentStep + 1}: {step.title}
                  </h3>
                  <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1.5 w-24 bg-blue-200" />
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -mt-1 -mr-1 hover:bg-blue-200/50" 
                  onClick={endTour}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-blue-950/80 dark:text-blue-100/80 leading-relaxed font-medium">
                {step.description}
              </p>
              
              <div className="flex justify-between items-center mt-2 border-t border-blue-200/50 pt-3">
                <span className="text-xs text-blue-900/60 dark:text-blue-100/60 font-semibold uppercase tracking-wider">
                  {currentStep + 1} / {totalSteps}
                </span>
                <span className="text-xs font-semibold text-primary animate-pulse">
                  Tương tác vùng sáng để tiếp tục
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};