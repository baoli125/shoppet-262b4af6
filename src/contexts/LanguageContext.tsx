import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'vi';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  vi: {
    header: {
      home: 'Trang Chủ',
      about: 'Giới Thiệu',
      login: 'Đăng nhập',
      register: 'Đăng ký',
      logout: 'Đăng xuất',
      cart: 'Giỏ hàng',
      language: 'Ngôn ngữ',
      marketplace: 'Marketplace',
      aiChat: 'Trợ lý AI',
      pets: 'Hồ sơ Thú cưng',
      community: 'Cộng đồng',
      orders: 'Đơn hàng',
      account: 'Tài khoản',
      sellerDashboard: 'Seller Dashboard',
    },
    hero: {
      slide1: {
        title: 'Chăm sóc thú cưng của bạn với tình yêu thương',
        subtitle: 'Khám phá các sản phẩm và dịch vụ tốt nhất cho người bạn bốn chân của bạn',
        cta: 'Khám phá ngay',
      },
      slide2: {
        title: 'Trợ lý AI thông minh',
        subtitle: 'Nhận tư vấn sức khỏe và dinh dưỡng cho thú cưng từ AI',
        cta: 'Trò chuyện ngay',
      },
      slide3: {
        title: 'Cộng đồng yêu thú cưng',
        subtitle: 'Kết nối với những người yêu thú cưng khác và chia sẻ kinh nghiệm',
        cta: 'Tham gia ngay',
      },
    },
    about: {
      title: 'Về Shoppet',
      subtitle: 'Nền tảng toàn diện cho người yêu thú cưng',
      marketplace: {
        title: 'Marketplace',
        description: 'Mua sắm thực phẩm, phụ kiện và dịch vụ chăm sóc thú cưng chất lượng cao',
      },
      aiAssistant: {
        title: 'Trợ lý AI',
        description: 'Nhận tư vấn sức khỏe và dinh dưỡng thông minh từ trợ lý AI của chúng tôi',
      },
      petProfiles: {
        title: 'Hồ sơ Thú cưng',
        description: 'Quản lý hồ sơ sức khỏe, tiêm chủng và lịch hẹn của thú cưng',
      },
      community: {
        title: 'Cộng đồng',
        description: 'Kết nối với những người yêu thú cưng, chia sẻ câu chuyện và học hỏi',
      },
    },
    footer: {
      description: 'Nền tảng toàn diện dành cho người yêu thú cưng',
      quickLinks: 'Liên kết nhanh',
      followUs: 'Theo dõi chúng tôi',
      allRightsReserved: 'Bảo lưu mọi quyền',
    },
    chatbot: {
      title: 'Tay Nhỏ',
      subtitle: 'Trợ lý ảo Shoppet',
      welcomeNew: 'Chào mừng bạn đến với Shoppet!',
      welcomeNewDesc: 'Tôi là Tay Nhỏ, tôi sẽ hướng dẫn bạn khám phá tất cả tính năng trên website. Hãy hỏi tôi bất cứ điều gì!',
      welcomeBack: 'Chúc bạn một ngày tốt lành!',
      welcomeBackDesc: 'Nếu cần hỗ trợ gì, cứ nhấn vào tôi nhé! 🐾',
      quickAccess: 'Truy cập nhanh:',
      exploreMarketplace: 'Khám phá Marketplace',
      askAI: 'Hỏi Trợ lý AI',
      managePets: 'Quản lý Hồ sơ Thú cưng',
      joinCommunity: 'Vào Cộng đồng',
      placeholder: 'Nhập tin nhắn...',
      loginRequired: 'Vui lòng Đăng nhập',
      loginRequiredDesc: 'Vui lòng đăng nhập để sử dụng tính năng này',
      close: 'Đóng',
      error: 'Lỗi',
      errorDesc: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
    },
    onboarding: {
      welcome: 'Chào mừng đến với Shoppet!',
      description: 'Bạn là:',
      petOwner: 'Người nuôi thú cưng',
      petOwnerDesc: 'Tôi đang tìm kiếm sản phẩm và dịch vụ cho thú cưng của mình',
      seller: 'Người bán hàng',
      sellerDesc: 'Tôi muốn bán sản phẩm hoặc dịch vụ cho thú cưng',
      both: 'Cả hai',
      bothDesc: 'Tôi vừa nuôi thú cưng vừa muốn bán hàng',
      continue: 'Tiếp tục',
      skip: 'Bỏ qua',
    },
  },
  en: {
    header: {
      home: 'Home',
      about: 'About',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      cart: 'Cart',
      language: 'Language',
      marketplace: 'Marketplace',
      aiChat: 'AI Assistant',
      pets: 'Pet Profiles',
      community: 'Community',
      orders: 'Orders',
      account: 'Account',
      sellerDashboard: 'Seller Dashboard',
    },
    hero: {
      slide1: {
        title: 'Care for your pets with love',
        subtitle: 'Discover the best products and services for your furry friends',
        cta: 'Explore Now',
      },
      slide2: {
        title: 'Smart AI Assistant',
        subtitle: 'Get health and nutrition advice for your pets from AI',
        cta: 'Chat Now',
      },
      slide3: {
        title: 'Pet Lover Community',
        subtitle: 'Connect with other pet lovers and share experiences',
        cta: 'Join Now',
      },
    },
    about: {
      title: 'About Shoppet',
      subtitle: 'Comprehensive platform for pet lovers',
      marketplace: {
        title: 'Marketplace',
        description: 'Shop high-quality pet food, accessories, and care services',
      },
      aiAssistant: {
        title: 'AI Assistant',
        description: 'Get smart health and nutrition advice from our AI assistant',
      },
      petProfiles: {
        title: 'Pet Profiles',
        description: 'Manage your pet\'s health records, vaccinations, and appointments',
      },
      community: {
        title: 'Community',
        description: 'Connect with pet lovers, share stories, and learn together',
      },
    },
    footer: {
      description: 'Comprehensive platform for pet lovers',
      quickLinks: 'Quick Links',
      followUs: 'Follow Us',
      allRightsReserved: 'All rights reserved',
    },
    chatbot: {
      title: 'Tay Nhỏ',
      subtitle: 'Shoppet Virtual Assistant',
      welcomeNew: 'Welcome to Shoppet!',
      welcomeNewDesc: 'I\'m Tay Nhỏ, I\'ll guide you through all the features on the website. Ask me anything!',
      welcomeBack: 'Have a great day!',
      welcomeBackDesc: 'If you need any help, just click on me! 🐾',
      quickAccess: 'Quick Access:',
      exploreMarketplace: 'Explore Marketplace',
      askAI: 'Ask AI Assistant',
      managePets: 'Manage Pet Profiles',
      joinCommunity: 'Join Community',
      placeholder: 'Type a message...',
      loginRequired: 'Please Login',
      loginRequiredDesc: 'Please login to use this feature',
      close: 'Close',
      error: 'Error',
      errorDesc: 'Unable to send message. Please try again.',
    },
    onboarding: {
      welcome: 'Welcome to Shoppet!',
      description: 'You are:',
      petOwner: 'Pet Owner',
      petOwnerDesc: 'I\'m looking for products and services for my pets',
      seller: 'Seller',
      sellerDesc: 'I want to sell pet products or services',
      both: 'Both',
      bothDesc: 'I have pets and want to sell products',
      continue: 'Continue',
      skip: 'Skip',
    },
  },
};
