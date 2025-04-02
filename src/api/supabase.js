import { createClient } from '@supabase/supabase-js';

// Idéalement, ces valeurs seraient dans des variables d'environnement (.env)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonctions d'authentification
export const signUp = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// Fonctions pour les ponts
export const getAllBridges = async () => {
  const { data, error } = await supabase
    .from('bridges')
    .select('*');
  
  if (error) throw error;
  return data;
};

export const getBridgeById = async (id) => {
  const { data, error } = await supabase
    .from('bridges')
    .select(`
      *,
      comments(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const addBridge = async (bridgeData) => {
  const { data, error } = await supabase
    .from('bridges')
    .insert([bridgeData])
    .select();
  
  if (error) throw error;
  return data;
};

export const updateBridge = async (id, updates) => {
  const { data, error } = await supabase
    .from('bridges')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data;
};

// Fonctions pour les commentaires
export const addComment = async (commentData) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([commentData])
    .select();
  
  if (error) throw error;
  return data;
};

// Fonctions pour les notes
export const addRating = async (ratingData) => {
  const { data, error } = await supabase
    .from('ratings')
    .insert([ratingData])
    .select();
  
  if (error) throw error;
  return data;
};

// Fonction pour l'upload d'images
export const uploadImage = async (file, path) => {
  const { data, error } = await supabase.storage
    .from('bridge-images')
    .upload(path, file);
  
  if (error) throw error;
  return data;
};

export const getImageUrl = (path) => {
  return supabase.storage
    .from('bridge-images')
    .getPublicUrl(path).data.publicUrl;
};
