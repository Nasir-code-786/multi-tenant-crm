'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-[#94A3B8]">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </button>
      <span>
        Page {page} of {totalPages || 1}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary disabled:opacity-30"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
