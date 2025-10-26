import { useState } from 'react';

interface CouponCodeProps {
  code?: string;
  size?: 'sm' | 'md';
}

export default function KodKuponu({ code, size='md' }: CouponCodeProps) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  const base = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono rounded border dark:border-gray-600 select-all';
  const pad = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const btnPad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <div className="flex items-center gap-2">
      <span className={`${base} ${pad}`}>{code}</span>
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false), 1800); }}
        className={`bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded ${btnPad} font-medium transition-colors`}
      >
        {copied ? 'Skopiowano' : 'Kopiuj'}
      </button>
    </div>
  );
}
