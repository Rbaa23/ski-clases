-- ============================================================
-- StatClass — SEGURIDAD RLS (Row Level Security)
-- Ejecutar UNA sola vez en Supabase → SQL Editor.
--
-- Qué logra:
--   * Un usuario normal SOLO ve/edita/borra SUS PROPIOS datos.
--   * Nadie (salvo un admin) puede cambiar is_admin, aprobado o email.
--   * El ADMIN conserva TODOS sus poderes (lee todo, aprueba, bloquea).
--   * Los crons (service role) siguen funcionando igual.
--   * La app funciona exactamente como hasta ahora para el usuario final.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Función: ¿el usuario actual es admin?
--    SECURITY DEFINER para evitar recursión de RLS.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- ------------------------------------------------------------
-- 2) Trigger anti-escalada de privilegios
--    Bloquea que un usuario NO-admin modifique is_admin/aprobado/email.
--    (SQL Editor / service role no tienen usuario → se permite todo)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin OR NEW.aprobado THEN
      RAISE EXCEPTION 'Solo un admin puede asignar is_admin o aprobado';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW.is_admin IS DISTINCT FROM OLD.is_admin)
      OR (NEW.aprobado IS DISTINCT FROM OLD.aprobado)
      OR (NEW.email IS DISTINCT FROM OLD.email) THEN
      RAISE EXCEPTION 'Solo un admin puede cambiar is_admin, aprobado o email';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_privilege_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();

-- ------------------------------------------------------------
-- 3) Habilitar RLS en todas las tablas (idempotente)
-- ------------------------------------------------------------
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descuentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otros       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subs   ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4) Limpiar políticas existentes para recrearlas de cero
-- ------------------------------------------------------------
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','precios','clases','descuentos','otros','sesiones','push_subs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5) POLÍTICAS POR TABLA
-- ------------------------------------------------------------

-- profiles: propio / admin
CREATE POLICY "profiles_select_own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin"  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_insert_own"    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin"  ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- precios: propio / admin
CREATE POLICY "precios_select_own"   ON public.precios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "precios_select_admin" ON public.precios FOR SELECT USING (public.is_admin());
CREATE POLICY "precios_insert_own"   ON public.precios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "precios_update_own"   ON public.precios FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "precios_admin"        ON public.precios FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- clases: propio / admin
CREATE POLICY "clases_select_own"   ON public.clases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clases_insert_own"   ON public.clases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clases_update_own"   ON public.clases FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clases_delete_own"   ON public.clases FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "clases_admin"        ON public.clases FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- descuentos: propio / admin
CREATE POLICY "descuentos_select_own"   ON public.descuentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "descuentos_insert_own"   ON public.descuentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "descuentos_update_own"   ON public.descuentos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "descuentos_delete_own"   ON public.descuentos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "descuentos_admin"        ON public.descuentos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- otros: propio / admin
CREATE POLICY "otros_select_own"   ON public.otros FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "otros_insert_own"   ON public.otros FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "otros_update_own"   ON public.otros FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "otros_delete_own"   ON public.otros FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "otros_admin"        ON public.otros FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- sesiones: propias / admin
CREATE POLICY "sesiones_select_own"  ON public.sesiones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sesiones_insert_own"  ON public.sesiones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sesiones_admin"       ON public.sesiones FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- push_subs: propias / admin
CREATE POLICY "push_subs_manage_own" ON public.push_subs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subs_admin"      ON public.push_subs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 6) STORAGE "avatars"
--    Cualquiera puede LEER (es público), pero solo el dueño
--    sube/actualiza/borra archivos dentro de su carpeta {user_id}/
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%avatars%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "avatars_select_all"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own"   ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own"   ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own"   ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- 7) ASIGNAR TU ADMIN (ejecutar UNA vez, con TU email)
--    El trigger permite esto porque el SQL Editor no tiene usuario:
--
--    UPDATE public.profiles SET is_admin = true WHERE email = 'TU_EMAIL@ejemplo.com';
--
-- ------------------------------------------------------------
