import { Category, Product, Neighborhood } from '@/types/order';

export const categories: Category[] = [
  { id: '1', name: 'Lanches', icon: '🍔' },
  { id: '2', name: 'Pizzas', icon: '🍕' },
  { id: '3', name: 'Bebidas', icon: '🥤' },
  { id: '4', name: 'Sobremesas', icon: '🍰' },
  { id: '5', name: 'Porções', icon: '🍟' },
];

export const products: Product[] = [
  { id: 'p1', name: 'X-Burger', price: 18.90, categoryId: '1', addons: [
    { id: 'a1', name: 'Bacon Extra', price: 4.00 },
    { id: 'a2', name: 'Queijo Extra', price: 3.00 },
    { id: 'a3', name: 'Ovo', price: 2.50 },
  ]},
  { id: 'p2', name: 'X-Salada', price: 16.90, categoryId: '1', addons: [
    { id: 'a1', name: 'Bacon Extra', price: 4.00 },
    { id: 'a2', name: 'Queijo Extra', price: 3.00 },
  ]},
  { id: 'p3', name: 'X-Tudo', price: 24.90, categoryId: '1', addons: [
    { id: 'a1', name: 'Bacon Extra', price: 4.00 },
    { id: 'a2', name: 'Queijo Extra', price: 3.00 },
    { id: 'a4', name: 'Cheddar', price: 3.50 },
  ]},
  { id: 'p4', name: 'Margherita', price: 39.90, categoryId: '2', addons: [
    { id: 'a5', name: 'Borda Recheada', price: 8.00 },
    { id: 'a6', name: 'Massa Integral', price: 5.00 },
  ]},
  { id: 'p5', name: 'Calabresa', price: 42.90, categoryId: '2', addons: [
    { id: 'a5', name: 'Borda Recheada', price: 8.00 },
  ]},
  { id: 'p6', name: 'Portuguesa', price: 44.90, categoryId: '2', addons: [
    { id: 'a5', name: 'Borda Recheada', price: 8.00 },
    { id: 'a6', name: 'Massa Integral', price: 5.00 },
  ]},
  { id: 'p7', name: 'Coca-Cola 350ml', price: 6.00, categoryId: '3', addons: [] },
  { id: 'p8', name: 'Suco Natural', price: 8.00, categoryId: '3', addons: [
    { id: 'a7', name: 'Sem Açúcar', price: 0 },
  ]},
  { id: 'p9', name: 'Água Mineral', price: 4.00, categoryId: '3', addons: [] },
  { id: 'p10', name: 'Pudim', price: 12.00, categoryId: '4', addons: [
    { id: 'a8', name: 'Calda Extra', price: 2.00 },
  ]},
  { id: 'p11', name: 'Petit Gateau', price: 18.00, categoryId: '4', addons: [] },
  { id: 'p12', name: 'Batata Frita', price: 22.00, categoryId: '5', addons: [
    { id: 'a9', name: 'Cheddar e Bacon', price: 8.00 },
  ]},
  { id: 'p13', name: 'Isca de Frango', price: 28.00, categoryId: '5', addons: [] },
];

export const neighborhoods: Neighborhood[] = [
  { id: 'n1', name: 'Centro', fee: 5.00 },
  { id: 'n2', name: 'Jardim América', fee: 7.00 },
  { id: 'n3', name: 'Vila Nova', fee: 8.00 },
  { id: 'n4', name: 'São José', fee: 10.00 },
  { id: 'n5', name: 'Industrial', fee: 12.00 },
];

export const defaultTables = Array.from({ length: 20 }, (_, i) => i + 1);
