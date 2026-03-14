import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// Step structure
export interface GuidedStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector để highlight element
  position: "top" | "bottom" | "left" | "right" | "center";
  allowedInteractions: string[]; // CSS selectors của các element được phép tương tác
  requiresAction?: boolean; // true nếu cần user thực hiện action để next
  componentType?: "ui" | "image"; // ui = dùng component thật, image = dùng ảnh
}

interface GuidedTourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isPaused: boolean;
  pausedStep: number | null;
  
  // Actions
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  jumpToStep: (step: number) => void;
  pauseTour: () => void;
  resumeTour: () => void;
  
  // Getters
  getCurrentStep: () => GuidedStep | null;
  isInteractionAllowed: (selector: string) => boolean;
}

const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined);

// Define 4 steps
const GUIDED_STEPS: GuidedStep[] = [
  // === BƯỚC 1: CHATBOT AI ===
  {
    id: "step-1-chatbot-intro",
    title: "Trợ lý AI Thông Minh 🤖",
    description: "Đây là trợ lý AI của PurriPaws! Bạn có thể hỏi về thú cưng, tìm sản phẩm, hoặc nhận tư vấn chăm sóc. Hãy thử click vào để khám phá!",
    targetSelector: '[data-tour="chatbot"]',
    position: "left",
    allowedInteractions: ['[data-tour="chatbot"]'],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 2: DROPDOWN MENU ===
  {
    id: "step-2-menu-dropdown",
    title: "Menu Chính 📋",
    description: "Tại đây bạn có thể truy cập tất cả chức năng: Thú cưng, Đơn hàng, Cộng đồng, Hồ sơ cá nhân và nhiều hơn nữa!",
    targetSelector: '[data-tour="user-dropdown"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]'],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 3: MARKETPLACE ===
  {
    id: "step-3-marketplace",
    title: "Marketplace 🛍️",
    description: "Khám phá hàng trăm sản phẩm cho thú cưng! Tìm kiếm, lọc theo danh mục, loại thú cưng và giá cả phù hợp.",
    targetSelector: '[data-tour="marketplace-menu"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]', '[data-tour="marketplace-menu"]'],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 4: GIỎ HÀNG ===
  {
    id: "step-4-cart",
    title: "Giỏ Hàng 🛒",
    description: "Sản phẩm bạn chọn mua sẽ nằm ở đây. Click vào biểu tượng giỏ hàng để xem và thanh toán!",
    targetSelector: '[data-tour="cart-icon"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="cart-icon"]'],
    requiresAction: false,
    componentType: "ui",
  },
];

export const GuidedTourProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedStep, setPausedStep] = useState<number | null>(null);

  const totalSteps = GUIDED_STEPS.length;

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setIsPaused(false);
    setPausedStep(null);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setIsPaused(false);
    setPausedStep(null);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, totalSteps, endTour]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const jumpToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const pauseTour = useCallback(() => {
    setPausedStep(currentStep);
    setIsPaused(true);
    setIsActive(false);
  }, [currentStep]);

  const resumeTour = useCallback(() => {
    if (pausedStep !== null) {
      setCurrentStep(pausedStep);
      setIsActive(true);
      setIsPaused(false);
    }
  }, [pausedStep]);

  const getCurrentStep = useCallback(() => {
    return GUIDED_STEPS[currentStep] || null;
  }, [currentStep]);

  const isInteractionAllowed = useCallback((selector: string) => {
    if (!isActive) return true; // Nếu tour không active, cho phép tất cả
    
    const step = GUIDED_STEPS[currentStep];
    if (!step) return false;
    
    // Kiểm tra xem selector có trong allowedInteractions không
    return step.allowedInteractions.some(allowed => {
      const element = document.querySelector(selector);
      return element?.matches(allowed);
    });
  }, [isActive, currentStep]);

  const value: GuidedTourContextType = {
    isActive,
    currentStep,
    totalSteps,
    isPaused,
    pausedStep,
    startTour,
    endTour,
    nextStep,
    previousStep,
    jumpToStep,
    pauseTour,
    resumeTour,
    getCurrentStep,
    isInteractionAllowed,
  };

  return (
    <GuidedTourContext.Provider value={value}>
      {children}
    </GuidedTourContext.Provider>
  );
};

export const useGuidedTour = () => {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error("useGuidedTour must be used within GuidedTourProvider");
  }
  return context;
};
