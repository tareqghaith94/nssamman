import { useState, useMemo } from 'react';
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  allowCustom = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options.slice(0, 50);
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => 
      opt.toLowerCase().includes(lowerSearch)
    ).slice(0, 50);
  }, [options, search]);

  const exactMatch = useMemo(() => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase().trim();
    return options.some(opt => opt.toLowerCase() === lowerSearch);
  }, [options, search]);

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (trimmed) {
      onValueChange(trimmed);
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && search.trim() ? (
                <button
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent rounded cursor-pointer"
                  onClick={handleAddCustom}
                >
                  Add "<span className="font-medium">{search.trim()}</span>"
                </button>
              ) : (
                "No results found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {allowCustom && search.trim() && !exactMatch && filteredOptions.length > 0 && (
              <CommandGroup heading="Add New">
                <CommandItem onSelect={handleAddCustom}>
                  <span className="text-muted-foreground">Add "</span>
                  <span className="font-medium">{search.trim()}</span>
                  <span className="text-muted-foreground">"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
