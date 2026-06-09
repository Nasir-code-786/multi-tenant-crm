import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-[#EF4444] bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message ?? 'Something went wrong'}</span>
    </div>
  );
}
