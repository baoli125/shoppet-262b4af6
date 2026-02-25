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

    // Mobile or center or no target → center
    if (isMobile || step.position === "center" || !targetElement) {
      return { ...fallback, maxHeight: "80vh", overflowY: "auto" as const };
    }

    const { top, left, width, height } = highlightPosition;
    const pad = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = 448;

    const clampX = (x: number) => `${Math.max(pad, Math.min(x, vw - tw / 2 - pad))}px`;

    switch (step.position) {
      case "top":
        return top > 300
          ? { top: `${top - pad}px`, left: clampX(left + width / 2), transform: "translate(-50%, -100%)" }
          : { top: `${top + height + pad}px`, left: clampX(left + width / 2), transform: "translate(-50%, 0)" };
      case "bottom":
        return vh - (top + height + pad) > 300
          ? { top: `${top + height + pad}px`, left: clampX(left + width / 2), transform: "translate(-50%, 0)" }
          : { top: `${top - pad}px`, left: clampX(left + width / 2), transform: "translate(-50%, -100%)" };
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

  return (
    <>
      {/* Single overlay with clip-path cutout */}
      {targetElement ? (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 pointer-events-auto"
          style={{
            clipPath: `polygon(
              0 0,
              100% 0,
              100% 100%,
              0 100%,
              0 ${hp.top - 4}px,
              ${hp.left - 4}px ${hp.top - 4}px,
              ${hp.left - 4}px ${hp.top + hp.height + 4}px,
              ${hp.left + hp.width + 4}px ${hp.top + hp.height + 4}px,
              ${hp.left + hp.width + 4}px ${hp.top - 4}px,
              0 ${hp.top - 4}px
            )`
          }}
          onClickCapture={blockUnallowedInteraction}
          onMouseDownCapture={blockUnallowedInteraction}
          onTouchStartCapture={blockUnallowedInteraction}
          onPointerDownCapture={blockUnallowedInteraction}
        />
      ) : (
        <div
          className="fixed inset-0 z-[9998] bg-black/60 pointer-events-auto"
          onClickCapture={blockUnallowedInteraction}
          onMouseDownCapture={blockUnallowedInteraction}
          onTouchStartCapture={blockUnallowedInteraction}
          onPointerDownCapture={blockUnallowedInteraction}
        />
      )}

      {/* Highlight border */}
      {targetElement && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${hp.top - 4}px`,
            left: `${hp.left - 4}px`,
            width: `${hp.width + 8}px`,
            height: `${hp.height + 8}px`,
            border: "4px solid hsl(var(--primary))",
            borderRadius: "12px",
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 30px hsl(var(--primary) / 0.5)",
            animation: "pulse 2s infinite",
          }}
        >
          <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-bounce" />
          <Sparkles className="absolute -bottom-3 -left-3 w-6 h-6 text-primary animate-bounce" style={{ animationDelay: "0.5s" }} />
        </div>
      )}

      {/* Tooltip */}
      <Card
        data-tour-ui
        className="fixed z-[10000] w-[90vw] md:w-auto md:max-w-md p-4 md:p-6 shadow-2xl border-primary/50 bg-background"
        style={{ ...getTooltipPosition(), pointerEvents: "auto" }}
      >
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line">{step.description}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={endTour} className="shrink-0 h-8 w-8">
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
              <span>Bước {currentStep + 1}/{totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 md:h-2" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousStep} disabled={currentStep === 0}
              className="flex-1 text-xs md:text-sm h-8 md:h-9">
              <ChevronLeft className="w-3 h-3 mr-1" /> Trước
            </Button>
            <Button size="sm" onClick={nextStep} className="flex-1 text-xs md:text-sm h-8 md:h-9">
              {currentStep === totalSteps - 1 ? "Hoàn thành" : "Tiếp theo"}
              {currentStep !== totalSteps - 1 && <ChevronRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={endTour}
            className="w-full text-[10px] md:text-xs h-7 md:h-8">
            Bỏ qua hướng dẫn
          </Button>
        </div>
      </Card>

      {/* Resume Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent data-tour-ui className="z-[10001] w-[90vw] max-w-md bg-background">
          <DialogHeader>
            <DialogTitle>Tiếp tục hướng dẫn?</DialogTitle>
            <DialogDescription>
              Bạn đã tạm dừng hướng dẫn. Bạn có muốn tiếp tục từ bước đang dở không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => { setShowResumeDialog(false); endTour(); }}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9">
              Không, kết thúc
            </Button>
            <Button onClick={() => { setShowResumeDialog(false); resumeTour(); }}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9">
              Có, tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
