import { lazy, Suspense } from 'react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Pre-curated food/restaurant icons
export const foodIcons = [
  { name: 'beef', label: 'Carnes' },
  { name: 'pizza', label: 'Pizza' },
  { name: 'cup-soda', label: 'Bebidas' },
  { name: 'cake', label: 'Sobremesas' },
  { name: 'utensils-crossed', label: 'Talheres' },
  { name: 'sandwich', label: 'Sanduíche' },
  { name: 'coffee', label: 'Café' },
  { name: 'wine', label: 'Vinho' },
  { name: 'beer', label: 'Cerveja' },
  { name: 'egg-fried', label: 'Ovo' },
  { name: 'salad', label: 'Salada' },
  { name: 'fish', label: 'Peixe' },
  { name: 'cookie', label: 'Biscoito' },
  { name: 'apple', label: 'Frutas' },
  { name: 'cherry', label: 'Cereja' },
  { name: 'milk', label: 'Leite' },
  { name: 'popcorn', label: 'Porções' },
  { name: 'croissant', label: 'Padaria' },
  { name: 'ice-cream-cone', label: 'Sorvete' },
  { name: 'soup', label: 'Sopa' },
  { name: 'ham', label: 'Presunto' },
  { name: 'drumstick', label: 'Frango' },
  { name: 'flame', label: 'Grelhados' },
  { name: 'chef-hat', label: 'Especial' },
] as const;

export type FoodIconName = (typeof foodIcons)[number]['name'];

interface FoodIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function FoodIcon({ name, size = 20, className }: FoodIconProps) {
  const iconName = name as keyof typeof dynamicIconImports;
  if (!dynamicIconImports[iconName]) {
    // fallback
    const Fallback = lazy(dynamicIconImports['utensils-crossed']);
    return (
      <Suspense fallback={<div style={{ width: size, height: size }} />}>
        <Fallback size={size} className={className} />
      </Suspense>
    );
  }
  const LucideIcon = lazy(dynamicIconImports[iconName]);
  return (
    <Suspense fallback={<div style={{ width: size, height: size }} />}>
      <LucideIcon size={size} className={className} />
    </Suspense>
  );
}
