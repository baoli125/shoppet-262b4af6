import { useState } from "react";
import { Button } from "@/components/ui/button";
  import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, X, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string | null;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading,
  isOpen,
  onToggle,
}: ChatSidebarProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleEditStart = (e: React.MouseEvent, id: string, currentTitle: string | null) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle || "Cuộc trò chuyện");
  };

  const handleEditSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave(e);
    } else if (e.key === "Escape") {
      setEditingId(null);
      e.stopPropagation();
    }
  };
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-14 sm:top-16 md:top-20 bottom-0 left-0 z-50 md:z-30 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Lịch sử chat</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-2">
          <Button
            onClick={onNewConversation}
            disabled={isLoading}
            variant="outline"
            className="w-full justify-start gap-2 text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Cuộc trò chuyện mới
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Chưa có cuộc trò chuyện nào
            </p>
          )}
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors",
                activeConversationId === convo.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
              onClick={() => onSelectConversation(convo.id)}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{convo.title || "Cuộc trò chuyện"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(convo.updated_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(convo.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle button (always visible) */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed z-40 top-[4.5rem] sm:top-[5rem] md:top-[5.5rem] bg-card border border-border rounded-r-lg p-1.5 shadow-sm hover:bg-muted transition-all duration-200",
          isOpen ? "left-64" : "left-0"
        )}
        aria-label="Toggle chat sidebar"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </>
  );
};

export default ChatSidebar;
