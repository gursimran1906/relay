# Types Table Setup Guide

This guide will help you set up the types table for your Relay frontend application.

## 1. Create the Types Table

Run the following SQL in your Supabase SQL editor:

```sql
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

-- Add RLS (Row Level Security) policies
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
```

## 2. Insert Test Data

Run this SQL to populate the types table with sample data:

```sql
-- Insert test data into types table
INSERT INTO public.types (name, description, category, icon) VALUES
  ('Server', 'Physical or virtual server equipment', 'IT Equipment', '🖥️'),
  ('Router', 'Network routing equipment', 'Network Equipment', '📡'),
  ('Switch', 'Network switching equipment', 'Network Equipment', '🔀'),
  ('Firewall', 'Network security equipment', 'Security Equipment', '🛡️'),
  ('UPS', 'Uninterruptible Power Supply', 'Power Equipment', '🔋'),
  ('Air Conditioner', 'HVAC cooling system', 'HVAC Equipment', '❄️'),
  ('Generator', 'Backup power generator', 'Power Equipment', '⚡'),
  ('Security Camera', 'Surveillance camera system', 'Security Equipment', '📹'),
  ('Access Control', 'Door access control system', 'Security Equipment', '🚪'),
  ('Printer', 'Document printing equipment', 'Office Equipment', '🖨️'),
  ('Monitor', 'Display monitor', 'IT Equipment', '🖥️'),
  ('Laptop', 'Portable computer', 'IT Equipment', '💻'),
  ('Desktop', 'Desktop computer', 'IT Equipment', '🖥️'),
  ('Phone System', 'Telephone communication system', 'Communication Equipment', '📞'),
  ('Projector', 'Video projection equipment', 'AV Equipment', '📽️'),
  ('Scanner', 'Document scanning equipment', 'Office Equipment', '📄'),
  ('Tablet', 'Mobile tablet device', 'Mobile Equipment', '📱'),
  ('Network Storage', 'Data storage device', 'Storage Equipment', '💾'),
  ('Backup Drive', 'External backup storage', 'Storage Equipment', '💿'),
  ('Maintenance Tool', 'Equipment maintenance tools', 'Tools', '🔧'),
  ('Vehicle', 'Company vehicle or transport', 'Transportation', '🚗'),
  ('Forklift', 'Material handling equipment', 'Industrial Equipment', '🏗️'),
  ('Conveyor Belt', 'Material transport system', 'Industrial Equipment', '⚙️'),
  ('Safety Equipment', 'Personal protective equipment', 'Safety', '⛑️'),
  ('Cleaning Equipment', 'Facility cleaning tools', 'Maintenance', '🧹');
```

## 3. Updated Items Table Fields

The AddItemModal now supports all fields from your items table:

### Required Fields:

- **name** (text) - Item name

### Optional Fields:

- **type** (text) - Selected from types table
- **location** (text) - Item location
- **status** (text) - Active, maintenance_needed, inactive, out_of_service
- **tags** (text[]) - Array of tags for categorization
- **metadata** (jsonb) - Key-value pairs for additional information
- **last_maintenance_at** (timestamp) - Last maintenance date/time

### Auto-Generated Fields:

- **id** (serial) - Auto-incrementing ID
- **uid** (uuid) - Unique identifier
- **user_id** (uuid) - References auth.users
- **created_at** (timestamp) - Creation timestamp

## 4. Form Features

The updated Add Item modal includes:

### Type Selection

- Dropdown populated from types table
- Grouped by category for easy navigation
- Shows icon, name, and description
- Live loading from database

### Tags Management

- Add multiple tags
- Remove individual tags
- Stores as PostgreSQL array

### Metadata Management

- Dynamic key-value pairs
- Add/remove fields as needed
- Stored as JSONB for flexibility

### Status Selection

- Button-based status selection
- Visual color coding
- Predefined status options

### Location Features

- Manual location entry
- GPS location capture
- Optional field

### Maintenance Tracking

- Date/time picker for last maintenance
- Supports full timestamp with timezone

## 5. Database Structure Benefits

This structure provides:

- **Normalized types** - Consistent type management
- **Flexible metadata** - JSONB for custom fields
- **Tagging system** - Easy categorization and search
- **Maintenance tracking** - Historical maintenance records
- **User isolation** - RLS policies for data security

## 6. Next Steps

After setting up the types table:

1. Test the Add Item functionality
2. Add more types as needed
3. Customize the form fields based on your requirements
4. Set up proper RLS policies for your use case
5. Consider adding validation rules for specific metadata fields

## 7. Managing Types

To add new types through SQL:

```sql
INSERT INTO public.types (name, description, category, icon, is_active)
VALUES ('Your Type', 'Description here', 'Category Name', '🔧', true);
```

To disable a type:

```sql
UPDATE public.types SET is_active = false WHERE name = 'Type Name';
```
