import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { deleteFromS3, uploadToS3 } from '@/lib/s3-upload';
import { systemLog } from '@/services/system-log';
import { AccountProfileSchema } from '@/app/(protected)/user-management/account/forms/account-profile-schema';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    const clientIp = getClientIP(request);

    // Parse the form data
    const formData = await request.formData();

    // Extract form data
    const parsedData = {
      name: formData.get('name'),
      avatarFile: formData.get('avatarFile'),
      avatarAction: formData.get('avatarAction'),
    };

    // Validate the input using Zod schema
    const validationResult = AccountProfileSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    const { name, avatarFile, avatarAction } = validationResult.data;

    // Get current user to check existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    // Handle avatar removal
    if (avatarAction === 'remove' && currentUser?.avatar) {
      try {
        await deleteFromS3(currentUser.avatar);
      } catch (error) {
        console.error('Failed to remove avatar from S3:', error);
      }
    }

    // Handle new avatar upload
    let avatarUrl = currentUser?.avatar || null;
    if (
      avatarAction === 'save' &&
      avatarFile instanceof File &&
      avatarFile.size > 0
    ) {
      try {
        avatarUrl = await uploadToS3(avatarFile, 'avatars');
      } catch (error) {
        console.error('Failed to upload avatar to S3:', error);
        return NextResponse.json(
          { message: 'Failed to upload avatar.' },
          { status: 500 },
        );
      }
    }

    // Save or update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name,
        avatar:
          avatarAction === 'remove'
            ? null
            : avatarAction === 'save'
              ? avatarUrl
              : undefined,
      },
    });

    // Log the event
    await systemLog({
      event: 'update',
      userId: authUser.id,
      entityId: authUser.id,
      entityType: 'user.account',
      description: 'User account updated.',
      ipAddress: clientIp,
    });

    return NextResponse.json(updatedUser);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
