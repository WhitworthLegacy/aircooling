-- Migration: Extended Fujitsu Parts + Labor Rates
-- Complete inventory for HVAC quoting system

-- =====================================================
-- LABOR RATES (Main d'oeuvre)
-- =====================================================
INSERT INTO inventory_items (
  sku, name, description, item_type, category_id,
  sell_price, cost_price, track_stock, is_active
) VALUES
  -- Main d'oeuvre installation
  ('LABOR-INSTALL-STD', 'Main d''oeuvre installation standard', 'Heure de travail installation mono-split ou bi-split', 'labor', NULL, 65.00, 0, false, true),
  ('LABOR-INSTALL-COMPLEX', 'Main d''oeuvre installation complexe', 'Heure de travail installation multi-split, gainable, cassette', 'labor', NULL, 85.00, 0, false, true),
  ('LABOR-INSTALL-FORFAIT-MONO', 'Forfait installation mono-split', 'Installation complète mono-split (mise en service incluse)', 'labor', NULL, 450.00, 0, false, true),
  ('LABOR-INSTALL-FORFAIT-BI', 'Forfait installation bi-split', 'Installation complète bi-split (mise en service incluse)', 'labor', NULL, 750.00, 0, false, true),
  ('LABOR-INSTALL-FORFAIT-TRI', 'Forfait installation tri-split', 'Installation complète tri-split (mise en service incluse)', 'labor', NULL, 950.00, 0, false, true),

  -- Main d'oeuvre entretien
  ('LABOR-ENTRETIEN', 'Main d''oeuvre entretien annuel', 'Heure de travail entretien et maintenance', 'labor', NULL, 55.00, 0, false, true),
  ('LABOR-ENTRETIEN-FORFAIT', 'Forfait entretien annuel complet', 'Entretien complet avec nettoyage filtres, vérification gaz, test', 'labor', NULL, 120.00, 0, false, true),
  ('LABOR-ENTRETIEN-MULTI', 'Forfait entretien multi-split', 'Entretien complet système multi-split (jusqu''à 4 unités)', 'labor', NULL, 180.00, 0, false, true),

  -- Main d'oeuvre dépannage/réparation
  ('LABOR-DEPANNAGE', 'Main d''oeuvre dépannage', 'Heure de travail dépannage et diagnostic', 'labor', NULL, 75.00, 0, false, true),
  ('LABOR-DEPANNAGE-FORFAIT', 'Forfait déplacement + diagnostic', 'Déplacement + première heure de diagnostic', 'labor', NULL, 95.00, 0, false, true),
  ('LABOR-REPARATION', 'Main d''oeuvre réparation', 'Heure de travail réparation', 'labor', NULL, 70.00, 0, false, true),

  -- Frais de déplacement
  ('LABOR-DEPLACEMENT-STD', 'Déplacement zone standard', 'Frais de déplacement zone Bruxelles/périphérie', 'fee', NULL, 35.00, 0, false, true),
  ('LABOR-DEPLACEMENT-LONG', 'Déplacement longue distance', 'Frais de déplacement hors zone (>30km)', 'fee', NULL, 65.00, 0, false, true),

  -- Mise en service
  ('LABOR-MES', 'Mise en service', 'Mise en service et test fonctionnement', 'labor', NULL, 120.00, 0, false, true),
  ('LABOR-MES-MULTI', 'Mise en service multi-split', 'Mise en service système multi-split', 'labor', NULL, 180.00, 0, false, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sell_price = EXCLUDED.sell_price;

-- =====================================================
-- UNITES INTERIEURES FUJITSU (Gamme complète)
-- =====================================================
INSERT INTO inventory_items (
  sku, name, description, item_type, category_id,
  sell_price, cost_price, stock_qty, stock_min, supplier, supplier_ref, track_stock, is_active
) VALUES
  -- Gamme KMCC (Standard)
  ('FUJ-ASYG07KMCC', 'Fujitsu ASYG07KMCC - 2.0kW', 'Unité murale 2.0kW R32 - Gamme standard', 'part', NULL, 450.00, 280.00, 5, 2, 'Fujitsu General', 'ASYG07KMCC', true, true),
  ('FUJ-ASYG09KMCC', 'Fujitsu ASYG09KMCC - 2.5kW', 'Unité murale 2.5kW R32 - Gamme standard', 'part', NULL, 520.00, 320.00, 8, 3, 'Fujitsu General', 'ASYG09KMCC', true, true),
  ('FUJ-ASYG12KMCC', 'Fujitsu ASYG12KMCC - 3.5kW', 'Unité murale 3.5kW R32 - Gamme standard', 'part', NULL, 620.00, 380.00, 6, 2, 'Fujitsu General', 'ASYG12KMCC', true, true),
  ('FUJ-ASYG14KMCC', 'Fujitsu ASYG14KMCC - 4.2kW', 'Unité murale 4.2kW R32 - Gamme standard', 'part', NULL, 720.00, 450.00, 4, 2, 'Fujitsu General', 'ASYG14KMCC', true, true),
  ('FUJ-ASYG18KMCC', 'Fujitsu ASYG18KMCC - 5.2kW', 'Unité murale 5.2kW R32 - Gamme standard', 'part', NULL, 850.00, 550.00, 3, 2, 'Fujitsu General', 'ASYG18KMCC', true, true),

  -- Gamme KGTA (Design)
  ('FUJ-ASYG09KGTA', 'Fujitsu ASYG09KGTA Design - 2.5kW', 'Unité murale design 2.5kW R32', 'part', NULL, 680.00, 420.00, 4, 2, 'Fujitsu General', 'ASYG09KGTA', true, true),
  ('FUJ-ASYG12KGTA', 'Fujitsu ASYG12KGTA Design - 3.5kW', 'Unité murale design 3.5kW R32', 'part', NULL, 780.00, 480.00, 4, 2, 'Fujitsu General', 'ASYG12KGTA', true, true),
  ('FUJ-ASYG14KGTA', 'Fujitsu ASYG14KGTA Design - 4.2kW', 'Unité murale design 4.2kW R32', 'part', NULL, 880.00, 560.00, 3, 2, 'Fujitsu General', 'ASYG14KGTA', true, true),

  -- Gamme LUCA (Premium)
  ('FUJ-ASYG09LUCA', 'Fujitsu ASYG09LUCA Premium - 2.5kW', 'Unité murale premium 2.5kW R32 WiFi intégré', 'part', NULL, 850.00, 540.00, 3, 1, 'Fujitsu General', 'ASYG09LUCA', true, true),
  ('FUJ-ASYG12LUCA', 'Fujitsu ASYG12LUCA Premium - 3.5kW', 'Unité murale premium 3.5kW R32 WiFi intégré', 'part', NULL, 950.00, 620.00, 3, 1, 'Fujitsu General', 'ASYG12LUCA', true, true),
  ('FUJ-ASYG14LUCA', 'Fujitsu ASYG14LUCA Premium - 4.2kW', 'Unité murale premium 4.2kW R32 WiFi intégré', 'part', NULL, 1080.00, 720.00, 2, 1, 'Fujitsu General', 'ASYG14LUCA', true, true),

  -- Consoles
  ('FUJ-AGYG09LVCA', 'Fujitsu Console AGYG09LVCA - 2.5kW', 'Console sol 2.5kW R32', 'part', NULL, 920.00, 580.00, 2, 1, 'Fujitsu General', 'AGYG09LVCA', true, true),
  ('FUJ-AGYG12LVCA', 'Fujitsu Console AGYG12LVCA - 3.5kW', 'Console sol 3.5kW R32', 'part', NULL, 1050.00, 680.00, 2, 1, 'Fujitsu General', 'AGYG12LVCA', true, true),
  ('FUJ-AGYG14LVCA', 'Fujitsu Console AGYG14LVCA - 4.2kW', 'Console sol 4.2kW R32', 'part', NULL, 1180.00, 780.00, 2, 1, 'Fujitsu General', 'AGYG14LVCA', true, true),

  -- Cassettes
  ('FUJ-AUXG09KVLA', 'Fujitsu Cassette AUXG09KVLA - 2.5kW', 'Cassette plafond 4 voies 2.5kW R32', 'part', NULL, 1250.00, 820.00, 2, 1, 'Fujitsu General', 'AUXG09KVLA', true, true),
  ('FUJ-AUXG12KVLA', 'Fujitsu Cassette AUXG12KVLA - 3.5kW', 'Cassette plafond 4 voies 3.5kW R32', 'part', NULL, 1380.00, 920.00, 2, 1, 'Fujitsu General', 'AUXG12KVLA', true, true),
  ('FUJ-AUXG14KVLA', 'Fujitsu Cassette AUXG14KVLA - 4.2kW', 'Cassette plafond 4 voies 4.2kW R32', 'part', NULL, 1520.00, 1020.00, 2, 1, 'Fujitsu General', 'AUXG14KVLA', true, true),

  -- Gainable
  ('FUJ-ARXG09KLLAP', 'Fujitsu Gainable ARXG09KLLAP - 2.5kW', 'Gainable slim basse pression 2.5kW R32', 'part', NULL, 1150.00, 750.00, 2, 1, 'Fujitsu General', 'ARXG09KLLAP', true, true),
  ('FUJ-ARXG12KLLAP', 'Fujitsu Gainable ARXG12KLLAP - 3.5kW', 'Gainable slim basse pression 3.5kW R32', 'part', NULL, 1280.00, 850.00, 2, 1, 'Fujitsu General', 'ARXG12KLLAP', true, true),
  ('FUJ-ARXG14KLLAP', 'Fujitsu Gainable ARXG14KLLAP - 4.2kW', 'Gainable slim basse pression 4.2kW R32', 'part', NULL, 1420.00, 950.00, 2, 1, 'Fujitsu General', 'ARXG14KLLAP', true, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sell_price = EXCLUDED.sell_price,
  cost_price = EXCLUDED.cost_price;

-- =====================================================
-- UNITES EXTERIEURES FUJITSU
-- =====================================================
INSERT INTO inventory_items (
  sku, name, description, item_type, category_id,
  sell_price, cost_price, stock_qty, stock_min, supplier, supplier_ref, track_stock, is_active
) VALUES
  -- Mono-split
  ('FUJ-AOYG07KMCC', 'Fujitsu AOYG07KMCC - 2.0kW', 'Groupe extérieur mono 2.0kW R32', 'part', NULL, 850.00, 520.00, 4, 2, 'Fujitsu General', 'AOYG07KMCC', true, true),
  ('FUJ-AOYG09KMCC', 'Fujitsu AOYG09KMCC - 2.5kW', 'Groupe extérieur mono 2.5kW R32', 'part', NULL, 950.00, 580.00, 6, 2, 'Fujitsu General', 'AOYG09KMCC', true, true),
  ('FUJ-AOYG12KMCC', 'Fujitsu AOYG12KMCC - 3.5kW', 'Groupe extérieur mono 3.5kW R32', 'part', NULL, 1150.00, 700.00, 5, 2, 'Fujitsu General', 'AOYG12KMCC', true, true),
  ('FUJ-AOYG14KMCC', 'Fujitsu AOYG14KMCC - 4.2kW', 'Groupe extérieur mono 4.2kW R32', 'part', NULL, 1350.00, 820.00, 3, 2, 'Fujitsu General', 'AOYG14KMCC', true, true),
  ('FUJ-AOYG18KMCC', 'Fujitsu AOYG18KMCC - 5.2kW', 'Groupe extérieur mono 5.2kW R32', 'part', NULL, 1580.00, 980.00, 3, 2, 'Fujitsu General', 'AOYG18KMCC', true, true),

  -- Bi-split
  ('FUJ-AOYG14KBTA2', 'Fujitsu AOYG14KBTA2 Bi-split - 4.0kW', 'Groupe extérieur bi-split 4.0kW R32', 'part', NULL, 1650.00, 1050.00, 3, 1, 'Fujitsu General', 'AOYG14KBTA2', true, true),
  ('FUJ-AOYG18KBTA2', 'Fujitsu AOYG18KBTA2 Bi-split - 5.4kW', 'Groupe extérieur bi-split 5.4kW R32', 'part', NULL, 1850.00, 1150.00, 3, 1, 'Fujitsu General', 'AOYG18KBTA2', true, true),

  -- Tri-split
  ('FUJ-AOYG18KBTA3', 'Fujitsu AOYG18KBTA3 Tri-split - 5.4kW', 'Groupe extérieur tri-split 5.4kW R32', 'part', NULL, 2150.00, 1380.00, 2, 1, 'Fujitsu General', 'AOYG18KBTA3', true, true),
  ('FUJ-AOYG24KBTA3', 'Fujitsu AOYG24KBTA3 Tri-split - 6.8kW', 'Groupe extérieur tri-split 6.8kW R32', 'part', NULL, 2450.00, 1520.00, 2, 1, 'Fujitsu General', 'AOYG24KBTA3', true, true),

  -- Quadri-split
  ('FUJ-AOYG30KBTA4', 'Fujitsu AOYG30KBTA4 Quadri-split - 8.0kW', 'Groupe extérieur quadri-split 8.0kW R32', 'part', NULL, 2950.00, 1920.00, 2, 1, 'Fujitsu General', 'AOYG30KBTA4', true, true),

  -- Penta-split
  ('FUJ-AOYG36KBTA5', 'Fujitsu AOYG36KBTA5 Penta-split - 10.0kW', 'Groupe extérieur penta-split 10.0kW R32', 'part', NULL, 3450.00, 2280.00, 1, 1, 'Fujitsu General', 'AOYG36KBTA5', true, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sell_price = EXCLUDED.sell_price,
  cost_price = EXCLUDED.cost_price;

-- =====================================================
-- KITS COMPLETS FUJITSU (avec prix attractifs)
-- =====================================================
INSERT INTO inventory_items (
  sku, name, description, item_type, category_id,
  sell_price, cost_price, stock_qty, stock_min, supplier, supplier_ref, track_stock, is_active
) VALUES
  ('KIT-FUJ-MONO-20', 'Kit Fujitsu Mono-split 2.0kW', 'Kit complet ASYG07+AOYG07 avec liaisons 4m', 'part', NULL, 1450.00, 950.00, 3, 1, 'Fujitsu General', 'KIT-MONO-20', true, true),
  ('KIT-FUJ-MONO-25', 'Kit Fujitsu Mono-split 2.5kW', 'Kit complet ASYG09+AOYG09 avec liaisons 4m', 'part', NULL, 1650.00, 1080.00, 4, 1, 'Fujitsu General', 'KIT-MONO-25', true, true),
  ('KIT-FUJ-MONO-35', 'Kit Fujitsu Mono-split 3.5kW', 'Kit complet ASYG12+AOYG12 avec liaisons 4m', 'part', NULL, 1950.00, 1280.00, 4, 1, 'Fujitsu General', 'KIT-MONO-35', true, true),
  ('KIT-FUJ-MONO-42', 'Kit Fujitsu Mono-split 4.2kW', 'Kit complet ASYG14+AOYG14 avec liaisons 4m', 'part', NULL, 2250.00, 1480.00, 3, 1, 'Fujitsu General', 'KIT-MONO-42', true, true),
  ('KIT-FUJ-BI-25-25', 'Kit Fujitsu Bi-split 2x2.5kW', 'Kit complet 2xASYG09+AOYG18 avec liaisons', 'part', NULL, 3200.00, 2100.00, 2, 1, 'Fujitsu General', 'KIT-BI-25-25', true, true),
  ('KIT-FUJ-BI-25-35', 'Kit Fujitsu Bi-split 2.5+3.5kW', 'Kit complet ASYG09+ASYG12+AOYG18 avec liaisons', 'part', NULL, 3450.00, 2280.00, 2, 1, 'Fujitsu General', 'KIT-BI-25-35', true, true),
  ('KIT-FUJ-TRI-25', 'Kit Fujitsu Tri-split 3x2.5kW', 'Kit complet 3xASYG09+AOYG24 avec liaisons', 'part', NULL, 4250.00, 2850.00, 2, 1, 'Fujitsu General', 'KIT-TRI-25', true, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sell_price = EXCLUDED.sell_price,
  cost_price = EXCLUDED.cost_price;

-- =====================================================
-- CONSOMMABLES ET ACCESSOIRES
-- =====================================================
INSERT INTO inventory_items (
  sku, name, description, item_type, category_id,
  sell_price, cost_price, stock_qty, stock_min, supplier, track_stock, is_active
) VALUES
  -- Liaisons frigorifiques
  ('LIAISON-1/4-3/8-3M', 'Liaison frigorifique 1/4-3/8 - 3m', 'Liaison pré-dudgeonnée isolée 3 mètres', 'part', NULL, 65.00, 35.00, 20, 8, 'Froid Stock', true, true),
  ('LIAISON-1/4-3/8-5M', 'Liaison frigorifique 1/4-3/8 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', NULL, 95.00, 52.00, 15, 6, 'Froid Stock', true, true),
  ('LIAISON-1/4-1/2-3M', 'Liaison frigorifique 1/4-1/2 - 3m', 'Liaison pré-dudgeonnée isolée 3 mètres', 'part', NULL, 75.00, 42.00, 15, 6, 'Froid Stock', true, true),
  ('LIAISON-1/4-1/2-5M', 'Liaison frigorifique 1/4-1/2 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', NULL, 110.00, 62.00, 12, 5, 'Froid Stock', true, true),
  ('LIAISON-1/4-5/8-5M', 'Liaison frigorifique 1/4-5/8 - 5m', 'Liaison pré-dudgeonnée isolée 5 mètres', 'part', NULL, 125.00, 72.00, 10, 4, 'Froid Stock', true, true),

  -- Supports et fixations
  ('SUPPORT-MUR-450', 'Support mural 450mm', 'Paire supports muraux 450mm galvanisés', 'part', NULL, 45.00, 22.00, 20, 8, 'Froid Stock', true, true),
  ('SUPPORT-MUR-550', 'Support mural 550mm', 'Paire supports muraux 550mm galvanisés', 'part', NULL, 55.00, 28.00, 15, 6, 'Froid Stock', true, true),
  ('SUPPORT-SOL-AMORT', 'Support sol avec amortisseurs', 'Paire supports sol avec silent-blocs', 'part', NULL, 75.00, 38.00, 15, 5, 'Froid Stock', true, true),
  ('SUPPORT-TOITURE', 'Support toiture universel', 'Support pour installation toiture terrasse', 'part', NULL, 125.00, 68.00, 8, 3, 'Froid Stock', true, true),

  -- Goulottes
  ('GOULOTTE-80X60-2M', 'Goulotte PVC 80x60mm - 2m', 'Goulotte décorative avec couvercle', 'part', NULL, 22.00, 11.00, 30, 12, 'Froid Stock', true, true),
  ('GOULOTTE-110X75-2M', 'Goulotte PVC 110x75mm - 2m', 'Goulotte décorative avec couvercle', 'part', NULL, 28.00, 14.00, 25, 10, 'Froid Stock', true, true),
  ('GOULOTTE-ANGLE-80', 'Angle goulotte 80x60mm', 'Angle intérieur ou extérieur', 'part', NULL, 8.00, 3.50, 40, 15, 'Froid Stock', true, true),
  ('GOULOTTE-ANGLE-110', 'Angle goulotte 110x75mm', 'Angle intérieur ou extérieur', 'part', NULL, 10.00, 4.50, 30, 12, 'Froid Stock', true, true),

  -- Évacuation condensats
  ('POMPE-RELEVAGE-MINI', 'Mini pompe de relevage', 'Pompe relevage condensats silencieuse', 'part', NULL, 85.00, 48.00, 10, 4, 'Froid Stock', true, true),
  ('POMPE-RELEVAGE-STD', 'Pompe de relevage standard', 'Pompe relevage condensats 10L/h', 'part', NULL, 125.00, 72.00, 8, 3, 'Froid Stock', true, true),
  ('TUYAU-PVC-16MM-25M', 'Tuyau PVC évacuation 16mm - 25m', 'Rouleau tuyau évacuation condensats', 'part', NULL, 28.00, 14.00, 15, 6, 'Froid Stock', true, true),

  -- Câblage
  ('CABLE-4G1.5-25M', 'Câble liaison 4G1.5mm² - 25m', 'Câble électrique liaison unités', 'part', NULL, 55.00, 28.00, 12, 5, 'Froid Stock', true, true),
  ('CABLE-4G2.5-25M', 'Câble liaison 4G2.5mm² - 25m', 'Câble électrique liaison unités puissantes', 'part', NULL, 72.00, 38.00, 10, 4, 'Froid Stock', true, true),
  ('CABLE-3G2.5-25M', 'Câble alimentation 3G2.5mm² - 25m', 'Câble alimentation groupe extérieur', 'part', NULL, 58.00, 30.00, 12, 5, 'Froid Stock', true, true),

  -- Accessoires WiFi
  ('WIFI-FUJ-UTY', 'Module WiFi Fujitsu UTY-TFSXF1', 'Adaptateur WiFi pour contrôle smartphone', 'part', NULL, 95.00, 58.00, 10, 5, 'Fujitsu General', true, true),

  -- Télécommandes
  ('TELECOM-FUJ-STD', 'Télécommande Fujitsu standard', 'Télécommande infrarouge universelle', 'part', NULL, 48.00, 26.00, 15, 6, 'Fujitsu General', true, true),
  ('TELECOM-FUJ-FILAIRE', 'Télécommande Fujitsu filaire', 'Commande murale filaire avec programmation', 'part', NULL, 125.00, 72.00, 8, 3, 'Fujitsu General', true, true),

  -- Gaz réfrigérant
  ('GAZ-R32-9KG', 'Gaz R32 bouteille 9kg', 'Bouteille réfrigérant R32 9kg', 'part', NULL, 320.00, 180.00, 5, 2, 'Froid Stock', true, true),
  ('GAZ-R32-RECHARGE', 'Recharge R32 - 500g', 'Complément de charge R32', 'part', NULL, 55.00, 28.00, 12, 5, 'Froid Stock', true, true),

  -- Pièces détachées
  ('FILTRE-FUJ-UNIV', 'Filtre à air Fujitsu', 'Filtre de rechange universel', 'part', NULL, 38.00, 18.00, 25, 10, 'Fujitsu General', true, true),
  ('CAPTEUR-FUJ-TEMP', 'Sonde température Fujitsu', 'Capteur CTN de remplacement', 'part', NULL, 32.00, 15.00, 10, 4, 'Fujitsu General', true, true),
  ('CARTE-FUJ-UI', 'Carte électronique unité int.', 'PCB de remplacement unité intérieure', 'part', NULL, 185.00, 95.00, 4, 2, 'Fujitsu General', true, true),
  ('VENTILO-FUJ-INT', 'Turbine unité intérieure', 'Ventilateur de remplacement', 'part', NULL, 95.00, 48.00, 6, 3, 'Fujitsu General', true, true),
  ('MOTEUR-FUJ-TURB', 'Moteur turbine intérieure', 'Moteur ventilateur de remplacement', 'part', NULL, 125.00, 68.00, 4, 2, 'Fujitsu General', true, true),
  ('COMPRESSEUR-FUJ-25', 'Compresseur Fujitsu 2.5kW', 'Compresseur de remplacement', 'part', NULL, 580.00, 320.00, 2, 1, 'Fujitsu General', true, true),

  -- Consommables divers
  ('MASTIC-CLIM-BLANC', 'Mastic climatisation blanc', 'Tube mastic étanchéité 310ml', 'part', NULL, 12.00, 5.50, 25, 10, 'Froid Stock', true, true),
  ('BANDE-ARMAFLEX', 'Bande isolation Armaflex', 'Rouleau bande auto-adhésive 10m', 'part', NULL, 18.00, 8.50, 20, 8, 'Froid Stock', true, true),
  ('COLLIER-ISOLE-16', 'Collier isophonique 16mm', 'Lot de 10 colliers fixation tuyauterie', 'part', NULL, 15.00, 7.00, 20, 8, 'Froid Stock', true, true)

ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sell_price = EXCLUDED.sell_price,
  cost_price = EXCLUDED.cost_price;

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
