-- Fix NULLs in pinned_in_sub_category (added by ddl-auto without default)
UPDATE products SET pinned_in_sub_category = false WHERE pinned_in_sub_category IS NULL;
ALTER TABLE products ALTER COLUMN pinned_in_sub_category SET DEFAULT false;

-- Fix NULLs in banner visibility fields (added later)
UPDATE banners SET visible_homepage = true WHERE visible_homepage IS NULL;
UPDATE banners SET visible_mobile = true WHERE visible_mobile IS NULL;
UPDATE banners SET visible_desktop = true WHERE visible_desktop IS NULL;
ALTER TABLE banners ALTER COLUMN visible_homepage SET DEFAULT true;
ALTER TABLE banners ALTER COLUMN visible_mobile SET DEFAULT true;
ALTER TABLE banners ALTER COLUMN visible_desktop SET DEFAULT true;

-- Add badge fields for homepage hero label (if missing)
ALTER TABLE IF EXISTS banners ADD COLUMN IF NOT EXISTS badge_texte VARCHAR(120);
ALTER TABLE IF EXISTS banners ADD COLUMN IF NOT EXISTS badge_bg_color VARCHAR(32);
ALTER TABLE IF EXISTS banners ADD COLUMN IF NOT EXISTS badge_text_color VARCHAR(32);

-- Backfill badge fields for legacy rows
UPDATE banners SET badge_texte = 'Nouvelle Collection' WHERE badge_texte IS NULL OR TRIM(badge_texte) = '';
UPDATE banners SET badge_bg_color = 'rgba(255,255,255,0.15)' WHERE badge_bg_color IS NULL OR TRIM(badge_bg_color) = '';
UPDATE banners SET badge_text_color = '#ffffff' WHERE badge_text_color IS NULL OR TRIM(badge_text_color) = '';

ALTER TABLE banners ALTER COLUMN badge_texte SET DEFAULT 'Nouvelle Collection';
ALTER TABLE banners ALTER COLUMN badge_bg_color SET DEFAULT 'rgba(255,255,255,0.15)';
ALTER TABLE banners ALTER COLUMN badge_text_color SET DEFAULT '#ffffff';

-- New cosmetic product fields (2026-04-28)
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS origine VARCHAR(255);
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS usage_instructions TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS precautions TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS inci_composition TEXT;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS certifications TEXT;
