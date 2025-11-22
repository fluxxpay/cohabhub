'use client';

import { ReactNode } from 'react';

interface StructuredDataProps {
  data: object | object[];
}

/**
 * Composant pour injecter des structured data JSON-LD
 */
export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

