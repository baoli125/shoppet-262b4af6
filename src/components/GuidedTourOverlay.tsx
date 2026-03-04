import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  // 1. Kiểm tra Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Cập nhật vị trí Highlight (Sửa lỗi bị lệch khi scroll)
  const updatePosition = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setHighlightPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  // 3. Tìm phần tử Target với cơ chế thử lại (Retry)
  useEffect(() => {
    if (retryRef.current) clearInterval(retryRef.current);
    if (!isActive || !step?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const tryFind = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement;
      if (el) {
        setTargetElement(el);
        updatePosition(el);
        return true;
      }
      return false;
    };

    if (!tryFind()) {
      let attempts = 0;
      retryRef.current = setInterval(() => {
        attempts++;
        if (tryFind() || attempts > 15) {
          if (retryRef.current) clearInterval(retryRef.current);
        }
      }, 200);
    }

    return () => { if (retryRef.current) clearInterval(retryRef.current); };
  }, [isActive, step, currentStep, updatePosition]);

  // 4. Lắng nghe Scroll/Resize để update khung highlight liên tục
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
    };
  }, [isActive, targetElement, updatePosition]);

  // 5. Logic Nâng cao: Đẩy Z-Index cho các phần tử được phép tương tác (Dropdown, Menu)
  useEffect(() => {
    if (!isActive || !step) return;
    const boostedElements = new Map<HTMLElement, { origZIndex: string; origPosition: string }>();

    const scanAndBoost = () => {
      step.allowedInteractions?.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            const htmlEl = el as HTMLElement;
            if (boostedElements.has(htmlEl)) return;
            const computed = window.getComputedStyle(htmlEl);
            boostedElements.set(htmlEl, { origZIndex: htmlEl.style.zIndex, origPosition: htmlEl.style.position });
            htmlEl.style.zIndex = "10001";
            if (computed.position === "static") htmlEl.style.position = "relative";
          });
        } catch (e) {}
      });
    };

    scanAndBoost();
    const observer = new MutationObserver(scanAndBoost);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      boostedElements.forEach(({ origZIndex, origPosition }, el) => {
        el.style.zIndex = origZIndex;
        el.style.position = origPosition;
      });
    };
  }, [isActive, step, currentStep]);

  // 6. Theo dõi Route để Pause/Resume Tour
  useEffect(() => {
    if (isActive && !isPaused) {
      setSavedRoute(location.pathname);
      setHasLeftRoute(false);
    }
  }, [isActive, isPaused, location.pathname]);

  // 7. Tính toán vị trí Tooltip (SỬA LỖI CHE NỘI DUNG STEP 2 & 3)
  const getTooltipPosition = () => {
    const fallback = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    if (!step) return fallback;
    if (isMobile || step.position === "center" || !targetElement) return { ...fallback, maxHeight: "80vh", overflowY: "auto" };

    const { top, left, width, height } = highlightPosition;
    const pad = 16;
    const tw = 400; // Chiều rộng hộp thoại
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 1. Xử lý trục ngang (X) - Dời qua trái cho Step 2, 3
    let leftPos = left + width / 2;
    let transformX = "-50%";

    if (currentStep === 1 || currentStep === 2) {
      leftPos = left - 120; // Dời mạnh sang trái
      transformX = "0"; // Không căn giữa trục X nữa
    }
    
    // Ép không cho văng ra khỏi hai bên màn hình
    const clampedLeft = Math.max(pad, Math.min(leftPos, vw - tw - pad));

    // 2. Xử lý trục dọc (Y) - Tự động chống tràn đáy
    let finalTop = top + height + pad; // Mặc định hiển thị bên dưới vật thể
    let transformY = "0";

    // NẾU: Vị trí bên dưới vật thể sát với đáy màn hình quá (ít hơn 250px) 
    // HOẶC step.position được chỉ định cứng là "top"
    if (vh - finalTop < 250 || step.position === "top") {
      finalTop = top - pad; // Đẩy hộp thoại lên PHÍA TRÊN vật thể
      transformY = "-100%"; // Dịch ngược lên trên bằng chiều cao của chính nó
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
      {/* HIGHLIGHT CIRCLE/RECT */}
      {targetElement && (
        <div 
          className="fixed transition-all duration-300 pointer-events-none"
          style={{
            top: highlightPosition.top - 4,
            left: highlightPosition.left - 4,
            width: highlightPosition.width + 8,
            height: highlightPosition.height + 8,
            borderRadius: step.targetSelector?.includes('input') ? '8px' : '50%',
            border: '3px solid hsl(var(--primary))',
            boxShadow: '0 0 0 4px rgba(var(--primary), 0.2)',
            zIndex: 10001,
          }}
        >
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        </div>
      )}

      {/* GUIDED TEXT BOX */}
      <div className="fixed transition-all duration-300 pointer-events-auto" style={getTooltipPosition()}>
        <Card className="shadow-2xl border-2 border-blue-200 bg-blue-50/95 dark:bg-slate-800 backdrop-blur-md w-[380px] max-w-[90vw]">
          <CardContent className="p-4 pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    Bước {currentStep + 1}: {step.title}
                  </h3>
                  <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-1 w-24" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2" onClick={endTour}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                {step.description}
              </p>

              <div className="flex justify-between items-center mt-2 border-t pt-4">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {currentStep + 1} của {totalSteps}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={previousStep} disabled={currentStep === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                  </Button>
                  <Button size="sm" onClick={nextStep} className="px-4 shadow-lg shadow-primary/20">
                    {currentStep === totalSteps - 1 ? "Hoàn tất" : "Tiếp theo"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Dialog khi người dùng quay lại trang cũ */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tiếp tục hướng dẫn?</DialogTitle>
            <DialogDescription>
              Bạn vừa quay lại trang có hướng dẫn đang dở dang. Bạn có muốn tiếp tục từ bước {pausedStep! + 1} không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResumeDialog(false); endTour(); }}>Hủy tour</Button>
            <Button onClick={() => { setShowResumeDialog(false); resumeTour(); }}>Tiếp tục</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};