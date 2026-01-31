"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  ShoppingCart,
  Search,
  ArrowDown,
  ArrowUp,
  Trash2,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Badge, Button, Card, Input, Modal, Select } from '@/components/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type InventoryItem = {
  id: string;
  name: string;
  reference?: string;
  supplier_name?: string;
  quantity: number;
  min_threshold: number;
  price_buy?: number;
  price_sell?: number;
  image_url?: string;
  // Legacy: products relation (will be auto-synced via trigger)
  products?: Array<{ cover_image_url?: string; slug?: string }>;
};

type Client = {
  id: string;
  full_name?: string;
  client_name?: string;
};

const EMPTY_FORM = {
  name: '',
  reference: '',
  supplier_name: '',
  quantity: 0,
  min_threshold: 5,
  price_buy: '',
  price_sell: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();

      // Fetch inventory items
      const { data: inventoryData, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      // Fetch products to get cover images
      const { data: productsData } = await supabase
        .from('products')
        .select('id, cover_image_url, slug, inventory_item_id');

      // Map products to inventory items
      const itemsWithProducts = (inventoryData || []).map((item) => {
        const relatedProducts = (productsData || []).filter(
          (p) => p.inventory_item_id === item.id
        );
        return {
          ...item,
          products: relatedProducts,
        };
      });

      setItems(itemsWithProducts);
    } catch (err) {
      console.error('[Inventory] fetch failed', err);
      setError('Impossible de charger le stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.reference?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const lowStockItems = useMemo(
    () => items.filter((i) => i.quantity <= i.min_threshold),
    [items]
  );

  const getCoverImage = (item: InventoryItem) => {
    // Priority: item.image_url > products[0].cover_image_url
    if (item.image_url) return item.image_url;
    const product = Array.isArray(item.products) ? item.products[0] : undefined;
    return product?.cover_image_url || null;
  };

  const formatPrice = (value?: number | string) => {
    if (value == null || value === '') return '—';
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return '—';
    return `${parsed.toFixed(2)}€`;
  };

  const openItemModal = (item: InventoryItem | null) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setSelectedItem(null);
    fetchItems();
  };

  return (
    <>
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-airDark flex items-center gap-2">
                <Package className="w-6 h-6" />
                Gestion du Stock
              </h1>
              <p className="text-sm text-airMuted mt-1">
                {items.length} articles • {lowStockItems.length} en alerte
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => openItemModal(null)}
            >
              Nouvel article
            </Button>
          </div>

          {/* Search */}
          <Input
            icon={<Search className="w-4 h-4 text-airMuted" />}
            placeholder="Chercher pièce, référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>
                  <strong>{lowStockItems.length} articles</strong> bientôt épuisés !
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<ShoppingCart className="w-4 h-4" />}
                onClick={() => {
                  // Generate CSV content
                  const headers = ['Article', 'Référence', 'Fournisseur', 'Stock actuel', 'Seuil min', 'À commander'];
                  const rows = lowStockItems.map((i) => [
                    i.name,
                    i.reference || '',
                    i.supplier_name || '',
                    String(i.quantity),
                    String(i.min_threshold),
                    String(Math.max(0, i.min_threshold * 2 - i.quantity)), // Suggest ordering 2x threshold - current
                  ]);
                  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

                  // Download CSV
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `commande_stock_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="!bg-red-600 !text-white hover:!bg-red-700"
              >
                Télécharger CSV
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-airPrimary" />
            </div>
          )}

          {/* Items grid */}
          {!loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => openItemModal(item)}
                  className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                    item.quantity <= item.min_threshold
                      ? 'border-l-red-500'
                      : 'border-l-green-500'
                  }`}
                >
                  <div className="w-full aspect-square bg-airSurface rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {getCoverImage(item) ? (
                      <img
                        src={getCoverImage(item)!}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-airBorder" />
                    )}
                  </div>
                  <h3 className="font-semibold text-airDark truncate">{item.name}</h3>
                  <p className="text-xs text-airMuted mt-1">
                    Ref: {item.reference || 'N/A'}
                  </p>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="text-lg font-bold text-airDark">
                      {formatPrice(item.price_sell)}
                    </span>
                    <span className="text-xs text-airMuted">
                      Achat: {formatPrice(item.price_buy)}
                    </span>
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      item.quantity <= item.min_threshold
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    Stock: {item.quantity} / min {item.min_threshold}
                  </div>
                </Card>
              ))}
              {filteredItems.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 text-airMuted">
                  Aucun article trouvé
                </div>
              )}
            </div>
          )}
        </div>
      </PageContainer>

      {/* Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? 'Fiche article' : 'Nouvel article'}
        size="3xl"
      >
        <InventoryItemForm
          item={selectedItem}
          onSaved={handleSaved}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

function InventoryItemForm({
  item,
  onSaved,
  onClose,
}: {
  item: InventoryItem | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const isNew = !item?.id;
  const [formData, setFormData] = useState(
    item
      ? {
          name: item.name || '',
          reference: item.reference || '',
          supplier_name: item.supplier_name || '',
          quantity: item.quantity ?? 0,
          min_threshold: item.min_threshold ?? 5,
          price_buy: item.price_buy?.toString() || '',
          price_sell: item.price_sell?.toString() || '',
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Movement state
  const [movementQty, setMovementQty] = useState(1);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('OUT');
  const [movementError, setMovementError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [technician, setTechnician] = useState('');
  const [technicians, setTechnicians] = useState<Array<{ id: string; full_name: string }>>([]);

  const currentQty = item?.quantity ?? formData.quantity ?? 0;

  // Image state - prioritize item.image_url over products
  const [imageUrl, setImageUrl] = useState(item?.image_url || item?.products?.[0]?.cover_image_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item?.id && movementType === 'OUT') {
      loadClients();
      loadTechnicians();
    }
  }, [item?.id, movementType]);

  const loadClients = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('clients')
        .select('id, full_name, client_name')
        .order('full_name');
      setClients(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTechnicians = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['technicien', 'admin', 'super_admin'])
        .eq('is_active', true)
        .order('full_name');
      setTechnicians(data || []);
    } catch (err) {
      console.error('[loadTechnicians] error:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop volumineuse (max 5MB)');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${item?.id || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `inventory/${fileName}`;

      // Upload to Supabase Storage (bucket: Pieces)
      const { error: uploadError } = await supabase.storage
        .from('Pieces')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Pieces')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);

      // If editing existing item, update immediately
      if (item?.id) {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ image_url: publicUrl })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('[handleImageUpload] error:', err);
      setError('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!item?.id) {
      setImageUrl('');
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ image_url: null })
        .eq('id', item.id);

      if (updateError) throw updateError;
      setImageUrl('');
    } catch (err) {
      console.error('[handleRemoveImage] error:', err);
      setError('Erreur lors de la suppression de l\'image');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: formData.name,
      reference: formData.reference || null,
      supplier_name: formData.supplier_name || null,
      quantity: Number(formData.quantity ?? 0),
      min_threshold: Number(formData.min_threshold ?? 0),
      price_buy: formData.price_buy === '' ? null : Number(formData.price_buy),
      price_sell: formData.price_sell === '' ? null : Number(formData.price_sell),
      image_url: imageUrl || null,
    };

    try {
      const supabase = getSupabaseBrowserClient();

      if (isNew) {
        const { error: insertError } = await supabase
          .from('inventory_items')
          .insert(payload);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', item.id);
        if (updateError) throw updateError;
      }
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    setDeleting(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      // Check for related products first
      const { data: relatedProducts, error: checkError } = await supabase
        .from('products')
        .select('id, title')
        .eq('inventory_item_id', item.id);

      if (checkError) {
        console.error('[handleDelete] check products error:', checkError);
      }

      if (relatedProducts && relatedProducts.length > 0) {
        // Ask user if they want to delete related products too
        const productNames = relatedProducts.map(p => p.title || 'Sans nom').join(', ');
        const confirmDeleteAll = confirm(
          `Cet article est lié à ${relatedProducts.length} produit(s) e-commerce:\n${productNames}\n\nSupprimer l'article ET les produits associés ?`
        );

        if (!confirmDeleteAll) {
          setDeleting(false);
          return;
        }

        // Delete related products first
        const { error: deleteProductsError } = await supabase
          .from('products')
          .delete()
          .eq('inventory_item_id', item.id);

        if (deleteProductsError) {
          console.error('[handleDelete] delete products error:', deleteProductsError);
          throw new Error('Impossible de supprimer les produits liés');
        }
      } else {
        // No products - just confirm deletion
        if (!confirm('Supprimer définitivement cet article ?')) {
          setDeleting(false);
          return;
        }
      }

      // Now delete the inventory item
      const { error: deleteError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        console.error('[handleDelete] delete item error:', deleteError);
        throw deleteError;
      }

      onSaved();
    } catch (err) {
      console.error('[handleDelete] error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item?.id) return;
    setMovementError(null);

    const qty = Number(movementQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setMovementError('Quantité invalide');
      return;
    }

    if (movementType === 'OUT' && qty > currentQty) {
      setMovementError('Stock insuffisant');
      return;
    }

    const delta = movementType === 'IN' ? qty : -qty;

    try {
      const supabase = getSupabaseBrowserClient();

      // Insert movement record with correct column names
      const { error: insertMvtError } = await supabase
        .from('stock_movements')
        .insert({
          inventory_item_id: item.id,
          type: movementType, // 'IN' or 'OUT'
          quantity: qty, // Always positive, type indicates direction
          related_client_name: movementType === 'OUT' ? (selectedClient || 'Client Comptoir') : null,
          technician_name: technician || null,
          notes: movementType === 'OUT'
            ? `Sortie stock - ${selectedClient || 'Client Comptoir'}${technician ? ` - Tech: ${technician}` : ''}`
            : `Entrée stock${technician ? ` - Tech: ${technician}` : ''}`,
        });
      if (insertMvtError) {
        console.error('[stock_movements] insert error:', insertMvtError);
        throw insertMvtError;
      }

      // Update item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: currentQty + delta })
        .eq('id', item.id);
      if (updateError) {
        console.error('[inventory_items] update error:', updateError);
        throw updateError;
      }

      onSaved();
    } catch (err) {
      console.error('[handleMovement] error:', err);
      setMovementError('Erreur mise à jour stock');
    }
  };

  const formatPrice = (value?: string | number) => {
    if (value == null || value === '') return '—';
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return '—';
    return `${parsed.toFixed(2)}€`;
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* Image with upload */}
        <div>
          <div className="relative w-full aspect-square bg-airSurface rounded-2xl flex items-center justify-center overflow-hidden group">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={item?.name || formData.name} className="w-full h-full object-cover" />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Changer l'image"
                  >
                    <Upload className="w-5 h-5 text-airDark" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Supprimer l'image"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-4 hover:bg-airBorder/20 rounded-xl transition-colors w-full h-full justify-center"
              >
                {uploading ? (
                  <Loader2 className="w-12 h-12 text-airPrimary animate-spin" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-airBorder" />
                    <span className="text-xs text-airMuted">Ajouter une image</span>
                  </>
                )}
              </button>
            )}
            {uploading && imageUrl && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-airPrimary animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {item?.products?.[0]?.slug && (
            <p className="text-xs text-airMuted mt-2 text-center">
              Produit e-commerce: {item.products[0].slug}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-airDark">
              {item?.name || formData.name || 'Nouvelle pièce'}
            </h3>
            {(item?.reference || formData.reference) && (
              <p className="text-sm text-airMuted">
                Ref: {item?.reference || formData.reference} • Fourn:{' '}
                {item?.supplier_name || formData.supplier_name || '—'}
              </p>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            {isNew && (
              <>
                <Input
                  label="Nom de la pièce"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Pneu 10x2.5-6.5"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Référence"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="REF-123"
                  />
                  <Input
                    label="Fournisseur"
                    name="supplier_name"
                    value={formData.supplier_name}
                    onChange={handleChange}
                    placeholder="Aircooling"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Prix Achat HT"
                type="number"
                step="0.01"
                name="price_buy"
                value={formData.price_buy}
                onChange={handleChange}
              />
              <Input
                label="Prix Vente TTC"
                type="number"
                step="0.01"
                name="price_sell"
                value={formData.price_sell}
                onChange={handleChange}
              />
              <Input
                label="Seuil Min"
                type="number"
                name="min_threshold"
                value={formData.min_threshold}
                onChange={handleChange}
              />
            </div>

            {isNew && (
              <Input
                label="Stock Initial"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button type="submit" variant="primary" loading={saving}>
                {isNew ? 'Créer' : 'Enregistrer'}
              </Button>
              {!isNew && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDelete}
                  loading={deleting}
                  icon={<Trash2 className="w-4 h-4" />}
                  className="!bg-red-100 !text-red-700 hover:!bg-red-200"
                >
                  Supprimer
                </Button>
              )}
              <span className="text-sm text-airMuted">
                Achat: {formatPrice(formData.price_buy)} • Vente:{' '}
                {formatPrice(formData.price_sell)}
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Stock Movement */}
      {!isNew && (
        <div className="border-t border-airBorder pt-6">
          <h4 className="font-semibold text-airDark mb-4">Mouvement de stock</h4>

          {movementError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm mb-4">
              {movementError}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setMovementType('OUT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${
                movementType === 'OUT'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-airSurface text-airMuted hover:bg-airSurface/80'
              }`}
            >
              <ArrowDown className="w-4 h-4" />
              Sortie
            </button>
            <button
              type="button"
              onClick={() => setMovementType('IN')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition ${
                movementType === 'IN'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-airSurface text-airMuted hover:bg-airSurface/80'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              Entrée
            </button>
            <span className="text-sm text-airMuted ml-auto">
              Stock actuel: <strong>{currentQty}</strong>
            </span>
          </div>

          <form onSubmit={handleMovement} className="space-y-4">
            <Input
              label="Quantité"
              type="number"
              min={1}
              value={movementQty}
              onChange={(e) => setMovementQty(Number(e.target.value))}
            />

            {movementType === 'OUT' && (
              <div className="bg-airSurface/50 p-4 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-airPrimary mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    placeholder="Rechercher ou taper nom..."
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full rounded-xl border border-airBorder px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-airPrimary focus:border-transparent"
                    list="clients-list"
                  />
                  <datalist id="clients-list">
                    {clients.map((c) => (
                      <option key={c.id} value={c.full_name || c.client_name} />
                    ))}
                  </datalist>
                </div>

                <Select
                  label="Technicien"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  options={[
                    { value: '', label: 'Sélectionner...' },
                    ...technicians.map((t) => ({ value: t.full_name || t.id, label: t.full_name || 'Sans nom' })),
                  ]}
                />
              </div>
            )}

            <Button
              type="submit"
              variant={movementType === 'IN' ? 'primary' : 'secondary'}
            >
              {movementType === 'IN' ? 'Ajouter au stock' : 'Valider la sortie'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
