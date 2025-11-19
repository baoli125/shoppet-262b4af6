import { useEffect, useState } from "react";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Import guide images
import chatbotGuideImage from "@/assets/chatbot-guide.png";
import cartEmptyGuide from "@/assets/cart-empty-guide.png";
import ordersEmptyGuide from "@/assets/orders-empty-guide.png";
import petsEmptyGuide from "@/assets/pets-empty-guide.png";

export const GuidedTourOverlay = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    isPaused,
    getCurrentStep,
    nextStep,
    previousStep,
    endTour,
    resumeTour,
  } = useGuidedTour();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const step = getCurrentStep();

  // Update target element when step changes
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(step.targetSelector) as HTMLElement;
    if (element) {
      setTargetElement(element);
      updateHighlightPosition(element);
    }

    const handleResize = () => {
      if (element) {
        updateHighlightPosition(element);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, step]);

  // Show resume dialog when paused
  useEffect(() => {
    if (isPaused) {
      setShowResumeDialog(true);
    }
  }, [isPaused]);

  const updateHighlightPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setHighlightPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
  };

  const getTooltipPosition = () => {
    if (!step) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    if (step.position === "center") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    if (!targetElement) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const { top, left, width, height } = highlightPosition;
    const padding = 20;

    switch (step.position) {
      case "top":
        return {
          top: `${top - padding}px`,
          left: `${left + width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${top + height + padding}px`,
          left: `${left + width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${top + height / 2}px`,
          left: `${left - padding}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${top + height / 2}px`,
          left: `${left + width + padding}px`,
          transform: "translate(0, -50%)",
        };
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
  };

  const getGuideImage = () => {
    if (!step) return null;

    switch (step.id) {
      case "step-2-chatbot-features":
        return chatbotGuideImage;
      case "step-14-cart-overview":
        return cartEmptyGuide;
      case "step-16-pets-overview":
        return petsEmptyGuide;
      case "step-20-orders-overview":
        return ordersEmptyGuide;
      default:
        return null;
    }
  };

  const handleNext = () => {
    nextStep();
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSkip = () => {
    endTour();
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    resumeTour();
  };

  const handleEndTour = () => {
    setShowResumeDialog(false);
    endTour();
  };

  const blockUnallowedInteraction = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLElement;
    
    // Always allow interactions with tour UI
    if (target.closest('[data-tour-ui]')) {
      return;
    }
    
    // Check if the target or any of its parents match allowed selectors
    const isAllowed = step.allowedInteractions.some(selector => {
      try {
        return target.closest(selector) !== null;
      } catch (err) {
        console.warn(`Invalid selector: ${selector}`);
        return false;
      }
    });
    
    // Block interaction if not allowed
    if (!isAllowed) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (!isActive || !step) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const guideImage = getGuideImage();

  return (
    <>
      {/* Blocking Overlay - Prevents all interactions except allowed ones */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        style={{ pointerEvents: "auto" }}
        onClickCapture={(e) => blockUnallowedInteraction(e)}
        onMouseDownCapture={(e) => blockUnallowedInteraction(e)}
        onMouseUpCapture={(e) => blockUnallowedInteraction(e)}
        onTouchStartCapture={(e) => blockUnallowedInteraction(e)}
        onTouchEndCapture={(e) => blockUnallowedInteraction(e)}
        onPointerDownCapture={(e) => blockUnallowedInteraction(e)}
        onPointerUpCapture={(e) => blockUnallowedInteraction(e)}
        onContextMenuCapture={(e) => blockUnallowedInteraction(e)}
      />

      {/* Highlight area */}
      {targetElement && (
        <>
          {/* Top overlay */}
          <div
            className="fixed z-[9999] bg-black/60 backdrop-blur-sm pointer-events-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${highlightPosition.top}px`,
            }}
          />
          {/* Bottom overlay */}
          <div
            className="fixed z-[9999] bg-black/60 backdrop-blur-sm pointer-events-none"
            style={{
              top: `${highlightPosition.top + highlightPosition.height}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left overlay */}
          <div
            className="fixed z-[9999] bg-black/60 backdrop-blur-sm pointer-events-none"
            style={{
              top: `${highlightPosition.top}px`,
              left: 0,
              width: `${highlightPosition.left}px`,
              height: `${highlightPosition.height}px`,
            }}
          />
          {/* Right overlay */}
          <div
            className="fixed z-[9999] bg-black/60 backdrop-blur-sm pointer-events-none"
            style={{
              top: `${highlightPosition.top}px`,
              left: `${highlightPosition.left + highlightPosition.width}px`,
              right: 0,
              height: `${highlightPosition.height}px`,
            }}
          />
          
          {/* Highlight border - allows pointer events through */}
          <div
            className="fixed z-[9999]"
            style={{
              top: `${highlightPosition.top - 4}px`,
              left: `${highlightPosition.left - 4}px`,
              width: `${highlightPosition.width + 8}px`,
              height: `${highlightPosition.height + 8}px`,
              border: "4px solid hsl(var(--primary))",
              borderRadius: "12px",
              boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 30px hsl(var(--primary) / 0.5)",
              animation: "pulse 2s infinite",
              pointerEvents: "none",
            }}
          >
            {/* Sparkle effects */}
            <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-bounce" />
            <Sparkles className="absolute -bottom-3 -left-3 w-6 h-6 text-primary animate-bounce" style={{ animationDelay: "0.5s" }} />
          </div>
        </>
      )}

      {/* Tooltip Card */}
      <Card
        data-tour-ui
        className="fixed z-[10000] w-[90vw] max-w-md p-6 shadow-2xl border-primary/50"
        style={{
          ...getTooltipPosition(),
          pointerEvents: "auto",
        }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1 whitespace-pre-line">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {step.description}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Guide Image if available */}
          {guideImage && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={guideImage}
                alt="Hướng dẫn"
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bước {currentStep + 1}/{totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === totalSteps - 1 ? "Hoàn thành" : "Tiếp theo"}
              {currentStep !== totalSteps - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="w-full text-xs"
          >
            Bỏ qua hướng dẫn
          </Button>
        </div>
      </Card>

      {/* Resume Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent data-tour-ui className="z-[10001]">
          <DialogHeader>
            <DialogTitle>Tiếp tục hướng dẫn?</DialogTitle>
            <DialogDescription>
              Bạn đã tạm dừng hướng dẫn để thực hiện hành động. Bạn có muốn tiếp tục hướng dẫn từ bước đang dở không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleEndTour}>
              Không, kết thúc
            </Button>
            <Button onClick={handleResume}>
              Có, tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
