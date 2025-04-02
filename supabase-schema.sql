-- Création de la table des ponts
CREATE TABLE IF NOT EXISTS bridges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  region TEXT,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  images TEXT[],
  rain_protection BOOLEAN DEFAULT FALSE,
  nearby_toilets BOOLEAN DEFAULT FALSE,
  toilets_distance INTEGER,
  drinking_water BOOLEAN DEFAULT FALSE,
  water_distance INTEGER,
  security_level TEXT DEFAULT 'medium',
  lighting BOOLEAN DEFAULT FALSE,
  traffic_level TEXT DEFAULT 'medium',
  noise_level TEXT DEFAULT 'medium',
  view_quality TEXT DEFAULT 'average',
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  average_rating DOUBLE PRECISION DEFAULT 0,
  average_hygiene DOUBLE PRECISION DEFAULT 0,
  average_discretion DOUBLE PRECISION DEFAULT 0,
  average_accessibility DOUBLE PRECISION DEFAULT 0,
  ratings_count INTEGER DEFAULT 0
);

-- Création de la table des commentaires
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bridge_id UUID REFERENCES bridges NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des évaluations
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bridge_id UUID REFERENCES bridges NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  hygiene INTEGER NOT NULL CHECK (hygiene BETWEEN 1 AND 5),
  discretion INTEGER NOT NULL CHECK (discretion BETWEEN 1 AND 5),
  accessibility INTEGER NOT NULL CHECK (accessibility BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Trigger pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies pour la sécurité Row Level Security (RLS)
-- Activer RLS sur toutes les tables
ALTER TABLE bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour la table bridges
CREATE POLICY "Tous les utilisateurs peuvent voir les ponts"
  ON bridges FOR SELECT
  USING (true);
  
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des ponts"
  ON bridges FOR INSERT
  WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres ponts"
  ON bridges FOR UPDATE
  USING (auth.uid() = created_by);

-- Policies pour la table comments
CREATE POLICY "Tous les utilisateurs peuvent voir les commentaires"
  ON comments FOR SELECT
  USING (true);
  
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des commentaires"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres commentaires"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);
  
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres commentaires"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour la table ratings
CREATE POLICY "Tous les utilisateurs peuvent voir les évaluations"
  ON ratings FOR SELECT
  USING (true);
  
CREATE POLICY "Les utilisateurs authentifiés peuvent ajouter des évaluations"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Les utilisateurs peuvent modifier leurs propres évaluations"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour la table profiles
CREATE POLICY "Les utilisateurs peuvent voir tous les profils"
  ON profiles FOR SELECT
  USING (true);
  
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
