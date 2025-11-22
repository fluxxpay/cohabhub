import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    // Fetch the user based on the authenticated user ID
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        role: true,
      },
    });

    // Check if record exists
    if (!user) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
