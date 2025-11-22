'use client';

import { Search } from 'lucide-react';

export function SearchEmpty() {
  return (
    <div className="flex flex-col text-center py-12 gap-4">
      <div className="flex justify-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <Search className="size-8 text-muted-foreground" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-mono text-center">
          Rechercher dans Cohab
        </h3>
        <span className="text-sm font-medium text-center text-secondary-foreground">
          Tapez au moins 2 caractères pour rechercher <br />
          des réservations, espaces ou factures
        </span>
      </div>
    </div>
  );
}
