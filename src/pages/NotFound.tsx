import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-3 sm:px-4">
      <div className="text-center max-w-md w-full">
        <div className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-6">🐾</div>
        <h1 className="mb-2 sm:mb-3 text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">404</h1>
        <p className="mb-1 text-lg sm:text-xl md:text-2xl text-muted-foreground font-semibold">Không tìm thấy trang</p>
        <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground px-4">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Button 
            onClick={() => navigate("/")}
            className="h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
          <Button 
            onClick={() => navigate("/marketplace")}
            variant="outline"
            className="h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
            size="lg"
          >
            <Search className="h-4 w-4 mr-2" />
            Xem sản phẩm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
