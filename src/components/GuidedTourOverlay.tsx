import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "@/contexts/GuidedTourContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

  const step = getCurrentStep();

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Track route changes to detect when user leaves and returns
  useEffect(() => {
    if (isActive && !isPaused) {
      setSavedRoute(location.pathname);
      setHasLeftRoute(false);
    }
  }, [isActive, isPaused, location.pathname]);

  // Detect when user has left the route
  useEffect(() => {
    if (isActive && savedRoute && location.pathname !== savedRoute) {
      setHasLeftRoute(true);
    }
  }, [isActive, savedRoute, location.pathname]);

  // Show resume dialog when user returns to original route after leaving
  useEffect(() => {
    if (isPaused && hasLeftRoute && location.pathname === savedRoute && pausedStep !== null) {
      setShowResumeDialog(true);
      setHasLeftRoute(false);
    }
  }, [isPaused, hasLeftRoute, location.pathname, savedRoute, pausedStep]);

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

    // On mobile or center position, always show centered
    if (isMobile || step.position === "center") {
      return { 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        maxHeight: "80vh",
        overflowY: "auto" as const,
      };
    }

    if (!targetElement) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const { top, left, width, height } = highlightPosition;
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 448; // max-w-md = 28rem = 448px

    let position: { top?: string; left?: string; bottom?: string; right?: string; transform: string; maxHeight?: string; overflowY?: "auto" };

    switch (step.position) {
      case "top":
        // Check if tooltip fits above
        if (top - padding > 300) {
          position = {
            top: `${top - padding}px`,
            left: `${Math.max(padding, Math.min(left + width / 2, viewportWidth - tooltipWidth / 2 - padding))}px`,
            transform: "translate(-50%, -100%)",
          };
        } else {
          // Fall back to bottom
          position = {
            top: `${top + height + padding}px`,
            left: `${Math.max(padding, Math.min(left + width / 2, viewportWidth - tooltipWidth / 2 - padding))}px`,
            transform: "translate(-50%, 0)",
          };
        }
        break;
      case "bottom":
        // Check if tooltip fits below
        if (viewportHeight - (top + height + padding) > 300) {
          position = {
            top: `${top + height + padding}px`,
            left: `${Math.max(padding, Math.min(left + width / 2, viewportWidth - tooltipWidth / 2 - padding))}px`,
            transform: "translate(-50%, 0)",
          };
        } else {
          // Fall back to top
          position = {
            top: `${top - padding}px`,
            left: `${Math.max(padding, Math.min(left + width / 2, viewportWidth - tooltipWidth / 2 - padding))}px`,
            transform: "translate(-50%, -100%)",
          };
        }
        break;
      case "left":
        // Check if tooltip fits on left
        if (left - padding > tooltipWidth) {
          position = {
            top: `${Math.max(padding, Math.min(top + height / 2, viewportHeight - 200))}px`,
            left: `${left - padding}px`,
            transform: "translate(-100%, -50%)",
          };
        } else {
          // Fall back to right
          position = {
            top: `${Math.max(padding, Math.min(top + height / 2, viewportHeight - 200))}px`,
            left: `${left + width + padding}px`,
            transform: "translate(0, -50%)",
          };
        }
        break;
      case "right":
        // Check if tooltip fits on right
        if (viewportWidth - (left + width + padding) > tooltipWidth) {
          position = {
            top: `${Math.max(padding, Math.min(top + height / 2, viewportHeight - 200))}px`,
            left: `${left + width + padding}px`,
            transform: "translate(0, -50%)",
          };
        } else {
          // Fall back to left
          position = {
            top: `${Math.max(padding, Math.min(top + height / 2, viewportHeight - 200))}px`,
            left: `${left - padding}px`,
            transform: "translate(-100%, -50%)",
          };
        }
        break;
      default:
        position = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    // Ensure tooltip doesn't overflow viewport
    position.maxHeight = "80vh";
    position.overflowY = "auto";

    return position;
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
    
    // If allowed and step requires action, pause the tour before allowing interaction
    if (isAllowed && step.requiresAction) {
      // Save current route before pausing
      setSavedRoute(location.pathname);
      
      // Pause the tour to allow real action
      pauseTour();
      
      // Show toast notification
      toast({
        title: "Hướng dẫn đã tạm dừng",
        description: "Thực hiện hành động của bạn. Chúng tôi sẽ hỏi bạn có muốn tiếp tục sau khi hoàn tất.",
        duration: 3000,
      });
      
      // Allow the interaction to proceed
      return;
    }
    
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
        className="fixed z-[10000] w-[90vw] md:w-auto md:max-w-md p-4 md:p-6 shadow-2xl border-primary/50 bg-background"
        style={{
          ...getTooltipPosition(),
          pointerEvents: "auto",
        }}
      >
        <div className="space-y-3 md:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold text-foreground mb-1 break-words">
                {step.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground break-words">
                {step.description}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
              className="shrink-0 h-8 w-8 md:h-10 md:w-10"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
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
          <div className="space-y-1.5 md:space-y-2">
            <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
              <span>Bước {currentStep + 1}/{totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 md:h-2" />
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1 text-xs md:text-sm h-8 md:h-9"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Trước</span>
              <span className="sm:hidden">←</span>
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="flex-1 text-xs md:text-sm h-8 md:h-9"
            >
              <span className="hidden sm:inline">
                {currentStep === totalSteps - 1 ? "Hoàn thành" : "Tiếp theo"}
              </span>
              <span className="sm:hidden">
                {currentStep === totalSteps - 1 ? "✓" : "→"}
              </span>
              {currentStep !== totalSteps - 1 && <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1 hidden sm:inline" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="w-full text-[10px] md:text-xs h-7 md:h-8"
          >
            Bỏ qua hướng dẫn
          </Button>
        </div>
      </Card>

      {/* Resume Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent data-tour-ui className="z-[10001] w-[90vw] max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Tiếp tục hướng dẫn?</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Bạn đã tạm dừng hướng dẫn để thực hiện hành động. Bạn có muốn tiếp tục hướng dẫn từ bước đang dở không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={handleEndTour}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9"
            >
              Không, kết thúc
            </Button>
            <Button 
              onClick={handleResume}
              className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9"
            >
              Có, tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
