import { supabase } from '@/lib/supabase'

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin, // redirect về trang chủ sau khi login
    },
  })
  if (error) console.error('Lỗi đăng nhập:', error.message)
}