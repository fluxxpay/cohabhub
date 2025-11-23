import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/config';

/**
 * Route API Next.js qui fait un proxy vers l'endpoint Django public pour la liste
 */
export async function GET(request: NextRequest) {
  try {
    const apiUrl = getApiUrl();
    
    // Essayer l'endpoint public
    const response = await fetch(`${apiUrl}/api/spaces/public/`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return NextResponse.json(errorData, { status: response.status });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: `Erreur lors de la récupération des espaces (status: ${response.status})`,
            message: 'L\'endpoint public n\'est peut-être pas encore déployé sur le serveur de production.'
          },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des espaces:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des espaces',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

