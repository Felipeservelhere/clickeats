import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useCustomerSearch, Customer } from '@/hooks/useCustomers';
import { User, Plus } from 'lucide-react';

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateNew: (name: string) => void;
  className?: string;
}

export function CustomerAutocomplete({ value, onChange, onSelectCustomer, onCreateNew, className }: CustomerAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: results = [], isLoading } = useCustomerSearch(value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = focused && value.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Nome do cliente"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        className={className}
      />
      {showDropdown && open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Buscando...</div>
          )}
          {!isLoading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum cliente encontrado</div>
          )}
          {!isLoading && results.map(customer => (
            <button
              key={customer.id}
              onClick={() => {
                onSelectCustomer(customer);
                onChange(customer.name);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-b-0"
            >
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{customer.name}</p>
                {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
