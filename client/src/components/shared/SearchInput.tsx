'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface Props {
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ onSearch, placeholder = 'Search...' }: Props) {
  const [value, setValue] = useState('');
  const debounced = useDebouncedCallback((v: string) => onSearch(v), 400);

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          debounced(e.target.value);
        }}
        className="input pl-9"
      />
    </div>
  );
}
