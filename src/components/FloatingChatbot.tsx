import { useState, useEffect } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import type { User } from "@supabase/supabase-js";
import pawHandIcon from "@/assets/paw-hand-icon.png";

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
  const { t } = useLanguage();

  const quickSuggestions: string[] = [];

  // Reset chatbot state when user logs out
  useEffect(() => {
    if (!user) {
      // User logged out - reset all state
      setIsOpen(false);
      setMessages([]);
      setInput("");
      setIsLoading(false);
      setShowLoginAlert(false);
      console.log("Chatbot reset due to logout");
    }
  }, [user]);

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
    { icon: ShoppingBag, label: t("chatbot.exploreMarketplace"), path: "/marketplace" },
    { icon: Bot, label: t("chatbot.askAI"), path: "/ai-chat" },
    { icon: PawPrint, label: t("chatbot.managePets"), path: "/pets" },
    { icon: Users, label: t("chatbot.joinCommunity"), path: "/community" },
  ];

  const handleQuickAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          isNewUser,
        }),
      });

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
        title: t("chatbot.error"),
        description: t("chatbot.errorDesc"),
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
      {/* Floating Button - Mobile Optimized */}
      <Button
        data-tour="chatbot"
        onClick={handleChatbotClick}
        className="fixed bottom-[15vh] right-3 sm:right-4 md:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg hover:scale-110 active:scale-105 transition-transform z-50 bg-gradient-to-br from-primary to-primary/80 touch-manipulation"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 sm:h-8 sm:w-8" />
        ) : (
          <img src={pawHandIcon} alt="Tay Nhỏ" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
        )}
      </Button>

      {/* Login Alert Dialog */}
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chatbot.loginRequired")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chatbot.loginRequiredDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chatbot.close")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>{t("header.login")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Window - Mobile Full Screen */}
      {isOpen && (
        <Card
          data-tour="chatbot-window"
          className="fixed inset-x-2 bottom-2 sm:inset-x-auto sm:bottom-[calc(15vh+80px)] sm:right-4 md:right-6 sm:w-96 h-[85vh] sm:h-[500px] shadow-2xl z-50 flex flex-col"
        >
          <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🐾</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{t("chatbot.title")}</h3>
                <p className="text-xs opacity-90 truncate">{t("chatbot.subtitle")}</p>
              </div>
              {/* Close button - Hidden as floating button handles it */}
              <Button
                data-tour="chatbot-close"
                onClick={handleChatbotClick}
                className="sm:hidden h-10 w-10 rounded-full"
                size="icon"
                variant="ghost"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 sm:p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground space-y-3 sm:space-y-4">
                <p className="text-3xl sm:text-4xl mb-3 sm:mb-4"></p>
                {isNewUser ? (
                  <>
                    <p className="font-semibold text-sm sm:text-base">{t("chatbot.welcomeNew")}</p>
                    <p className="text-xs sm:text-sm">{t("chatbot.welcomeNewDesc")}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm sm:text-base">{t("chatbot.welcomeBack")}</p>
                    <p className="text-xs sm:text-sm">{t("chatbot.welcomeBackDesc")}</p>
                  </>
                )}

                <div className="mt-4 sm:mt-6 space-y-2">
                  <p className="text-xs font-medium text-foreground">{t("")}</p>
                  {/* Quick Actions - Mobile Optimized */}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 sm:h-10 text-sm touch-manipulation"
                    onClick={() => handleQuickAction("/marketplace")}
                  >
                    <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t("chatbot.exploreMarketplace")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 sm:h-10 text-sm touch-manipulation"
                    onClick={() => handleQuickAction("/ai-chat")}
                  >
                    <Bot className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t("chatbot.askAI")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 sm:h-10 text-sm touch-manipulation"
                    onClick={() => handleQuickAction("/pets")}
                  >
                    <PawPrint className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t("chatbot.managePets")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 h-11 sm:h-10 text-sm touch-manipulation"
                    onClick={() => handleQuickAction("/community")}
                  >
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t("chatbot.joinCommunity")}</span>
                  </Button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 sm:mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-lg text-sm sm:text-base ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </ScrollArea>

          <div className="p-3 sm:p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("chatbot.placeholder")}
                disabled={isLoading}
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} className="h-10 sm:h-11 w-10 sm:w-11 flex-shrink-0 touch-manipulation" size="icon">
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
