-- Migration: Base HVAC Stock with Fujitsu
-- Initial inventory for air conditioning business

INSERT INTO inventory_items (
  reference, name, category, supplier_name,
  quantity, min_threshold, price_buy, price_sell, is_active
) VALUES
  -- Unités intérieures murales Fujitsu
  ('FUJ-ASYG07KMCC', 'Fujitsu ASYG07KMCC - Unité murale 2.0kW', 'Unités intérieures', 'Fujitsu General', 5, 2, 280.00, 450.00, true),
  ('FUJ-ASYG09KMCC', 'Fujitsu ASYG09KMCC - Unité murale 2.5kW', 'Unités intérieures', 'Fujitsu General', 8, 3, 320.00, 520.00, true),
  ('FUJ-ASYG12KMCC', 'Fujitsu ASYG12KMCC - Unité murale 3.5kW', 'Unités intérieures', 'Fujitsu General', 6, 2, 380.00, 620.00, true),
  ('FUJ-ASYG14KMCC', 'Fujitsu ASYG14KMCC - Unité murale 4.2kW', 'Unités intérieures', 'Fujitsu General', 4, 2, 450.00, 720.00, true),

  -- Unités extérieures Fujitsu
  ('FUJ-AOYG07KMCC', 'Fujitsu AOYG07KMCC - Groupe ext. 2.0kW', 'Unités extérieures', 'Fujitsu General', 4, 2, 520.00, 850.00, true),
  ('FUJ-AOYG09KMCC', 'Fujitsu AOYG09KMCC - Groupe ext. 2.5kW', 'Unités extérieures', 'Fujitsu General', 6, 2, 580.00, 950.00, true),
  ('FUJ-AOYG12KMCC', 'Fujitsu AOYG12KMCC - Groupe ext. 3.5kW', 'Unités extérieures', 'Fujitsu General', 5, 2, 700.00, 1150.00, true),
  ('FUJ-AOYG14KMCC', 'Fujitsu AOYG14KMCC - Groupe ext. 4.2kW', 'Unités extérieures', 'Fujitsu General', 3, 2, 820.00, 1350.00, true),

  -- Multi-split Fujitsu
  ('FUJ-AOYG18KBTA2', 'Fujitsu AOYG18KBTA2 - Bi-split 5.4kW', 'Unités extérieures', 'Fujitsu General', 3, 1, 1150.00, 1850.00, true),
  ('FUJ-AOYG24KBTA3', 'Fujitsu AOYG24KBTA3 - Tri-split 6.8kW', 'Unités extérieures', 'Fujitsu General', 2, 1, 1520.00, 2450.00, true),

  -- Tubes cuivre frigorifique
  ('CUIVRE-1/4-50M', 'Tube cuivre 1/4" - Rouleau 50m', 'Consommables', 'Froid Stock', 10, 3, 95.00, 180.00, true),
  ('CUIVRE-3/8-50M', 'Tube cuivre 3/8" - Rouleau 50m', 'Consommables', 'Froid Stock', 8, 3, 115.00, 220.00, true),
  ('CUIVRE-1/2-50M', 'Tube cuivre 1/2" - Rouleau 50m', 'Consommables', 'Froid Stock', 6, 2, 145.00, 280.00, true),
  ('CUIVRE-5/8-50M', 'Tube cuivre 5/8" - Rouleau 50m', 'Consommables', 'Froid Stock', 4, 2, 180.00, 350.00, true),

  -- Isolation Armaflex
  ('ARMAFLEX-9MM', 'Isolation Armaflex 9mm - Carton 50m', 'Consommables', 'Froid Stock', 15, 5, 45.00, 85.00, true),
  ('ARMAFLEX-13MM', 'Isolation Armaflex 13mm - Carton 50m', 'Consommables', 'Froid Stock', 12, 5, 52.00, 95.00, true),
  ('ARMAFLEX-19MM', 'Isolation Armaflex 19mm - Carton 25m', 'Consommables', 'Froid Stock', 8, 3, 65.00, 120.00, true),

  -- Supports et fixations
  ('SUPPORT-MUR-450', 'Support mural 450mm - Paire', 'Accessoires', 'Froid Stock', 20, 8, 22.00, 45.00, true),
  ('SUPPORT-SOL-AMORT', 'Support sol avec amortisseurs - Paire', 'Accessoires', 'Froid Stock', 15, 5, 35.00, 65.00, true),
  ('GOULOTTE-80X60', 'Goulotte PVC 80x60mm - Barre 2m', 'Accessoires', 'Froid Stock', 30, 10, 9.00, 18.00, true),
  ('GOULOTTE-110X75', 'Goulotte PVC 110x75mm - Barre 2m', 'Accessoires', 'Froid Stock', 25, 8, 12.00, 24.00, true),

  -- Gaz réfrigérant
  ('GAZ-R32-9KG', 'Gaz réfrigérant R32 - Bouteille 9kg', 'Gaz', 'Froid Stock', 5, 2, 180.00, 320.00, true),
  ('GAZ-R410A-11KG', 'Gaz réfrigérant R410A - Bouteille 11kg', 'Gaz', 'Froid Stock', 4, 2, 150.00, 280.00, true),
  ('GAZ-R32-RECHARGE', 'Recharge R32 - 500g', 'Gaz', 'Froid Stock', 10, 5, 25.00, 55.00, true),

  -- Pièces détachées Fujitsu
  ('FILTRE-FUJ-UNIV', 'Filtre à air Fujitsu universel', 'Pièces détachées', 'Fujitsu General', 25, 10, 18.00, 35.00, true),
  ('TELECOM-FUJ-IR', 'Télécommande Fujitsu infrarouge', 'Pièces détachées', 'Fujitsu General', 10, 5, 25.00, 45.00, true),
  ('CAPTEUR-FUJ-TEMP', 'Sonde température Fujitsu', 'Pièces détachées', 'Fujitsu General', 8, 4, 14.00, 28.00, true),
  ('CARTE-FUJ-PCB', 'Carte électronique Fujitsu universelle', 'Pièces détachées', 'Fujitsu General', 3, 2, 85.00, 165.00, true),
  ('VENTILO-FUJ-INT', 'Ventilateur unité intérieure Fujitsu', 'Pièces détachées', 'Fujitsu General', 5, 2, 45.00, 95.00, true),

  -- Outillage et consommables divers
  ('MASTIC-CLIM', 'Mastic climatisation blanc - Tube 310ml', 'Consommables', 'Froid Stock', 20, 10, 4.50, 9.00, true),
  ('RACCORD-FLARE-1/4', 'Raccord flare 1/4" - Lot de 10', 'Consommables', 'Froid Stock', 15, 5, 8.00, 18.00, true),
  ('RACCORD-FLARE-3/8', 'Raccord flare 3/8" - Lot de 10', 'Consommables', 'Froid Stock', 15, 5, 10.00, 22.00, true),
  ('CABLE-INTER-4X1.5', 'Câble liaison 4x1.5mm² - 50m', 'Consommables', 'Froid Stock', 8, 3, 55.00, 95.00, true),

  -- Kits complets
  ('KIT-MONO-25-FUJ', 'Kit Fujitsu Mono-split 2.5kW complet', 'Kits complets', 'Fujitsu General', 3, 1, 1020.00, 1650.00, true),
  ('KIT-MONO-35-FUJ', 'Kit Fujitsu Mono-split 3.5kW complet', 'Kits complets', 'Fujitsu General', 3, 1, 1200.00, 1950.00, true),
  ('KIT-BI-SPLIT-FUJ', 'Kit Fujitsu Bi-split 2x2.5kW complet', 'Kits complets', 'Fujitsu General', 2, 1, 2000.00, 3200.00, true)

ON CONFLICT (reference) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  supplier_name = EXCLUDED.supplier_name,
  price_buy = EXCLUDED.price_buy,
  price_sell = EXCLUDED.price_sell;
