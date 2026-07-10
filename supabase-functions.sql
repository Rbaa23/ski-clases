-- Función para el recordatorio diario
-- Ejecutar en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION get_users_for_reminder()
RETURNS TABLE (id uuid, email text, nombre text)
LANGUAGE sql
AS $$
  SELECT p.id, p.email, p.nombre
  FROM profiles p
  WHERE p.recordar = true
    AND NOT EXISTS (
      SELECT 1 FROM clases c
      WHERE c.user_id = p.id
        AND c.fecha >= CURRENT_DATE
        AND c.fecha < CURRENT_DATE + INTERVAL '1 day'
    );
$$;

-- Tabla para suscripciones push
CREATE TABLE IF NOT EXISTS push_subs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  auth text NOT NULL,
  p256dh text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE push_subs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subs' AND policyname = 'Users can manage their own push sub') THEN
    CREATE POLICY "Users can manage their own push sub" ON push_subs
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
