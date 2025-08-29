-- SQL compatible with Supabase Auth and the app DDL

-- ENUM de papéis (se ainda não existir)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('BROKER','MANAGER','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- USERS (mantendo a DDL do app, adaptada p/ Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_uid uuid UNIQUE,                                  -- vincula a auth.users.id
  "name" varchar NOT NULL,
  email varchar NOT NULL UNIQUE,
  password_hash varchar NULL,                            -- Supabase gerencia a senha; deixe NULL
  "role" public.user_role DEFAULT 'BROKER'::user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" varchar NOT NULL,
  phone varchar NOT NULL,
  email varchar NULL,
  "source" varchar NOT NULL,
  status varchar NOT NULL,
  owner_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  observations text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  product varchar(255) NULL,
  property_value numeric(15, 2) NULL,
  follow_up_state varchar(20) DEFAULT 'Sem Follow Up'::character varying,
  CONSTRAINT clients_follow_up_state_check CHECK (
    follow_up_state IN ('Ativo','Concluido','Cancelado','Atrasado','Sem Follow Up')
  )
);

-- INTERACTIONS
CREATE TABLE IF NOT EXISTS public.interactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "type" varchar(255) NOT NULL,
  observation text NULL,
  from_status varchar(255) NULL,
  to_status varchar(255) NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Trigger: cria row em public.users quando nascer um auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_uid, name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name',''),
          NEW.email, COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role,'BROKER'))
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Policies users: self + managers/admins
DROP POLICY IF EXISTS users_select_self ON public.users;
CREATE POLICY users_select_self ON public.users
  FOR SELECT USING (
    auth.uid() = auth_uid
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = auth_uid)
  WITH CHECK (auth.uid() = auth_uid);

DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users
  FOR ALL TO authenticated
  USING ( (auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN') )
  WITH CHECK ( (auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN') );

-- Policies clients: dono vê/edita + managers/admins veem tudo
DROP POLICY IF EXISTS clients_read ON public.clients;
CREATE POLICY clients_read ON public.clients
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

DROP POLICY IF EXISTS clients_write ON public.clients;
CREATE POLICY clients_write ON public.clients
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

CREATE POLICY clients_update ON public.clients
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

-- Policies interactions: quem participou + managers/admins
DROP POLICY IF EXISTS interactions_read ON public.interactions;
CREATE POLICY interactions_read ON public.interactions
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

DROP POLICY IF EXISTS interactions_write ON public.interactions;
CREATE POLICY interactions_write ON public.interactions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid())
    OR ((auth.jwt() ? 'role') AND (auth.jwt()->>'role') IN ('MANAGER','ADMIN'))
  );

-- Observação: password_hash é NULL pois Supabase Auth gerencia senhas em auth.users

