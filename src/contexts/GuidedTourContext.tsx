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

// Define all 25 steps
const GUIDED_STEPS: GuidedStep[] = [
  // === BƯỚC 1-3: CHATBOT ===
  {
    id: "step-1-chatbot-intro",
    title: "Trợ lý AI Thông Minh 🤖",
    description: "Đây là cổng vào trung tâm của Shoppet! Click để mở và khám phá 4 tính năng chính.",
    targetSelector: '[data-tour="chatbot"]',
    position: "left",
    allowedInteractions: ['[data-tour="chatbot"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-2-chatbot-features",
    title: "Các Tính Năng Của Trợ Lý AI",
    description: "🛍️ Khám phá Marketplace\n🤖 Hỏi Trợ lý AI\n📋 Quản lý Hồ sơ Thú cưng\n👥 Vào Cộng đồng\n\nTay nhỏ có thể làm mọi thứ!",
    targetSelector: '[data-tour="chatbot"]',
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-3-chatbot-close",
    title: "Đóng Chatbot",
    description: "Bạn có thể tắt chatbot ở đây khi cần. Hãy click để đóng lại.",
    targetSelector: '[data-tour="chatbot"]',
    position: "left",
    allowedInteractions: ['[data-tour="chatbot"]'],
    requiresAction: true,
    componentType: "ui",
  },

  // === BƯỚC 4-10: MARKETPLACE ===
  {
    id: "step-4-menu-dropdown",
    title: "Menu Chính",
    description: "Nếu bạn muốn xem chi tiết từng chức năng, hãy bấm vào đây",
    targetSelector: '[data-tour="user-dropdown"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-5-goto-marketplace",
    title: "Vào Marketplace",
    description: "Click để khám phá Marketplace - nơi mua sắm tất cả sản phẩm cho thú cưng!",
    targetSelector: '[data-tour="marketplace-menu"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="marketplace-menu"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-6-marketplace-search",
    title: "Chào mừng đến Marketplace! 🛍️",
    description: "Đây là nơi mua sắm tất cả sản phẩm cho thú cưng. Hãy bắt đầu với khung tìm kiếm.",
    targetSelector: '[data-tour="marketplace-search"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-7-marketplace-category",
    title: "Lọc theo Danh mục 📂",
    description: "Chọn danh mục để xem sản phẩm cụ thể: Thức ăn, Đồ chơi, Phụ kiện...",
    targetSelector: '[data-tour="marketplace-category"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-8-marketplace-pettype",
    title: "Lọc theo Loại Thú Cưng 🐕🐈",
    description: "Chọn loại thú cưng: Chó, Mèo, Chim, Cá...",
    targetSelector: '[data-tour="marketplace-pettype"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-9-marketplace-price",
    title: "Lọc theo Giá 💰",
    description: "Thiết lập khoảng giá phù hợp với ngân sách của bạn.",
    targetSelector: '[data-tour="marketplace-price"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-10-marketplace-product",
    title: "Sản Phẩm",
    description: "Đây là danh sách sản phẩm. Click vào bất kỳ sản phẩm nào để xem chi tiết!",
    targetSelector: '[data-tour="marketplace-product"]',
    position: "top",
    allowedInteractions: ['[data-tour="marketplace-product"]'],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 11-14: CHI TIẾT SẢN PHẨM & GIỎ HÀNG ===
  {
    id: "step-11-product-detail",
    title: "Chi Tiết Sản Phẩm 📦",
    description: "Xem thông tin chi tiết, giá cả, mô tả sản phẩm ở đây.",
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-12-add-to-cart",
    title: "Thêm Vào Giỏ Hàng 🛒",
    description: "Nhấn nút này để thêm sản phẩm vào giỏ hàng của bạn!",
    targetSelector: '[data-tour="add-to-cart"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="add-to-cart"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-13-cart-icon",
    title: "Biểu Tượng Giỏ Hàng",
    description: "Số lượng sản phẩm trong giỏ hàng sẽ hiển thị ở đây. Click để xem giỏ hàng!",
    targetSelector: '[data-tour="cart-icon"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="cart-icon"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-14-cart-overview",
    title: "Giỏ Hàng Của Bạn 🛒",
    description: "Đây là trang giỏ hàng. Bạn có thể xem tất cả sản phẩm đã chọn, điều chỉnh số lượng hoặc xóa sản phẩm.",
    targetSelector: '[data-tour="cart-container"]',
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 15-18: PETS (THÚ CƯNG) ===
  {
    id: "step-15-goto-pets",
    title: "Quản Lý Thú Cưng 🐾",
    description: "Bây giờ hãy xem trang quản lý thú cưng. Click vào menu và chọn 'Thú Cưng'.",
    targetSelector: '[data-tour="pets-menu"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]', '[data-tour="pets-menu"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-16-pets-overview",
    title: "Danh Sách Thú Cưng",
    description: "Đây là trang quản lý thú cưng. Bạn có thể thêm, sửa, xóa thông tin thú cưng của mình.",
    targetSelector: '[data-tour="pets-container"]',
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-17-add-pet",
    title: "Thêm Thú Cưng Mới ➕",
    description: "Nhấn nút này để thêm thông tin thú cưng của bạn: tên, tuổi, cân nặng, giống...",
    targetSelector: '[data-tour="add-pet"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="add-pet"]'],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-18-pet-health",
    title: "Theo Dõi Sức Khỏe 💊",
    description: "Bạn có thể theo dõi lịch sử tiêm chủng, khám bệnh của thú cưng tại đây.",
    targetSelector: '[data-tour="pet-health"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 19-21: ORDERS (ĐỌN HÀNG) ===
  {
    id: "step-19-goto-orders",
    title: "Đơn Hàng Của Tôi 📋",
    description: "Hãy xem trang đơn hàng. Click vào menu và chọn 'Đơn Hàng'.",
    targetSelector: '[data-tour="orders-menu"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]', '[data-tour="orders-menu"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-20-orders-overview",
    title: "Quản Lý Đơn Hàng",
    description: "Tại đây bạn có thể xem tất cả đơn hàng đã đặt, trạng thái giao hàng, lịch sử mua hàng.",
    targetSelector: '[data-tour="orders-container"]',
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-21-order-status",
    title: "Trạng Thái Đơn Hàng 📦",
    description: "Theo dõi trạng thái: Đang xử lý → Đã xác nhận → Đang giao → Đã giao.",
    targetSelector: '[data-tour="order-status"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 22-24: COMMUNITY & PROFILE ===
  {
    id: "step-22-goto-community",
    title: "Cộng Đồng Yêu Thú Cưng 👥",
    description: "Tham gia cộng đồng để chia sẻ, học hỏi kinh nghiệm nuôi thú cưng. Click vào 'Cộng Đồng'.",
    targetSelector: '[data-tour="community-menu"]',
    position: "bottom",
    allowedInteractions: ['[data-tour="user-dropdown"]', '[data-tour="community-menu"]'],
    requiresAction: true,
    componentType: "ui",
  },
  {
    id: "step-23-community-overview",
    title: "Khám Phá Cộng Đồng",
    description: "Đăng bài, like, comment, kết nối với những người yêu thú cưng khác!",
    position: "center",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },
  {
    id: "step-24-profile",
    title: "Hồ Sơ Cá Nhân 👤",
    description: "Cập nhật thông tin cá nhân, avatar, thông tin liên hệ tại đây.",
    targetSelector: '[data-tour="profile-menu"]',
    position: "bottom",
    allowedInteractions: [],
    requiresAction: false,
    componentType: "ui",
  },

  // === BƯỚC 25: KẾT THÚC ===
  {
    id: "step-25-complete",
    title: "Hoàn Thành Hướng Dẫn! 🎉",
    description: "Bạn đã hoàn thành hướng dẫn! Giờ bạn có thể tự do khám phá Shoppet. Chúc bạn có trải nghiệm tuyệt vời!",
    position: "center",
    allowedInteractions: [],
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
