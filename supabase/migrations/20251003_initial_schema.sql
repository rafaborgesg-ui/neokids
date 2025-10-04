-- Apaga tabelas antigas se existirem, para um começo limpo.
DROP TABLE IF EXISTS public.appointment_services;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.patients;

-- Tabela de Pacientes (Fonte da Verdade)
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE,
    cpf TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    responsible_name TEXT,
    responsible_cpf TEXT,
    responsible_phone TEXT,
    consent_lgpd BOOLEAN DEFAULT FALSE,
    special_alert TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- (Outras tabelas como services, appointments...)

-- Habilita a Segurança a Nível de Linha (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE SEGURANÇA PARA PACIENTES
-- 1. Permite que QUALQUER usuário autenticado leia TODOS os pacientes.
CREATE POLICY "Allow authenticated users to read patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

-- 2. Permite que QUALQUER usuário autenticado crie novos pacientes.
CREATE POLICY "Allow authenticated users to create patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Permite que o CRIADOR do registro o atualize.
CREATE POLICY "Allow users to update their own patient records"
ON public.patients FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- 4. Permite que o CRIADOR do registro o exclua.
CREATE POLICY "Allow users to delete their own patient records"
ON public.patients FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
