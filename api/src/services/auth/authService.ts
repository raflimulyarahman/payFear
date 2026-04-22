import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { 
  InvalidCredentialsError, 
  ConflictError, 
  NotFoundError 
} from '../../utils/errors.js';
import type { RegisterInput, LoginInput } from '../../validators/auth.schema.js';
import type { JwtPayload } from '../../middleware/auth.js';

const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('EMAIL_TAKEN', 'An account with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      rating: true,
      trustScore: true,
      createdAt: true,
    },
  });

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email!,
    role: user.role,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, token };
}

export async function loginUser(input: LoginInput) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new InvalidCredentialsError();
  }

  // Verify password
  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  // Generate JWT
  const token = generateToken({
    userId: user.id,
    email: user.email!,
    role: user.role,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      walletAddress: true,
      rating: true,
      ratingCount: true,
      tasksCreated: true,
      tasksCompleted: true,
      totalSpent: true,
      totalEarned: true,
      trustScore: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User', id);
  }

  return user;
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}
