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
