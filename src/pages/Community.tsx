import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Trash2, Image as ImageIcon, X } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPostImage = async (postId: string): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `post-${postId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('pet-images')
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('pet-images')
      .getPublicUrl(fileName);

    return publicUrl;
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

      // Insert post first
      const { data: newPostData, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: validatedData.content,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload image if selected
      if (imageFile && newPostData) {
        const imageUrl = await uploadPostImage(newPostData.id);
        if (imageUrl) {
          const { error: updateError } = await supabase
            .from("posts")
            .update({ image_url: imageUrl })
            .eq("id", newPostData.id);

          if (updateError) throw updateError;
        }
      }

      setNewPost("");
      setImageFile(null);
      setImagePreview(null);
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
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-center">Cộng đồng Shoppet 🐾</h1>

        {/* Create Post - Mobile Optimized */}
        <Card className="post-card mb-4 sm:mb-6 md:mb-8 animate-fade-in">
          <div className="flex gap-3 sm:gap-4">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.display_name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
              <Textarea
                data-tour="community-post-input"
                placeholder="Chia sẻ điều gì đó với cộng đồng..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none"
              />
              
              {/* Image Preview - Mobile Optimized */}
              {imagePreview && (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="rounded-lg max-h-48 sm:max-h-64 w-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('post-image-upload')?.click()}
                  type="button"
                  className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Thêm ảnh</span>
                  <span className="sm:hidden">Ảnh</span>
                </Button>
                <input
                  id="post-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPost.trim() || isSubmitting} 
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Đăng bài
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Feed - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="post-card animate-fade-in-up">
              <div className="flex gap-3 sm:gap-4">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <AvatarImage src={post.profiles.avatar_url || undefined} />
                  <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{post.profiles.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                    {user?.id === post.user_id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeletePost(post.id)}
                        className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground text-sm sm:text-base mb-3 sm:mb-4 whitespace-pre-wrap break-words">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="rounded-lg mb-3 sm:mb-4 max-h-64 sm:max-h-80 md:max-h-96 w-full object-cover" />
                  )}
                  <div className="flex gap-3 sm:gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`h-9 sm:h-10 touch-manipulation ${likedPosts.has(post.id) ? "text-red-500" : ""}`}
                    >
                      <Heart className={`h-4 w-4 mr-1.5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                      <span className="text-sm">{post.likes_count}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 sm:h-10 touch-manipulation">
                      <MessageCircle className="h-4 w-4 mr-1.5" />
                      <span className="text-sm">{post.comments_count}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <p className="text-4xl sm:text-5xl mb-3 sm:mb-4">🐾</p>
              <p className="text-sm sm:text-base">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
