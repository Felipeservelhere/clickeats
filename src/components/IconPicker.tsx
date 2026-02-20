import { useState } from 'react';
import { foodIcons, FoodIcon } from './FoodIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors"
      >
        <FoodIcon name={value} size={20} className="text-primary" />
        <span className="text-sm text-muted-foreground">Trocar ícone</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Escolher Ícone</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {foodIcons.map(icon => (
              <button
                key={icon.name}
                onClick={() => { onChange(icon.name); setOpen(false); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all hover:bg-secondary/50 ${
                  value === icon.name ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <FoodIcon name={icon.name} size={24} className={value === icon.name ? 'text-primary' : 'text-foreground'} />
                <span className="text-[10px] text-muted-foreground leading-tight text-center">{icon.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
