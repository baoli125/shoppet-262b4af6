import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Trash2, Plus } from "lucide-react";
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const loadedRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lấy user và load lịch sử cuộc trò chuyện gần nhất
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Lấy cuộc trò chuyện gần nhất (tối đa 1)
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (convos && convos.length > 0) {
        const convoId = convos[0].id;
        setConversationId(convoId);

        // Load tin nhắn
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", convoId)
          .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
          const parsed: Message[] = msgs.map(m => {
            let displayContent = m.content;
            let followUps: string[] = [];
            if (m.content.includes("---FOLLOW_UP---")) {
              const parts = m.content.split("---FOLLOW_UP---");
              displayContent = parts[0].trim();
              followUps = (parts[1]?.trim() || "")
                .split("\n")
                .map(q => q.trim())
                .filter(q => q.length > 0);
            }
            return {
              role: m.role as "user" | "assistant",
              content: displayContent,
              followUpQuestions: followUps.length > 0 ? followUps : undefined,
            };
          });
          setMessages(parsed);
        }
      }
    };
    init();
  }, []);

  // Lưu tin nhắn vào DB
  const saveMessage = useCallback(async (role: string, content: string, convoId: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: convoId,
      role,
      content,
    });
    // Cập nhật thời gian cuộc trò chuyện
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
  }, []);

  // Tạo cuộc trò chuyện mới hoặc lấy ID hiện tại
  const getOrCreateConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    if (!userId) return null;

    // Xóa cuộc trò chuyện cũ (chỉ giữ tối đa 1)
    const { data: oldConvos } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (oldConvos && oldConvos.length > 0) {
      for (const c of oldConvos) {
        await supabase.from("chat_messages").delete().eq("conversation_id", c.id);
        await supabase.from("chat_conversations").delete().eq("id", c.id);
      }
    }

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: userId, title: "Cuộc trò chuyện" })
      .select("id")
      .single();

    if (error || !data) return null;
    setConversationId(data.id);
    return data.id;
  }, [conversationId, userId]);

  // Bắt đầu cuộc trò chuyện mới
  const handleNewConversation = async () => {
    if (!userId || isLoading) return;

    // Xóa cuộc trò chuyện cũ
    if (conversationId) {
      await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
      await supabase.from("chat_conversations").delete().eq("id", conversationId);
    }

    setConversationId(null);
    setMessages([]);
    toast({ title: "Đã tạo cuộc trò chuyện mới 🐾" });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Lưu tin nhắn user
    const convoId = await getOrCreateConversation();

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;

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
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

      // Gửi tất cả tin nhắn cho AI (giữ context)
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Hệ thống đang bận, vui lòng thử lại sau");
        if (resp.status === 402) throw new Error("Dịch vụ tạm thời không khả dụng");
        if (resp.status === 401) throw new Error("Vui lòng đăng nhập để sử dụng dịch vụ");
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
          if (jsonStr === "[DONE]") { streamDone = true; break; }

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

      // Lưu cả tin nhắn user và assistant vào DB
      if (convoId) {
        await saveMessage("user", input, convoId);
        await saveMessage("assistant", assistantContent, convoId);
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
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="h-14 sm:h-16 md:h-20 flex-shrink-0"></div>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between py-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {conversationId && messages.length > 0 ? "Cuộc trò chuyện hiện tại" : "Trò chuyện mới"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            disabled={isLoading || messages.length === 0}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Cuộc trò chuyện mới
          </Button>
        </div>
      </div>

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

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-4xl">
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
