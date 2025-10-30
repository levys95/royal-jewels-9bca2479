-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'livreur');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  historical_info TEXT,
  original_owner TEXT,
  era TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'France',
  livreur_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
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

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Everyone can view available products" ON public.products FOR SELECT USING (is_available = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cart_items
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'livreur'));
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Livreurs can update assigned orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'livreur') AND auth.uid() = livreur_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'livreur'))
  )
);
CREATE POLICY "System can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- RLS Policies for admin_logs
CREATE POLICY "Admins can view all logs" ON public.admin_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create logs" ON public.admin_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert initial categories
INSERT INTO public.categories (name, description) VALUES
('Couronnes', 'Couronnes impériales et diadèmes royaux'),
('Colliers', 'Colliers et parures de l''Empire'),
('Bagues', 'Bagues impériales et alliances royales'),
('Broches', 'Broches et bijoux de corsage'),
('Boucles d''oreilles', 'Boucles d''oreilles de la cour impériale');

-- Insert sample products (stolen Napoleon and Eugénie jewels)
INSERT INTO public.products (name, description, price, stock_quantity, category_id, historical_info, original_owner, era, is_available) VALUES
(
  'Diadème de l''Impératrice Eugénie',
  'Magnifique diadème en or et diamants, orné de 212 diamants taillés en brillant. Pièce emblématique du Second Empire.',
  2500000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Couronnes'),
  'Porté lors du bal des Tuileries en 1855. Créé par le joaillier François Kramer.',
  'Impératrice Eugénie',
  'Second Empire (1852-1870)',
  true
),
(
  'Collier de perles de Marie-Louise',
  'Collier composé de 234 perles fines de la mer du Japon, avec fermoir en diamants.',
  1800000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Colliers'),
  'Offert par Napoléon Ier à Marie-Louise lors de leur mariage en 1810.',
  'Impératrice Marie-Louise',
  'Premier Empire (1804-1815)',
  true
),
(
  'Bague de couronnement de Napoléon',
  'Bague en or massif sertie d''un rubis birman de 15 carats, portée lors du sacre de 1804.',
  3200000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Bagues'),
  'Symbole du pouvoir impérial, bénie par le Pape Pie VII.',
  'Napoléon Bonaparte',
  'Premier Empire (1804-1815)',
  true
),
(
  'Broche Aigle Impérial',
  'Broche en or et émeraudes représentant l''aigle impérial, emblème de l''Empire.',
  980000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Broches'),
  'Portée par Joséphine lors des cérémonies officielles.',
  'Impératrice Joséphine',
  'Premier Empire (1804-1815)',
  true
),
(
  'Boucles d''oreilles aux Saphirs',
  'Paire de boucles d''oreilles en platine, ornées de saphirs de Ceylan et diamants.',
  1450000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Boucles d''oreilles'),
  'Portées par Eugénie lors de l''Exposition Universelle de 1867.',
  'Impératrice Eugénie',
  'Second Empire (1852-1870)',
  true
),
(
  'Couronne de la Reine Hortense',
  'Couronne en or blanc, ornée de 189 diamants et 34 émeraudes.',
  2100000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Couronnes'),
  'Créée pour Hortense de Beauharnais, reine de Hollande.',
  'Reine Hortense',
  'Premier Empire (1804-1815)',
  true
),
(
  'Collier Rivière de Diamants',
  'Collier composé de 67 diamants taillés en brillant, monture en platine.',
  2800000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Colliers'),
  'Chef-d''œuvre de la joaillerie impériale, porté lors du bal de 1863.',
  'Impératrice Eugénie',
  'Second Empire (1852-1870)',
  true
),
(
  'Bague Josephine aux Rubis',
  'Bague en or jaune 18 carats, sertie de 3 rubis birmans et diamants.',
  756000.00,
  1,
  (SELECT id FROM public.categories WHERE name = 'Bagues'),
  'Cadeau de Napoléon à Joséphine pour leur anniversaire de mariage.',
  'Impératrice Joséphine',
  'Premier Empire (1804-1815)',
  true
);