-- Buat tabel usage_limits untuk mencatat pemakaian user
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_count INT DEFAULT 0,
  ai_generate_count INT DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Atur Row Level Security (RLS) agar user hanya bisa membaca dan memperbarui data mereka sendiri
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage limits"
  ON public.usage_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage limits"
  ON public.usage_limits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage limits"
  ON public.usage_limits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function untuk mereset reset_at dan count saat diperlukan, atau jika sudah kadaluarsa (opsional, bisa ditangani di sisi klien)
