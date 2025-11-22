/**
 * Server-side authentication utilities for Next.js API routes
 * Handles JWT token verification from Authorization headers
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJwt } from '@/lib/api';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  roleId: string;
  roleName?: string;
  status: string;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Verify JWT token and get user information
 * Returns authenticated user or null if invalid
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const token = extractToken(request);
    if (!token) {
      return null;
    }

    // Parse JWT token to get user ID
    const payload = parseJwt(token);
    if (!payload) {
      return null;
    }

    // Get user ID from token payload (Django JWT format)
    const userId = payload.user_id || payload.id || payload.sub;
    if (!userId) {
      return null;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      include: {
        role: true,
      },
    });

    if (!user || user.isTrashed) {
      return null;
    }

    // Build user name from first_name and last_name or use email
    const userName =
      user.name ||
      (user.email ? user.email.split('@')[0] : 'Utilisateur');

    return {
      id: user.id,
      email: user.email,
      name: userName,
      roleId: user.roleId,
      roleName: user.role.name,
      status: user.status,
    };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return null;
  }
}

/**
 * Middleware helper to check authentication in API routes
 * Returns authenticated user or throws error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

