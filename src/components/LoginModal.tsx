import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  message?: string;
}

const LoginModal = ({ isOpen, onClose, onLoginClick, message }: LoginModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Đăng nhập để tiếp tục
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            {message || "Vui lòng đăng nhập để sử dụng tính năng này"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onLoginClick}
            className="btn-solid-blue w-full"
            size="lg"
          >
            Đăng nhập ngay
          </Button>
          <Button 
            onClick={onClose}
            variant="outline"
            size="lg"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
