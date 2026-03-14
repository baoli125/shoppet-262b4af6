import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "vi";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};

const translations = {
  vi: {
    common: {
      search: "Tìm kiếm",
      filter: "Lọc",
      all: "Tất cả",
      save: "Lưu",
      cancel: "Hủy",
      delete: "Xóa",
      edit: "Chỉnh sửa",
      add: "Thêm",
      back: "Quay lại",
      loading: "Đang tải...",
      noResults: "Không tìm thấy kết quả",
      error: "Lỗi",
      success: "Thành công",
    },
    header: {
      home: "Trang Chủ",
      about: "Giới Thiệu",
      login: "Đăng nhập",
      register: "Đăng ký",
      logout: "Đăng xuất",
      cart: "Giỏ hàng",
      language: "Ngôn ngữ",
      marketplace: "Marketplace",
      aiChat: "Trợ lý AI",
      pets: "Hồ sơ Thú cưng",
      community: "Cộng đồng",
      orders: "Đơn hàng",
      account: "Tài khoản",
      sellerDashboard: "Seller Dashboard",
    },
    marketplace: {
      title: "Marketplace",
      subtitle: "Sản phẩm chất lượng cho thú cưng",
      searchPlaceholder: "Tìm kiếm sản phẩm...",
      category: "Danh mục",
      petType: "Loại thú cưng",
      allCategories: "Tất cả danh mục",
      allPets: "Tất cả",
      noProducts: "Không tìm thấy sản phẩm",
      noProductsDesc: "Thử điều chỉnh bộ lọc hoặc tìm kiếm khác",
      addToCart: "Thêm vào giỏ",
      stock: "Còn",
      loginRequired: "Vui lòng đăng nhập",
      loginRequiredDesc: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng",
      addedToCart: "Đã thêm vào giỏ hàng! 🛒",
      categories: {
        food: "Thức ăn",
        toy: "Đồ chơi",
        accessory: "Phụ kiện",
        medicine: "Thuốc",
        grooming: "Vệ sinh",
        other: "Khác",
      },
      petTypes: {
        dog: "🐕 Chó",
        cat: "🐈 Mèo",
        bird: "🦜 Chim",
        fish: "🐠 Cá",
        other: "🐾 Khác",
      },
    },
    aiChat: {
      title: "Trợ lý AI PurriPaws",
      subtitle: "Tư vấn sức khỏe & dinh dưỡng 24/7",
      welcome: "Xin chào! Tôi là trợ lý AI của PurriPaws",
      welcomeDesc:
        "Tôi có thể giúp bạn tư vấn về sức khỏe, dinh dưỡng, và chăm sóc thú cưng. Hãy hỏi tôi bất cứ điều gì!",
      placeholder: "Hỏi về sức khỏe thú cưng...",
      tip: "💡 Mẹo: Cung cấp thông tin về loài, tuổi, cân nặng để nhận tư vấn chính xác hơn",
      suggestions: [
        "Con mèo của tôi bị tiêu chảy phải làm sao?",
        "Chó con 2 tháng tuổi nên ăn gì?",
        "Lịch tiêm phòng cho chó như thế nào?",
        "Cách huấn luyện mèo đi vệ sinh đúng chỗ",
      ],
    },
    pets: {
      title: "Hồ sơ Thú cưng",
      subtitle: "Quản lý thông tin và sức khỏe thú cưng",
      addPet: "Thêm thú cưng",
      editPet: "Chỉnh sửa thú cưng",
      addPetNew: "Thêm thú cưng mới",
      noPets: "Chưa có thú cưng nào",
      noPetsDesc: "Thêm thú cưng đầu tiên để bắt đầu quản lý sức khỏe của bạn ấy",
      name: "Tên thú cưng",
      nickname: "Tên thân mật",
      type: "Loài",
      breed: "Giống",
      gender: "Giới tính",
      birthDate: "Ngày sinh",
      weight: "Cân nặng (kg)",
      notes: "Ghi chú",
      uploadImage: "Tải ảnh lên",
      petImage: "Ảnh thú cưng",
      genders: {
        male: "Đực",
        female: "Cái",
        unknown: "Chưa rõ",
      },
      addSuccess: "Thêm thú cưng thành công! 🐾",
      updateSuccess: "Cập nhật thành công!",
      deleteConfirm: "Bạn có chắc muốn xóa thú cưng này?",
      deleted: "Đã xóa thú cưng",
      saving: "Đang lưu...",
      update: "Cập nhật",
      addNew: "Thêm mới",
      age: {
        years: "tuổi",
        months: "tháng",
        underMonth: "Dưới 1 tháng",
      },
    },
    community: {
      title: "Cộng đồng PurriPaws 🐾",
      createPost: "Chia sẻ điều gì đó với cộng đồng...",
      post: "Đăng bài",
      addImage: "Thêm ảnh",
      posted: "Đã đăng! 🎉",
      postedDesc: "Bài viết của bạn đã được chia sẻ với cộng đồng.",
      noPosts: "Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!",
      deleted: "Đã xóa",
      deletedDesc: "Bài viết đã được xóa thành công.",
      contentError: "Lỗi nội dung",
    },
    hero: {
      slide1: {
        title: "Chăm sóc thú cưng của bạn với tình yêu thương",
        subtitle: "Khám phá các sản phẩm và dịch vụ tốt nhất cho người bạn bốn chân của bạn",
        cta: "Khám phá ngay",
      },
      slide2: {
        title: "Trợ lý AI thông minh",
        subtitle: "Nhận tư vấn sức khỏe và dinh dưỡng cho thú cưng từ AI",
        cta: "Trò chuyện ngay",
      },
      slide3: {
        title: "Cộng đồng yêu thú cưng",
        subtitle: "Kết nối với những người yêu thú cưng khác và chia sẻ kinh nghiệm",
        cta: "Tham gia ngay",
      },
    },
    about: {
      title: "Về PurriPaws",
      subtitle: "Nền tảng toàn diện dành cho người yêu thú cưng tại Việt Nam",
      marketplace: {
        title: "Marketplace",
        description: "Mua sắm sản phẩm & đặt dịch vụ chất lượng cao",
      },
      aiAssistant: {
        title: "AI Assistant",
        description: "Tư vấn thông minh 24/7 về sức khỏe & dinh dưỡng",
      },
      petProfiles: {
        title: "Pet Profiles",
        description: "Quản lý hồ sơ sức khỏe thú cưng của bạn",
      },
      community: {
        title: "Community",
        description: "Cộng đồng sôi động với hàng nghìn thành viên",
      },
    },
    footer: {
      description: "Nền tảng chăm sóc thú cưng toàn diện, kết hợp công nghệ AI và cộng đồng người yêu thú cưng.",
      quickLinks: "Liên kết nhanh",
      followUs: "Theo dõi chúng tôi",
      allRightsReserved: "Bảo lưu mọi quyền",
    },
    chatbot: {
      title: "Tay Nhỏ",
      subtitle: "Trợ lý ảo PurriPaws",
      welcomeNew: "Chào mừng bạn đến với PurriPaws!",
      welcomeNewDesc:
        "Tôi là Tay Nhỏ, tôi sẽ hướng dẫn bạn khám phá tất cả tính năng trên website. Hãy hỏi tôi bất cứ điều gì!",
      welcomeBack: "👋 Chúc bạn một ngày tốt lành!",
      welcomeBackDesc: "Nếu cần hỗ trợ gì, cứ nhấn vào tôi nhé! 🐾",
      exploreMarketplace: "Khám phá Marketplace",
      askAI: "Hỏi Trợ lý AI",
      managePets: "Quản lý Hồ sơ Thú cưng",
      joinCommunity: "Vào Cộng đồng",
      placeholder: "Nhập tin nhắn...",
      loginRequired: "Vui lòng Đăng nhập",
      loginRequiredDesc: "Vui lòng đăng nhập để sử dụng tính năng này",
      close: "Đóng",
      error: "Lỗi",
      errorDesc: "Không thể gửi tin nhắn. Vui lòng thử lại.",
    },
    onboarding: {
      welcome: "Chào mừng đến với PurriPaws!",
      description: "Hãy cho chúng tôi biết về bạn để có trải nghiệm tốt nhất",
      petOwner: "Tôi là người mới",
      petOwnerDesc: "Hướng dẫn tôi khám phá PurriPaws",
      seller: "Tôi đã quen rồi",
      sellerDesc: "Tôi muốn tự khám phá",
      both: "Cả hai",
      bothDesc: "Tôi vừa nuôi thú cưng vừa muốn bán hàng",
      continue: "Tiếp tục",
      skip: "Bỏ qua",
    },
  },
  en: {
    common: {
      search: "Search",
      filter: "Filter",
      all: "All",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      back: "Back",
      loading: "Loading...",
      noResults: "No results found",
      error: "Error",
      success: "Success",
    },
    header: {
      home: "Home",
      about: "About",
      login: "Login",
      register: "Register",
      logout: "Logout",
      cart: "Cart",
      language: "Language",
      marketplace: "Marketplace",
      aiChat: "AI Assistant",
      pets: "Pet Profiles",
      community: "Community",
      orders: "Orders",
      account: "Account",
      sellerDashboard: "Seller Dashboard",
    },
    marketplace: {
      title: "Marketplace",
      subtitle: "Quality products for your pets",
      searchPlaceholder: "Search products...",
      category: "Category",
      petType: "Pet Type",
      allCategories: "All categories",
      allPets: "All",
      noProducts: "No products found",
      noProductsDesc: "Try adjusting your filters or search",
      addToCart: "Add to cart",
      stock: "In stock",
      loginRequired: "Please login",
      loginRequiredDesc: "You need to login to add products to cart",
      addedToCart: "Added to cart! 🛒",
      categories: {
        food: "Food",
        toy: "Toys",
        accessory: "Accessories",
        medicine: "Medicine",
        grooming: "Grooming",
        other: "Other",
      },
      petTypes: {
        dog: "🐕 Dog",
        cat: "🐈 Cat",
        bird: "🦜 Bird",
        fish: "🐠 Fish",
        other: "🐾 Other",
      },
    },
    aiChat: {
      title: "PurriPaws AI Assistant",
      subtitle: "Health & nutrition advice 24/7",
      welcome: "Hello! I'm PurriPaws's AI assistant",
      welcomeDesc: "I can help you with pet health, nutrition, and care advice. Ask me anything!",
      placeholder: "Ask about pet health...",
      tip: "💡 Tip: Provide species, age, and weight information for more accurate advice",
      suggestions: [
        "My cat has diarrhea, what should I do?",
        "What should a 2-month-old puppy eat?",
        "What is the vaccination schedule for dogs?",
        "How to litter train a cat?",
      ],
    },
    pets: {
      title: "Pet Profiles",
      subtitle: "Manage your pet information and health",
      addPet: "Add Pet",
      editPet: "Edit Pet",
      addPetNew: "Add New Pet",
      noPets: "No pets yet",
      noPetsDesc: "Add your first pet to start managing their health",
      name: "Pet name",
      nickname: "Nickname",
      type: "Species",
      breed: "Breed",
      gender: "Gender",
      birthDate: "Birth date",
      weight: "Weight (kg)",
      notes: "Notes",
      uploadImage: "Upload photo",
      petImage: "Pet photo",
      genders: {
        male: "Male",
        female: "Female",
        unknown: "Unknown",
      },
      addSuccess: "Pet added successfully! 🐾",
      updateSuccess: "Updated successfully!",
      deleteConfirm: "Are you sure you want to delete this pet?",
      deleted: "Pet deleted",
      saving: "Saving...",
      update: "Update",
      addNew: "Add New",
      age: {
        years: "years old",
        months: "months old",
        underMonth: "Under 1 month",
      },
    },
    community: {
      title: "PurriPaws Community 🐾",
      createPost: "Share something with the community...",
      post: "Post",
      addImage: "Add image",
      posted: "Posted! 🎉",
      postedDesc: "Your post has been shared with the community.",
      noPosts: "No posts yet. Be the first to share!",
      deleted: "Deleted",
      deletedDesc: "Post has been deleted successfully.",
      contentError: "Content error",
    },
    hero: {
      slide1: {
        title: "Care for your pets with love",
        subtitle: "Discover the best products and services for your furry friends",
        cta: "Explore Now",
      },
      slide2: {
        title: "Smart AI Assistant",
        subtitle: "Get health and nutrition advice for your pets from AI",
        cta: "Chat Now",
      },
      slide3: {
        title: "Pet Lover Community",
        subtitle: "Connect with other pet lovers and share experiences",
        cta: "Join Now",
      },
    },
    about: {
      title: "About PurriPaws",
      subtitle: "Comprehensive platform for pet lovers in Vietnam",
      marketplace: {
        title: "Marketplace",
        description: "Shop high-quality products & book services",
      },
      aiAssistant: {
        title: "AI Assistant",
        description: "Smart 24/7 health & nutrition advice",
      },
      petProfiles: {
        title: "Pet Profiles",
        description: "Manage your pet's health records",
      },
      community: {
        title: "Community",
        description: "Vibrant community with thousands of members",
      },
    },
    footer: {
      description: "Comprehensive pet care platform combining AI technology and pet lover community.",
      quickLinks: "Quick Links",
      followUs: "Follow Us",
      allRightsReserved: "All rights reserved",
    },
    chatbot: {
      title: "Tay Nhỏ",
      subtitle: "PurriPaws Virtual Assistant",
      welcomeNew: "Welcome to PurriPaws!",
      welcomeNewDesc: "I'm Tay Nhỏ, I'll guide you through all the features. Ask me anything!",
      welcomeBack: "Have a great day!",
      welcomeBackDesc: "If you need any help, just click on me! 🐾",
      quickAccess: "Quick Access:",
      exploreMarketplace: "Explore Marketplace",
      askAI: "Ask AI Assistant",
      managePets: "Manage Pet Profiles",
      joinCommunity: "Join Community",
      placeholder: "Type a message...",
      loginRequired: "Please Login",
      loginRequiredDesc: "Please login to use this feature",
      close: "Close",
      error: "Error",
      errorDesc: "Unable to send message. Please try again.",
    },
    onboarding: {
      welcome: "Welcome to PurriPaws!",
      description: "Tell us about yourself for the best experience",
      petOwner: "I'm new here",
      petOwnerDesc: "Guide me through PurriPaws",
      seller: "I'm familiar",
      sellerDesc: "I want to explore on my own",
      both: "Both",
      bothDesc: "I have pets and want to sell products",
      continue: "Continue",
      skip: "Skip",
    },
  },
};
