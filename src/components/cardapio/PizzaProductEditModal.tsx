import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DbProduct, useUpdateProduct } from '@/hooks/useProducts';
import { DbPizzaSize, DbProductPizzaPrice, DbProductIngredient } from '@/hooks/usePizza';
import { Plus, Trash2, Upload, Image, X } from 'lucide-react';

interface PizzaProductEditModalProps {
  product: DbProduct | null;
  open: boolean;
  onClose: () => void;
  pizzaSizes: DbPizzaSize[];
  pizzaPrices: DbProductPizzaPrice[];
  ingredients: DbProductIngredient[];
  onUpsertPrice: (p: { product_id: string; pizza_size_id: string; price: number }) => Promise<any>;
  onCreateIngredient: (i: { product_id: string; name: string }) => Promise<any>;
  onDeleteIngredient: (id: string) => Promise<void>;
}

export function PizzaProductEditModal({
  product, open, onClose, pizzaSizes, pizzaPrices, ingredients,
  onUpsertPrice, onCreateIngredient, onDeleteIngredient,
}: PizzaProductEditModalProps) {
  const updateProduct = useUpdateProduct();

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newIngredient, setNewIngredient] = useState('');
  const [sizePrices, setSizePrices] = useState<Record<string, string>>({});

  const resetForm = () => {
    if (product) {
      setName(product.name);
      setImageUrl(product.image_url || '');
      const priceMap: Record<string, string> = {};
      pizzaSizes.forEach(s => {
        const pp = pizzaPrices.find(p => p.product_id === product.id && p.pizza_size_id === s.id);
        priceMap[s.id] = pp ? String(pp.price) : '';
      });
      setSizePrices(priceMap);
    }
    setNewIngredient('');
  };

  const productIngredients = product ? ingredients.filter(i => i.product_id === product.id) : [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${product.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
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
      await updateProduct.mutateAsync({ id: product.id, name: name.trim(), image_url: imageUrl || undefined } as any);
      // Save prices for each size
      for (const size of pizzaSizes) {
        const priceStr = sizePrices[size.id];
        if (priceStr !== undefined && priceStr !== '') {
          await onUpsertPrice({ product_id: product.id, pizza_size_id: size.id, price: parseFloat(priceStr) || 0 });
        }
      }
      toast.success('Sabor atualizado');
      onClose();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleAddIngredient = async () => {
    if (!product || !newIngredient.trim()) return;
    try {
      await onCreateIngredient({ product_id: product.id, name: newIngredient.trim() });
      setNewIngredient('');
      toast.success('Ingrediente adicionado');
    } catch { toast.error('Erro ao adicionar'); }
  };

  const handleRemoveIngredient = async (id: string) => {
    try { await onDeleteIngredient(id); toast.success('Ingrediente removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); else resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto" onOpenAutoFocus={() => resetForm()}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Editar Sabor</DialogTitle>
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

          {/* Name */}
          <Input placeholder="Nome do sabor" value={name} onChange={e => setName(e.target.value)} className="bg-secondary/50" />

          {/* Prices per size */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preços por Tamanho</h4>
            {pizzaSizes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Cadastre tamanhos na aba "Tamanhos" primeiro.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {pizzaSizes.map(size => (
                  <div key={size.id} className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{size.name}</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={sizePrices[size.id] || ''}
                      onChange={e => setSizePrices(prev => ({ ...prev, [size.id]: e.target.value }))}
                      className="bg-secondary/50 h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ingredientes</h4>
            <div className="space-y-1">
              {productIngredients.map(ing => (
                <div key={ing.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                  <span className="text-sm">{ing.name}</span>
                  <button onClick={() => handleRemoveIngredient(ing.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {productIngredients.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Nenhum ingrediente</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Novo ingrediente"
                value={newIngredient}
                onChange={e => setNewIngredient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                className="bg-secondary/50 h-9 text-sm flex-1"
              />
              <Button size="sm" onClick={handleAddIngredient} className="h-9 gap-1">
                <Plus className="h-3 w-3" /> Adicionar
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full" disabled={updateProduct.isPending}>
            Salvar Sabor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
