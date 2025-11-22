import { NextRequest, NextResponse } from 'next/server';

/**
 * Cette route a été désactivée.
 * Utilisez l'endpoint Django /api/auth/password_reset_request/ à la place.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'Cette route a été désactivée. Veuillez utiliser l\'endpoint Django /api/auth/password_reset_request/',
    },
    { status: 404 },
  );
}
