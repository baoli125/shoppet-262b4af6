-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE public.app_role AS ENUM ('user', 'seller', 'admin');

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pet Types Enum
CREATE TYPE public.pet_type AS ENUM ('dog', 'cat', 'bird', 'fish', 'other');

-- Pet Gender Enum
CREATE TYPE public.pet_gender AS ENUM ('male', 'female', 'unknown');

-- Pets Table
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  type pet_type NOT NULL,
  breed TEXT,
  gender pet_gender DEFAULT 'unknown',
  birth_date DATE,
  weight DECIMAL(5,2),
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Vaccines Table
CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  next_date DATE,
  veterinarian TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- Product Categories
CREATE TYPE public.product_category AS ENUM ('food', 'toy', 'accessory', 'medicine', 'grooming', 'other');

-- Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category product_category NOT NULL,
  pet_type pet_type,
  brand TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Shopping Cart Table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Order Status Enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled');

-- Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  customer_notes TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order Items Table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- AI Chat Conversations Table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- AI Chat Messages Table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Badges Table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- User Badges Table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for User Roles
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for Pets
CREATE POLICY "Users can view own pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pets"
  ON public.pets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pets"
  ON public.pets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Vaccines
CREATE POLICY "Users can view vaccines for own pets"
  ON public.vaccines FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets WHERE pets.id = vaccines.pet_id AND pets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert vaccines for own pets"
  ON public.vaccines FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pets WHERE pets.id = vaccines.pet_id AND pets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update vaccines for own pets"
  ON public.vaccines FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets WHERE pets.id = vaccines.pet_id AND pets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete vaccines for own pets"
  ON public.vaccines FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets WHERE pets.id = vaccines.pet_id AND pets.user_id = auth.uid()
  ));

-- RLS Policies for Products
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  TO authenticated
  USING (is_active = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid() AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Sellers can update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- RLS Policies for Cart Items
CREATE POLICY "Users can view own cart"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to own cart"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete from own cart"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and sellers can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for Order Items
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.seller_id = auth.uid())
  ));

CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- RLS Policies for Chat Conversations
CREATE POLICY "Users can view own conversations"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON public.chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.chat_conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Chat Messages
CREATE POLICY "Users can view messages in own conversations"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE chat_conversations.id = chat_messages.conversation_id 
    AND chat_conversations.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in own conversations"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chat_conversations 
    WHERE chat_conversations.id = chat_messages.conversation_id 
    AND chat_conversations.user_id = auth.uid()
  ));

-- RLS Policies for Badges
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage badges"
  ON public.badges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for User Badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required) VALUES
  ('Newcomer', 'Welcome to Shoppet!', '🌟', 0),
  ('Pet Lover', 'Added first pet profile', '🐾', 10),
  ('Active Member', 'Used AI assistant 10 times', '🤖', 50),
  ('Shopaholic', 'Made 5 purchases', '🛍️', 100),
  ('Community Star', 'Earned 500 points', '⭐', 500);