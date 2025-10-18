import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { z } from "zod";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Community = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      fetchProfile(user.id);
      fetchLikedPosts(user.id);
    });

    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("community-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        public_profiles!inner(display_name, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    // Transform the data to match the expected structure
    const transformedData = data?.map(post => ({
      ...post,
      profiles: post.public_profiles
    })) || [];

    setPosts(transformedData as any);
  };

  const fetchLikedPosts = async (userId: string) => {
    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId);

    if (data) {
      setLikedPosts(new Set(data.map((like) => like.post_id)));
    }
  };

  // Define validation schema for posts
  const postSchema = z.object({
    content: z.string()
      .trim()
      .min(1, "Nội dung không được để trống")
      .max(5000, "Nội dung không được vượt quá 5000 ký tự")
  });

  const handleCreatePost = async () => {
    if (!newPost.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Validate content before posting
      const validatedData = postSchema.parse({ content: newPost });

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: validatedData.content,
      });

      if (error) throw error;

      setNewPost("");
      toast({
        title: "Đã đăng! 🎉",
        description: "Bài viết của bạn đã được chia sẻ với cộng đồng.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Lỗi nội dung",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error creating post:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tạo bài viết. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        await supabase.from("post_likes").delete().match({ post_id: postId, user_id: user.id });
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      toast({
        title: "Đã xóa",
        description: "Bài viết đã được xóa thành công.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        userName={profile?.display_name || user?.email}
        userAvatar={profile?.avatar_url}
        cartCount={0}
        onLoginClick={() => {}}
        onLogoutClick={handleLogout}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Cộng đồng Shoppet 🐾</h1>

        {/* Create Post */}
        <Card className="p-6 mb-8">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.display_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="Chia sẻ điều gì đó với cộng đồng..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleCreatePost} disabled={!newPost.trim() || isSubmitting} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Đăng bài
              </Button>
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="p-6">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{post.profiles.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    {user?.id === post.user_id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="rounded-lg mb-4 max-h-96 object-cover" />
                  )}
                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={likedPosts.has(post.id) ? "text-red-500" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                      {post.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments_count}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-4">🐾</p>
              <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
