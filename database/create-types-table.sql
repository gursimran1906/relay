-- Create types table for item types
CREATE TABLE public.types (
  id serial NOT NULL,
  uid uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  category text NULL,
  icon text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT types_pkey PRIMARY KEY (id),
  CONSTRAINT types_uid_key UNIQUE (uid),
  CONSTRAINT types_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.types ENABLE ROW LEVEL SECURITY;

-- Allow all users to read types (since they're shared)
CREATE POLICY "Allow all users to read types" ON public.types
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow admins to modify types (you can adjust this as needed)
CREATE POLICY "Allow admins to modify types" ON public.types
  FOR ALL
  TO authenticated
  USING (true); 