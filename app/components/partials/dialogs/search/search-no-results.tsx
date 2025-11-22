'use client';

import { SearchX } from 'lucide-react';

export function SearchNoResults() {
  return (
    <div className="flex flex-col text-center py-12 gap-4">
      <div className="flex justify-center">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <SearchX className="size-8 text-muted-foreground" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-mono text-center">
          Aucun résultat trouvé
        </h3>
        <span className="text-sm font-medium text-center text-secondary-foreground">
          Essayez avec d'autres mots-clés ou <br />
          vérifiez l'orthographe de votre recherche
        </span>
      </div>
    </div>
  );
}
