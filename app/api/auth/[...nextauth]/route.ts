// This route has been disabled - JWT authentication is now used instead
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This route has been disabled. Please use JWT authentication.' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'This route has been disabled. Please use JWT authentication.' },
    { status: 404 }
  );
}

