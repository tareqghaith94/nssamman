import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useClientSuggestions } from '@/hooks/useClientSuggestions';

interface ClientNameComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClientNameCombobox({
  value,
  onValueChange,
  placeholder = 'Select or enter client name',
  disabled = false,
  className,
}: ClientNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: clients = [], isLoading } = useClientSuggestions();

  const filteredClients = useMemo(() => {
    if (!search) return clients.slice(0, 20);
    const lower = search.toLowerCase();
    return clients.filter((c) => c.toLowerCase().includes(lower)).slice(0, 20);
  }, [clients, search]);

  const exactMatch = clients.some(
    (c) => c.toLowerCase() === search.toLowerCase()
  );

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setSearch('');
    setOpen(false);
  };

  const handleAddNew = () => {
    if (search.trim()) {
      onValueChange(search.trim());
      setSearch('');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-background z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type new client..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading clients...
              </div>
            ) : (
              <>
                {filteredClients.length === 0 && !search && (
                  <CommandEmpty>No clients found.</CommandEmpty>
                )}
                
                {filteredClients.length > 0 && (
                  <CommandGroup heading="Existing Clients">
                    {filteredClients.map((client) => (
                      <CommandItem
                        key={client}
                        value={client}
                        onSelect={() => handleSelect(client)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === client ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {client}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {search.trim() && !exactMatch && (
                  <CommandGroup heading="Add New">
                    <CommandItem onSelect={handleAddNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{search.trim()}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
