import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct, DbAddon, useUpdateProduct, useCreateAddon, useDeleteAddon } from '@/hooks/useProducts';
import { Plus, Trash2, Upload, Image, X } from 'lucide-react';

interface ProductEditModalProps {
  product: DbProduct | null;
  open: boolean;
  onClose: () => void;
  allAddons: DbAddon[]; // all addons from all products, for reuse
}

export function ProductEditModal({ product, open, onClose, allAddons }: ProductEditModalProps) {
  const updateProduct = useUpdateProduct();
  const createAddon = useCreateAddon();
  const deleteAddon = useDeleteAddon();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Addon creation
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [showAddonForm, setShowAddonForm] = useState(false);

  // Existing addons to select
  const [showExisting, setShowExisting] = useState(false);

  // Reset when product changes
  const resetForm = () => {
    if (product) {
      setName(product.name);
      setPrice(String(product.price));
      setImageUrl(product.image_url || '');
    }
    setNewAddonName('');
    setNewAddonPrice('');
    setShowAddonForm(false);
    setShowExisting(false);
  };

  // Unique addons from other products (not already on this product)
  const currentAddonIds = new Set(product?.addons?.map(a => a.name.toLowerCase()) || []);
  const availableAddons = allAddons.filter(a => 
    a.product_id !== product?.id && !currentAddonIds.has(a.name.toLowerCase())
  );
  // Deduplicate by name
  const uniqueAvailable = availableAddons.reduce((acc, a) => {
    if (!acc.find(x => x.name.toLowerCase() === a.name.toLowerCase())) acc.push(a);
    return acc;
  }, [] as DbAddon[]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${product.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success('Imagem enviada');
    } catch { toast.error('Erro ao enviar imagem'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!product || !name.trim()) return;
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        name: name.trim(),
        price: parseFloat(price) || 0,
        image_url: imageUrl || undefined,
      } as any);
      toast.success('Produto atualizado');
      onClose();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleAddAddon = async () => {
    if (!product || !newAddonName.trim()) return;
    try {
      await createAddon.mutateAsync({
        name: newAddonName.trim(),
        price: parseFloat(newAddonPrice) || 0,
        product_id: product.id,
      });
      setNewAddonName('');
      setNewAddonPrice('');
      setShowAddonForm(false);
      toast.success('Adicional criado');
    } catch { toast.error('Erro ao criar adicional'); }
  };

  const handleSelectExisting = async (addon: DbAddon, customPrice?: number) => {
    if (!product) return;
    try {
      await createAddon.mutateAsync({
        name: addon.name,
        price: customPrice !== undefined ? customPrice : Number(addon.price),
        product_id: product.id,
      });
      toast.success(`${addon.name} adicionado`);
    } catch { toast.error('Erro ao adicionar'); }
  };

  const handleRemoveAddon = async (id: string) => {
    try { await deleteAddon.mutateAsync(id); toast.success('Adicional removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto" onOpenAutoFocus={() => resetForm()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Editar Produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Photo */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Foto</h4>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                  <button onClick={() => setImageUrl('')} className="absolute top-1 right-1 p-0.5 bg-background/80 rounded-full">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                <Upload className="h-4 w-4" /> {uploading ? 'Enviando...' : 'Enviar foto'}
              </Button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </div>
          </div>

          {/* Name & Price */}
          <div className="space-y-3">
            <Input placeholder="Nome do produto" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />
            <Input placeholder="Preço" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="bg-secondary/50" />
          </div>

          {/* Addons Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adicionais</h4>
              <div className="flex gap-1">
                {uniqueAvailable.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowExisting(!showExisting)}>
                    Usar existente
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setShowAddonForm(!showAddonForm)}>
                  <Plus className="h-3 w-3" /> Novo
                </Button>
              </div>
            </div>

            {/* Current addons */}
            <div className="space-y-1">
              {product.addons?.map(addon => (
                <div key={addon.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{addon.name}</span>
                    {Number(addon.price) > 0 && (
                      <span className="text-xs text-primary font-medium">+R$ {Number(addon.price).toFixed(2)}</span>
                    )}
                  </div>
                  <button onClick={() => handleRemoveAddon(addon.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
              }
              {(!product.addons || product.addons.length === 0) && (
                <p className="text-xs text-muted-foreground py-2">Nenhum adicional</p>
              )}
            </div>

            {/* New addon form */}
            {showAddonForm && (
              <div className="flex gap-2 items-end p-3 rounded-lg bg-secondary/20 border border-border animate-fade-in">
                <div className="flex-1 space-y-1">
                  <Input placeholder="Nome" value={newAddonName} onChange={e => setNewAddonName(e.target.value)} className="bg-secondary/50 h-9 text-sm" />
                </div>
                <div className="w-24 space-y-1">
                  <Input placeholder="Preço" type="number" step="0.01" value={newAddonPrice} onChange={e => setNewAddonPrice(e.target.value)} className="bg-secondary/50 h-9 text-sm" />
                </div>
                <Button size="sm" onClick={handleAddAddon} disabled={createAddon.isPending} className="h-9">
                  Criar
                </Button>
              </div>
            )}

            {/* Select from existing */}
            {showExisting && (
              <div className="space-y-1 p-3 rounded-lg bg-secondary/20 border border-border animate-fade-in max-h-40 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">Selecione um adicional de outro produto:</p>
                {uniqueAvailable.map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => handleSelectExisting(addon)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-secondary/60 transition-colors text-left"
                  >
                    <span className="text-sm">{addon.name}</span>
                    <span className="text-xs text-primary">R$ {Number(addon.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full" disabled={updateProduct.isPending}>
            Salvar Produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
