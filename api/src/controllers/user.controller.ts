import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        rating: true,
        ratingCount: true,
        tasksCreated: true,
        tasksCompleted: true,
        trustScore: true,
        isVerified: true,
        createdAt: true,
        // Only show sensitive fields if viewing own profile
        ...(req.user?.id === id && {
          email: true,
          walletAddress: true,
          totalSpent: true,
          totalEarned: true,
        }),
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    // Can only update own profile
    if (req.user?.id !== id) {
      throw new ForbiddenError('You can only update your own profile');
    }

    const { name, bio, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        rating: true,
        trustScore: true,
      },
    });

    sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
}

export async function getReputation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        rating: true,
        ratingCount: true,
        tasksCreated: true,
        tasksCompleted: true,
        trustScore: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Get recent reviews
    const reviews = await prisma.taskReview.findMany({
      where: { reviewedId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    sendSuccess(res, {
      data: {
        ...user,
        recentReviews: reviews,
      },
    });
  } catch (err) {
    next(err);
  }
}
