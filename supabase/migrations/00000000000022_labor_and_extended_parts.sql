-- Migration: Extended Fujitsu Parts + Labor Rates
-- Complete inventory for HVAC quoting system

-- =====================================================
-- First, add item_type column if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'item_type'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN item_type text DEFAULT 'part';
    COMMENT ON COLUMN inventory_items.item_type IS 'Type of item: part, labor, fee, service';
  END IF;
END $$;

-- Add description column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'description'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN description text;
  END IF;
END $$;

-- Add supplier_ref column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'supplier_ref'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN supplier_ref text;
  END IF;
END $$;

-- =====================================================
-- LABOR RATES (Main d'oeuvre)
-- =====================================================
INSERT INTO inventory_items (
  reference, name, description, item_type, category,
  price_sell, price_buy, quantity, min_threshold, is_active
) VALUES
  -- Main d'oeuvre installation
  ('LABOR-INSTALL-STD', 'Main d''oeuvre installation standard', 'Heure de travail installation mono-split ou bi-split', 'labor', 'Main d''oeuvre', 65.00, 0, 0, 0, true),
  ('LABOR-INSTALL-COMPLEX', 'Main d''oeuvre installation complexe', 'Heure de travail installation multi-split, gainable, cassette', 'labor', 'Main d''oeuvre', 85.00, 0, 0, 0, true),
  ('LABOR-INSTALL-FORFAIT-MONO', 'Forfait installation mono-split', 'Installation complète mono-split (mise en service incluse)', 'labor', 'Main d''oeuvre', 450.00, 0, 0, 0, true),
  ('LABOR-INSTALL-FORFAIT-BI', 'Forfait installation bi-split', 'Installation complète bi-split (mise en service incluse)', 'labor', 'Main d''oeuvre', 750.00, 0, 0, 0, true),
  ('LABOR-INSTALL-FORFAIT-TRI', 'Forfait installation tri-split', 'Installation complète tri-split (mise en service incluse)', 'labor', 'Main d''oeuvre', 950.00, 0, 0, 0, true),

  -- Main d'oeuvre entretien
  ('LABOR-ENTRETIEN', 'Main d''oeuvre entretien annuel', 'Heure de travail entretien et maintenance', 'labor', 'Main d''oeuvre', 55.00, 0, 0, 0, true),
  ('LABOR-ENTRETIEN-FORFAIT', 'Forfait entretien annuel complet', 'Entretien complet avec nettoyage filtres, vérification gaz, test', 'labor', 'Main d''oeuvre', 120.00, 0, 0, 0, true),
  ('LABOR-ENTRETIEN-MULTI', 'Forfait entretien multi-split', 'Entretien complet système multi-split (jusqu''à 4 unités)', 'labor', 'Main d''oeuvre', 180.00, 0, 0, 0, true),

  -- Main d'oeuvre dépannage/réparation
  ('LABOR-DEPANNAGE', 'Main d''oeuvre dépannage', 'Heure de travail dépannage et diagnostic', 'labor', 'Main d''oeuvre', 75.00, 0, 0, 0, true),
  ('LABOR-DEPANNAGE-FORFAIT', 'Forfait déplacement + diagnostic', 'Déplacement + première heure de diagnostic', 'labor', 'Main d''oeuvre', 95.00, 0, 0, 0, true),
  ('LABOR-REPARATION', 'Main d''oeuvre réparation', 'Heure de travail réparation', 'labor', 'Main d''oeuvre', 70.00, 0, 0, 0, true),

  -- Frais de déplacement
  ('LABOR-DEPLACEMENT-STD', 'Déplacement zone standard', 'Frais de déplacement zone Bruxelles/périphérie', 'fee', 'Frais', 35.00, 0, 0, 0, true),
  ('LABOR-DEPLACEMENT-LONG', 'Déplacement longue distance', 'Frais de déplacement hors zone (>30km)', 'fee', 'Frais', 65.00, 0, 0, 0, true),

  -- Mise en service
  ('LABOR-MES', 'Mise en service', 'Mise en service et test fonctionnement', 'labor', 'Main d''oeuvre', 120.00, 0, 0, 0, true),
  ('LABOR-MES-MULTI', 'Mise en service multi-split', 'Mise en service système multi-split', 'labor', 'Main d''oeuvre', 180.00, 0, 0, 0, true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  item_type = EXCLUDED.item_type,
  price_sell = EXCLUDED.price_sell;

-- =====================================================
-- UNITES INTERIEURES FUJITSU (Gamme complète)
-- =====================================================
INSERT INTO inventory_items (
  reference, name, description, item_type, category,
  price_sell, price_buy, quantity, min_threshold, supplier_name, is_active
) VALUES
  -- Gamme KMCC (Standard)
  ('FUJ-ASYG07KMCC', 'Fujitsu ASYG07KMCC - 2.0kW', 'Unité murale 2.0kW R32 - Gamme standard', 'part', 'Unités intérieures', 450.00, 280.00, 5, 2, 'Fujitsu General', true),
  ('FUJ-ASYG09KMCC', 'Fujitsu ASYG09KMCC - 2.5kW', 'Unité murale 2.5kW R32 - Gamme standard', 'part', 'Unités intérieures', 520.00, 320.00, 8, 3, 'Fujitsu General', true),
  ('FUJ-ASYG12KMCC', 'Fujitsu ASYG12KMCC - 3.5kW', 'Unité murale 3.5kW R32 - Gamme standard', 'part', 'Unités intérieures', 620.00, 380.00, 6, 2, 'Fujitsu General', true),
  ('FUJ-ASYG14KMCC', 'Fujitsu ASYG14KMCC - 4.2kW', 'Unité murale 4.2kW R32 - Gamme standard', 'part', 'Unités intérieures', 720.00, 450.00, 4, 2, 'Fujitsu General', true),
  ('FUJ-ASYG18KMCC', 'Fujitsu ASYG18KMCC - 5.2kW', 'Unité murale 5.2kW R32 - Gamme standard', 'part', 'Unités intérieures', 850.00, 550.00, 3, 2, 'Fujitsu General', true),

  -- Gamme KGTA (Design)
  ('FUJ-ASYG09KGTA', 'Fujitsu ASYG09KGTA Design - 2.5kW', 'Unité murale design 2.5kW R32', 'part', 'Unités intérieures', 680.00, 420.00, 4, 2, 'Fujitsu General', true),
  ('FUJ-ASYG12KGTA', 'Fujitsu ASYG12KGTA Design - 3.5kW', 'Unité murale design 3.5kW R32', 'part', 'Unités intérieures', 780.00, 480.00, 4, 2, 'Fujitsu General', true),
  ('FUJ-ASYG14KGTA', 'Fujitsu ASYG14KGTA Design - 4.2kW', 'Unité murale design 4.2kW R32', 'part', 'Unités intérieures', 880.00, 560.00, 3, 2, 'Fujitsu General', true),

  -- Gamme LUCA (Premium)
  ('FUJ-ASYG09LUCA', 'Fujitsu ASYG09LUCA Premium - 2.5kW', 'Unité murale premium 2.5kW R32 WiFi intégré', 'part', 'Unités intérieures', 850.00, 540.00, 3, 1, 'Fujitsu General', true),
  ('FUJ-ASYG12LUCA', 'Fujitsu ASYG12LUCA Premium - 3.5kW', 'Unité murale premium 3.5kW R32 WiFi intégré', 'part', 'Unités intérieures', 950.00, 620.00, 3, 1, 'Fujitsu General', true),
  ('FUJ-ASYG14LUCA', 'Fujitsu ASYG14LUCA Premium - 4.2kW', 'Unité murale premium 4.2kW R32 WiFi intégré', 'part', 'Unités intérieures', 1080.00, 720.00, 2, 1, 'Fujitsu General', true),

  -- Consoles
  ('FUJ-AGYG09LVCA', 'Fujitsu Console AGYG09LVCA - 2.5kW', 'Console sol 2.5kW R32', 'part', 'Unités intérieures', 920.00, 580.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-AGYG12LVCA', 'Fujitsu Console AGYG12LVCA - 3.5kW', 'Console sol 3.5kW R32', 'part', 'Unités intérieures', 1050.00, 680.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-AGYG14LVCA', 'Fujitsu Console AGYG14LVCA - 4.2kW', 'Console sol 4.2kW R32', 'part', 'Unités intérieures', 1180.00, 780.00, 2, 1, 'Fujitsu General', true),

  -- Cassettes
  ('FUJ-AUXG09KVLA', 'Fujitsu Cassette AUXG09KVLA - 2.5kW', 'Cassette plafond 4 voies 2.5kW R32', 'part', 'Unités intérieures', 1250.00, 820.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-AUXG12KVLA', 'Fujitsu Cassette AUXG12KVLA - 3.5kW', 'Cassette plafond 4 voies 3.5kW R32', 'part', 'Unités intérieures', 1380.00, 920.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-AUXG14KVLA', 'Fujitsu Cassette AUXG14KVLA - 4.2kW', 'Cassette plafond 4 voies 4.2kW R32', 'part', 'Unités intérieures', 1520.00, 1020.00, 2, 1, 'Fujitsu General', true),

  -- Gainable
  ('FUJ-ARXG09KLLAP', 'Fujitsu Gainable ARXG09KLLAP - 2.5kW', 'Gainable slim basse pression 2.5kW R32', 'part', 'Unités intérieures', 1150.00, 750.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-ARXG12KLLAP', 'Fujitsu Gainable ARXG12KLLAP - 3.5kW', 'Gainable slim basse pression 3.5kW R32', 'part', 'Unités intérieures', 1280.00, 850.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-ARXG14KLLAP', 'Fujitsu Gainable ARXG14KLLAP - 4.2kW', 'Gainable slim basse pression 4.2kW R32', 'part', 'Unités intérieures', 1420.00, 950.00, 2, 1, 'Fujitsu General', true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  item_type = EXCLUDED.item_type,
  price_sell = EXCLUDED.price_sell,
  price_buy = EXCLUDED.price_buy;

-- =====================================================
-- UNITES EXTERIEURES FUJITSU
-- =====================================================
INSERT INTO inventory_items (
  reference, name, description, item_type, category,
  price_sell, price_buy, quantity, min_threshold, supplier_name, is_active
) VALUES
  -- Mono-split
  ('FUJ-AOYG07KMCC', 'Fujitsu AOYG07KMCC - 2.0kW', 'Groupe extérieur mono 2.0kW R32', 'part', 'Unités extérieures', 850.00, 520.00, 4, 2, 'Fujitsu General', true),
  ('FUJ-AOYG09KMCC', 'Fujitsu AOYG09KMCC - 2.5kW', 'Groupe extérieur mono 2.5kW R32', 'part', 'Unités extérieures', 950.00, 580.00, 6, 2, 'Fujitsu General', true),
  ('FUJ-AOYG12KMCC', 'Fujitsu AOYG12KMCC - 3.5kW', 'Groupe extérieur mono 3.5kW R32', 'part', 'Unités extérieures', 1150.00, 700.00, 5, 2, 'Fujitsu General', true),
  ('FUJ-AOYG14KMCC', 'Fujitsu AOYG14KMCC - 4.2kW', 'Groupe extérieur mono 4.2kW R32', 'part', 'Unités extérieures', 1350.00, 820.00, 3, 2, 'Fujitsu General', true),
  ('FUJ-AOYG18KMCC', 'Fujitsu AOYG18KMCC - 5.2kW', 'Groupe extérieur mono 5.2kW R32', 'part', 'Unités extérieures', 1580.00, 980.00, 3, 2, 'Fujitsu General', true),

  -- Bi-split
  ('FUJ-AOYG14KBTA2', 'Fujitsu AOYG14KBTA2 Bi-split - 4.0kW', 'Groupe extérieur bi-split 4.0kW R32', 'part', 'Unités extérieures', 1650.00, 1050.00, 3, 1, 'Fujitsu General', true),
  ('FUJ-AOYG18KBTA2', 'Fujitsu AOYG18KBTA2 Bi-split - 5.4kW', 'Groupe extérieur bi-split 5.4kW R32', 'part', 'Unités extérieures', 1850.00, 1150.00, 3, 1, 'Fujitsu General', true),

  -- Tri-split
  ('FUJ-AOYG18KBTA3', 'Fujitsu AOYG18KBTA3 Tri-split - 5.4kW', 'Groupe extérieur tri-split 5.4kW R32', 'part', 'Unités extérieures', 2150.00, 1380.00, 2, 1, 'Fujitsu General', true),
  ('FUJ-AOYG24KBTA3', 'Fujitsu AOYG24KBTA3 Tri-split - 6.8kW', 'Groupe extérieur tri-split 6.8kW R32', 'part', 'Unités extérieures', 2450.00, 1520.00, 2, 1, 'Fujitsu General', true),

  -- Quadri-split
  ('FUJ-AOYG30KBTA4', 'Fujitsu AOYG30KBTA4 Quadri-split - 8.0kW', 'Groupe extérieur quadri-split 8.0kW R32', 'part', 'Unités extérieures', 2950.00, 1920.00, 2, 1, 'Fujitsu General', true),

  -- Penta-split
  ('FUJ-AOYG36KBTA5', 'Fujitsu AOYG36KBTA5 Penta-split - 10.0kW', 'Groupe extérieur penta-split 10.0kW R32', 'part', 'Unités extérieures', 3450.00, 2280.00, 1, 1, 'Fujitsu General', true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  item_type = EXCLUDED.item_type,
  price_sell = EXCLUDED.price_sell,
  price_buy = EXCLUDED.price_buy;

-- =====================================================
-- KITS COMPLETS FUJITSU
-- =====================================================
INSERT INTO inventory_items (
  reference, name, description, item_type, category,
  price_sell, price_buy, quantity, min_threshold, supplier_name, is_active
) VALUES
  ('KIT-FUJ-MONO-20', 'Kit Fujitsu Mono-split 2.0kW', 'Kit complet ASYG07+AOYG07 avec liaisons 4m', 'part', 'Kits complets', 1450.00, 950.00, 3, 1, 'Fujitsu General', true),
  ('KIT-FUJ-MONO-25', 'Kit Fujitsu Mono-split 2.5kW', 'Kit complet ASYG09+AOYG09 avec liaisons 4m', 'part', 'Kits complets', 1650.00, 1080.00, 4, 1, 'Fujitsu General', true),
  ('KIT-FUJ-MONO-35', 'Kit Fujitsu Mono-split 3.5kW', 'Kit complet ASYG12+AOYG12 avec liaisons 4m', 'part', 'Kits complets', 1950.00, 1280.00, 4, 1, 'Fujitsu General', true),
  ('KIT-FUJ-MONO-42', 'Kit Fujitsu Mono-split 4.2kW', 'Kit complet ASYG14+AOYG14 avec liaisons 4m', 'part', 'Kits complets', 2250.00, 1480.00, 3, 1, 'Fujitsu General', true),
  ('KIT-FUJ-BI-25-25', 'Kit Fujitsu Bi-split 2x2.5kW', 'Kit complet 2xASYG09+AOYG18 avec liaisons', 'part', 'Kits complets', 3200.00, 2100.00, 2, 1, 'Fujitsu General', true),
  ('KIT-FUJ-BI-25-35', 'Kit Fujitsu Bi-split 2.5+3.5kW', 'Kit complet ASYG09+ASYG12+AOYG18 avec liaisons', 'part', 'Kits complets', 3450.00, 2280.00, 2, 1, 'Fujitsu General', true),
  ('KIT-FUJ-TRI-25', 'Kit Fujitsu Tri-split 3x2.5kW', 'Kit complet 3xASYG09+AOYG24 avec liaisons', 'part', 'Kits complets', 4250.00, 2850.00, 2, 1, 'Fujitsu General', true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  item_type = EXCLUDED.item_type,
  price_sell = EXCLUDED.price_sell,
  price_buy = EXCLUDED.price_buy;

-- =====================================================
-- CONSOMMABLES ET ACCESSOIRES
-- =====================================================
INSERT INTO inventory_items (
  reference, name, description, item_type, category,
  price_sell, price_buy, quantity, min_threshold, supplier_name, is_active
) VALUES
  -- Liaisons frigorifiques
  ('LIAISON-1/4-3/8-3M', 'Liaison frigorifique 1/4-3/8 - 3m', 'Liaison pré-dudgeonnée isolée 3 mètres', 'part', 'Consommables', 65.00, 35.00, 20, 8, 'Froid Stock', true),
  ('LIAISON-1/4-3/8-5M', 'Liaison frigorifique 1/4-3/8 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', 'Consommables', 95.00, 52.00, 15, 6, 'Froid Stock', true),
  ('LIAISON-1/4-1/2-3M', 'Liaison frigorifique 1/4-1/2 - 3m', 'Liaison pré-dudgeonnée isolée 3 mètres', 'part', 'Consommables', 75.00, 42.00, 15, 6, 'Froid Stock', true),
  ('LIAISON-1/4-1/2-5M', 'Liaison frigorifique 1/4-1/2 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', 'Consommables', 110.00, 62.00, 12, 5, 'Froid Stock', true),
  ('LIAISON-1/4-5/8-5M', 'Liaison frigorifique 1/4-5/8 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', 'Consommables', 125.00, 72.00, 10, 4, 'Froid Stock', true),

  -- Supports et fixations
  ('SUPPORT-MUR-450', 'Support mural 450mm', 'Paire supports muraux 450mm galvanisés', 'part', 'Accessoires', 45.00, 22.00, 20, 8, 'Froid Stock', true),
  ('SUPPORT-MUR-550', 'Support mural 550mm', 'Paire supports muraux 550mm galvanisés', 'part', 'Accessoires', 55.00, 28.00, 15, 6, 'Froid Stock', true),
  ('SUPPORT-SOL-AMORT', 'Support sol avec amortisseurs', 'Paire supports sol avec silent-blocs', 'part', 'Accessoires', 75.00, 38.00, 15, 5, 'Froid Stock', true),
  ('SUPPORT-TOITURE', 'Support toiture universel', 'Support pour installation toiture terrasse', 'part', 'Accessoires', 125.00, 68.00, 8, 3, 'Froid Stock', true),

  -- Goulottes
  ('GOULOTTE-80X60-2M', 'Goulotte PVC 80x60mm - 2m', 'Goulotte décorative avec couvercle', 'part', 'Accessoires', 22.00, 11.00, 30, 12, 'Froid Stock', true),
  ('GOULOTTE-110X75-2M', 'Goulotte PVC 110x75mm - 2m', 'Goulotte décorative avec couvercle', 'part', 'Accessoires', 28.00, 14.00, 25, 10, 'Froid Stock', true),
  ('GOULOTTE-ANGLE-80', 'Angle goulotte 80x60mm', 'Angle intérieur ou extérieur', 'part', 'Accessoires', 8.00, 3.50, 40, 15, 'Froid Stock', true),
  ('GOULOTTE-ANGLE-110', 'Angle goulotte 110x75mm', 'Angle intérieur ou extérieur', 'part', 'Accessoires', 10.00, 4.50, 30, 12, 'Froid Stock', true),

  -- Évacuation condensats
  ('POMPE-RELEVAGE-MINI', 'Mini pompe de relevage', 'Pompe relevage condensats silencieuse', 'part', 'Accessoires', 85.00, 48.00, 10, 4, 'Froid Stock', true),
  ('POMPE-RELEVAGE-STD', 'Pompe de relevage standard', 'Pompe relevage condensats 10L/h', 'part', 'Accessoires', 125.00, 72.00, 8, 3, 'Froid Stock', true),
  ('TUYAU-PVC-16MM-25M', 'Tuyau PVC évacuation 16mm - 25m', 'Rouleau tuyau évacuation condensats', 'part', 'Consommables', 28.00, 14.00, 15, 6, 'Froid Stock', true),

  -- Câblage
  ('CABLE-4G1.5-25M', 'Câble liaison 4G1.5mm² - 25m', 'Câble électrique liaison unités', 'part', 'Consommables', 55.00, 28.00, 12, 5, 'Froid Stock', true),
  ('CABLE-4G2.5-25M', 'Câble liaison 4G2.5mm² - 25m', 'Câble électrique liaison unités puissantes', 'part', 'Consommables', 72.00, 38.00, 10, 4, 'Froid Stock', true),
  ('CABLE-3G2.5-25M', 'Câble alimentation 3G2.5mm² - 25m', 'Câble alimentation groupe extérieur', 'part', 'Consommables', 58.00, 30.00, 12, 5, 'Froid Stock', true),

  -- Accessoires WiFi
  ('WIFI-FUJ-UTY', 'Module WiFi Fujitsu UTY-TFSXF1', 'Adaptateur WiFi pour contrôle smartphone', 'part', 'Accessoires', 95.00, 58.00, 10, 5, 'Fujitsu General', true),

  -- Télécommandes
  ('TELECOM-FUJ-STD', 'Télécommande Fujitsu standard', 'Télécommande infrarouge universelle', 'part', 'Pièces détachées', 48.00, 26.00, 15, 6, 'Fujitsu General', true),
  ('TELECOM-FUJ-FILAIRE', 'Télécommande Fujitsu filaire', 'Commande murale filaire avec programmation', 'part', 'Pièces détachées', 125.00, 72.00, 8, 3, 'Fujitsu General', true),

  -- Gaz réfrigérant
  ('GAZ-R32-9KG', 'Gaz R32 bouteille 9kg', 'Bouteille réfrigérant R32 9kg', 'part', 'Gaz', 320.00, 180.00, 5, 2, 'Froid Stock', true),
  ('GAZ-R32-RECHARGE', 'Recharge R32 - 500g', 'Complément de charge R32', 'part', 'Gaz', 55.00, 28.00, 12, 5, 'Froid Stock', true),

  -- Pièces détachées
  ('FILTRE-FUJ-UNIV', 'Filtre à air Fujitsu', 'Filtre de rechange universel', 'part', 'Pièces détachées', 38.00, 18.00, 25, 10, 'Fujitsu General', true),
  ('CAPTEUR-FUJ-TEMP', 'Sonde température Fujitsu', 'Capteur CTN de remplacement', 'part', 'Pièces détachées', 32.00, 15.00, 10, 4, 'Fujitsu General', true),
  ('CARTE-FUJ-UI', 'Carte électronique unité int.', 'PCB de remplacement unité intérieure', 'part', 'Pièces détachées', 185.00, 95.00, 4, 2, 'Fujitsu General', true),
  ('VENTILO-FUJ-INT', 'Turbine unité intérieure', 'Ventilateur de remplacement', 'part', 'Pièces détachées', 95.00, 48.00, 6, 3, 'Fujitsu General', true),
  ('MOTEUR-FUJ-TURB', 'Moteur turbine intérieure', 'Moteur ventilateur de remplacement', 'part', 'Pièces détachées', 125.00, 68.00, 4, 2, 'Fujitsu General', true),
  ('COMPRESSEUR-FUJ-25', 'Compresseur Fujitsu 2.5kW', 'Compresseur de remplacement', 'part', 'Pièces détachées', 580.00, 320.00, 2, 1, 'Fujitsu General', true),

  -- Consommables divers
  ('MASTIC-CLIM-BLANC', 'Mastic climatisation blanc', 'Tube mastic étanchéité 310ml', 'part', 'Consommables', 12.00, 5.50, 25, 10, 'Froid Stock', true),
  ('BANDE-ARMAFLEX', 'Bande isolation Armaflex', 'Rouleau bande auto-adhésive 10m', 'part', 'Consommables', 18.00, 8.50, 20, 8, 'Froid Stock', true),
  ('COLLIER-ISOLE-16', 'Collier isophonique 16mm', 'Lot de 10 colliers fixation tuyauterie', 'part', 'Consommables', 15.00, 7.00, 20, 8, 'Froid Stock', true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  item_type = EXCLUDED.item_type,
  price_sell = EXCLUDED.price_sell,
  price_buy = EXCLUDED.price_buy;

-- =====================================================
-- Add selected_parts column to quotes if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'selected_parts'
  ) THEN
    ALTER TABLE quotes ADD COLUMN selected_parts jsonb DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN quotes.selected_parts IS 'JSON array of selected parts with quantities for this quote';
  END IF;
END $$;

-- =====================================================
-- Add labor_hours column to quotes if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'labor_hours'
  ) THEN
    ALTER TABLE quotes ADD COLUMN labor_hours numeric DEFAULT 0;
    COMMENT ON COLUMN quotes.labor_hours IS 'Estimated labor hours for this quote';
  END IF;
END $$;

-- =====================================================
-- Add labor_type column to quotes if not exists
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'labor_type'
  ) THEN
    ALTER TABLE quotes ADD COLUMN labor_type text DEFAULT 'installation';
    COMMENT ON COLUMN quotes.labor_type IS 'Type of labor: installation, entretien, depannage, reparation';
  END IF;
END $$;
