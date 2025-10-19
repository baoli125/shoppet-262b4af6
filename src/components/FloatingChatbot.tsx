import { useState } from "react";
import { MessageSquare, X, ShoppingBag, Bot, PawPrint, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FloatingChatbotProps {
  user: User | null;
  isNewUser: boolean;
}

const FloatingChatbot = ({ user, isNewUser }: FloatingChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChatbotClick = () => {
    if (!user) {
      setShowLoginAlert(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginAlert(false);
    navigate("/");
  };

  const quickActions = [
    { icon: ShoppingBag, label: "Khám phá Marketplace", path: "/marketplace" },
    { icon: Bot, label: "Hỏi Trợ lý AI", path: "/ai-chat" },
    { icon: PawPrint, label: "Quản lý Hồ sơ Thú cưng", path: "/pets" },
    { icon: Users, label: "Vào Cộng đồng", path: "/community" },
  ];

  const handleQuickAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
            isNewUser,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleChatbotClick}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:scale-110 transition-transform z-50 bg-gradient-to-br from-primary to-primary/80"
        size="icon"
      >
        {isOpen ? (
          <X className="h-8 w-8" />
        ) : (
          <span className="text-4xl">🐾</span>
        )}
      </Button>

      {/* Login Alert Dialog */}
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vui lòng Đăng nhập</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng đăng nhập để sử dụng tính năng này
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>
              Đăng nhập
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <div>
                <h3 className="font-semibold">Tay Nhỏ</h3>
                <p className="text-xs opacity-90">Trợ lý ảo Shoppet</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground space-y-4">
                <p className="text-4xl mb-4">👋</p>
                {isNewUser ? (
                  <>
                    <p className="font-semibold">Chào mừng bạn đến với Shoppet!</p>
                    <p className="text-sm">
                      Tôi là Tay Nhỏ, tôi sẽ hướng dẫn bạn khám phá tất cả tính năng trên website.
                      Hãy hỏi tôi bất cứ điều gì!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Chúc bạn một ngày tốt lành!</p>
                    <p className="text-sm">
                      Nếu cần hỗ trợ gì, cứ nhấn vào tôi nhé! 🐾
                    </p>
                  </>
                )}
                
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-medium text-foreground">Truy cập nhanh:</p>
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => handleQuickAction(action.path)}
                    >
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default FloatingChatbot;
