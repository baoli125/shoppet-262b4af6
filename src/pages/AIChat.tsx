import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUpQuestions?: string[];
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const defaultSuggestions = [
    "Chó bị tiêu chảy phải làm sao?",
    "Thức ăn nào tốt cho mèo con?",
    "Lịch tiêm phòng cho chó con",
    "Cách huấn luyện chó đi vệ sinh",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      
      // Parse follow-up questions if present
      let displayContent = assistantContent;
      let followUps: string[] = [];
      
      if (assistantContent.includes("---FOLLOW_UP---")) {
        const parts = assistantContent.split("---FOLLOW_UP---");
        displayContent = parts[0].trim();
        const followUpText = parts[1]?.trim();
        if (followUpText) {
          followUps = followUpText
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0);
        }
      }
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 
              ? { ...m, content: displayContent, followUpQuestions: followUps }
              : m
          );
        }
        return [...prev, { role: "assistant", content: displayContent, followUpQuestions: followUps }];
      });
      
      // Update current follow-ups for display
      if (followUps.length > 0) {
        setCurrentFollowUps(followUps);
      }
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          throw new Error("Hệ thống đang bận, vui lòng thử lại sau");
        }
        if (resp.status === 402) {
          throw new Error("Dịch vụ tạm thời không khả dụng");
        }
        if (resp.status === 401) {
          throw new Error("Vui lòng đăng nhập để sử dụng dịch vụ");
        }
        throw new Error("Không thể kết nối");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kết nối với AI assistant",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
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
    <div className="min-h-screen bg-background flex flex-col pt-14 sm:pt-16 md:pt-20">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-4 sm:py-6 animate-fade-in">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-base sm:text-lg font-bold mb-2 text-foreground">
                Xin chào! Tôi là trợ lý AI của Shoppet
              </h2>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto mb-3 px-2">
                Tôi có thể giúp bạn tư vấn về sức khỏe, dinh dưỡng, và chăm sóc thú cưng. 
                Hãy hỏi tôi bất cứ điều gì!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto">
                {[
                  "Con mèo của tôi bị tiêu chảy phải làm sao?",
                  "Chó con 2 tháng tuổi nên ăn gì?",
                  "Lịch tiêm phòng cho chó như thế nào?",
                  "Cách huấn luyện mèo đi vệ sinh đúng chỗ"
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="quick-action-card text-left min-h-[60px] sm:min-h-auto touch-manipulation active:scale-[0.98]"
                  >
                    <p className="text-xs sm:text-sm leading-relaxed">{q}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div className="flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                    <div
                      className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === "assistant" && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                        {msg.followUpQuestions.map((question, qIdx) => (
                          <Button
                            key={qIdx}
                            variant="outline"
                            size="sm"
                            className="text-xs text-left h-auto py-2 px-2.5 sm:px-3 touch-manipulation"
                            onClick={() => setInput(question)}
                            disabled={isLoading}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input - Mobile Sticky */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-4xl">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {defaultSuggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  className="text-xs h-8 sm:h-9 touch-manipulation"
                  onClick={() => setInput(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2 sm:gap-3">
            <Textarea
              data-tour="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Hỏi về sức khỏe thú cưng..."
              className="resize-none min-h-[56px] sm:min-h-[60px] text-sm sm:text-base"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="btn-hero px-4 sm:px-6 h-14 sm:h-auto touch-manipulation flex-shrink-0"
              size="lg"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            💡 Mẹo: Cung cấp thông tin về loài, tuổi, cân nặng để nhận tư vấn chính xác hơn
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
