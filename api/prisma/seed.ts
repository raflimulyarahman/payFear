import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.moderationFlag.deleteMany();
  await prisma.taskDispute.deleteMany();
  await prisma.taskReview.deleteMany();
  await prisma.taskProof.deleteMany();
  await prisma.taskPayment.deleteMany();
  await prisma.walletConnection.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex@payfear.io',
      passwordHash,
      role: 'REQUESTER',
      rating: 4.8,
      ratingCount: 7,
      tasksCreated: 7,
      totalSpent: 245,
      trustScore: 82,
      isVerified: true,
    },
  });

  const morgan = await prisma.user.create({
    data: {
      name: 'Morgan Riley',
      email: 'morgan@payfear.io',
      passwordHash,
      role: 'EXECUTOR',
      rating: 4.9,
      ratingCount: 12,
      tasksCompleted: 12,
      totalEarned: 580,
      trustScore: 91,
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@payfear.io',
      passwordHash,
      role: 'ADMIN',
      trustScore: 100,
      isVerified: true,
    },
  });

  console.log(`  ✅ Users: ${alex.name}, ${morgan.name}, ${admin.name}`);

  // Create tasks
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);
  const ago = (days: number) => new Date(now.getTime() - days * 86400000);

  const task1 = await prisma.task.create({
    data: {
      title: 'Call ISP to cancel internet plan',
      description: 'Contact Comcast customer service and cancel my internet subscription. They will try to keep you — be firm but polite. Reference account #4821-XX. Ask for a confirmation number and email receipt.',
      category: 'PHONE_CALLS',
      location: 'online',
      budget: 25,
      platformFee: 1.25,
      urgencyFee: 0,
      totalCost: 26.25,
      deadline: d(2),
      urgency: 'normal',
      proofType: 'SCREENSHOT',
      riskLevel: 'LOW',
      status: 'IN_PROGRESS',
      requesterId: alex.id,
      executorId: morgan.id,
      publishedAt: ago(3),
      acceptedAt: ago(2),
      startedAt: ago(1),
      statusHistory: [
        { status: 'DRAFT', timestamp: ago(3.5).toISOString(), actorId: alex.id },
        { status: 'OPEN', timestamp: ago(3).toISOString(), actorId: alex.id },
        { status: 'ACCEPTED', timestamp: ago(2).toISOString(), actorId: morgan.id },
        { status: 'IN_PROGRESS', timestamp: ago(1).toISOString(), actorId: morgan.id },
      ],
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Return shoes at Obsidian Tech Store',
      description: 'I need someone to return a pair of shoes to the Obsidian Tech store. I find the customer service desk intimidating and want to avoid the awkward interaction. The shoes are in perfect condition with original packaging and receipt.',
      category: 'RETURN_REFUND',
      location: 'offline',
      address: '123 Main St, Downtown',
      budget: 35,
      platformFee: 1.75,
      urgencyFee: 0,
      totalCost: 36.75,
      deadline: d(3),
      urgency: 'normal',
      proofType: 'PHOTO',
      riskLevel: 'LOW',
      status: 'OPEN',
      requesterId: alex.id,
      publishedAt: ago(1),
      statusHistory: [
        { status: 'DRAFT', timestamp: ago(1.5).toISOString(), actorId: alex.id },
        { status: 'OPEN', timestamp: ago(1).toISOString(), actorId: alex.id },
      ],
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Negotiate rent reduction with landlord',
      description: 'My lease is up for renewal and the rent increase is too high. I need someone confident to call my landlord and negotiate a more reasonable rate. Be professional — reference market comparisons.',
      category: 'NEGOTIATION',
      location: 'online',
      budget: 85,
      platformFee: 4.25,
      urgencyFee: 17,
      totalCost: 106.25,
      deadline: d(5),
      urgency: 'urgent',
      proofType: 'TEXT',
      riskLevel: 'MEDIUM',
      riskFlags: ['pressure'],
      status: 'PROOF_SUBMITTED',
      requesterId: alex.id,
      executorId: morgan.id,
      publishedAt: ago(5),
      acceptedAt: ago(4),
      startedAt: ago(3),
      statusHistory: [
        { status: 'OPEN', timestamp: ago(5).toISOString(), actorId: alex.id },
        { status: 'ACCEPTED', timestamp: ago(4).toISOString(), actorId: morgan.id },
        { status: 'IN_PROGRESS', timestamp: ago(3).toISOString(), actorId: morgan.id },
        { status: 'PROOF_SUBMITTED', timestamp: ago(0.5).toISOString(), actorId: morgan.id },
      ],
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Ask neighbour to stop loud music',
      description: 'My neighbor plays loud music every evening. I need someone to politely but firmly ask them to keep the volume down after 10 PM. Apartment 4B on the same floor.',
      category: 'SOCIAL',
      location: 'offline',
      address: 'Apartment 4B, Floor 3',
      budget: 40,
      platformFee: 2,
      urgencyFee: 0,
      totalCost: 42,
      deadline: d(1),
      urgency: 'normal',
      proofType: 'TEXT',
      riskLevel: 'LOW',
      status: 'COMPLETED',
      requesterId: alex.id,
      executorId: morgan.id,
      publishedAt: ago(7),
      acceptedAt: ago(6),
      startedAt: ago(5),
      completedAt: ago(3),
      statusHistory: [
        { status: 'OPEN', timestamp: ago(7).toISOString(), actorId: alex.id },
        { status: 'ACCEPTED', timestamp: ago(6).toISOString(), actorId: morgan.id },
        { status: 'IN_PROGRESS', timestamp: ago(5).toISOString(), actorId: morgan.id },
        { status: 'PROOF_SUBMITTED', timestamp: ago(4).toISOString(), actorId: morgan.id },
        { status: 'COMPLETED', timestamp: ago(3).toISOString(), actorId: alex.id },
      ],
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Follow up on job application',
      description: "I applied to a position at Vertex Labs 2 weeks ago and haven't heard back. I need someone to call their HR department and politely follow up on my application status. Reference: Application #VL-2847.",
      category: 'PHONE_CALLS',
      location: 'online',
      budget: 20,
      platformFee: 1,
      urgencyFee: 0,
      totalCost: 21,
      deadline: d(2),
      urgency: 'normal',
      proofType: 'SCREENSHOT',
      riskLevel: 'LOW',
      status: 'OPEN',
      requesterId: alex.id,
      publishedAt: ago(0.5),
      statusHistory: [
        { status: 'OPEN', timestamp: ago(0.5).toISOString(), actorId: alex.id },
      ],
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Request refund from online store',
      description: 'I bought a faulty keyboard from TechZone and they keep redirecting me. Need someone persistent to handle the refund process via phone and email. Order #TZ-88412.',
      category: 'RETURN_REFUND',
      location: 'online',
      budget: 30,
      platformFee: 1.5,
      urgencyFee: 0,
      totalCost: 31.5,
      deadline: d(4),
      urgency: 'normal',
      proofType: 'SCREENSHOT',
      riskLevel: 'LOW',
      status: 'OPEN',
      requesterId: alex.id,
      publishedAt: ago(0.25),
      statusHistory: [
        { status: 'OPEN', timestamp: ago(0.25).toISOString(), actorId: alex.id },
      ],
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'Cancel gym membership in person',
      description: 'Need someone to go to Iron Heavens gym and cancel my membership. They make it very hard to cancel — they will try to upsell. Be firm. Member ID: IH-3912.',
      category: 'ADMIN_TASK',
      location: 'offline',
      address: '456 Fitness Blvd',
      budget: 50,
      platformFee: 2.5,
      urgencyFee: 0,
      totalCost: 52.5,
      deadline: d(6),
      urgency: 'normal',
      proofType: 'PHOTO',
      riskLevel: 'LOW',
      status: 'OPEN',
      requesterId: alex.id,
      publishedAt: ago(2),
      statusHistory: [
        { status: 'OPEN', timestamp: ago(2).toISOString(), actorId: alex.id },
      ],
    },
  });

  console.log(`  ✅ Tasks: ${7} tasks created`);

  // Create payment records for published tasks
  const publishedTasks = [task1, task2, task3, task4, task5, task6, task7];
  for (const task of publishedTasks) {
    await prisma.taskPayment.create({
      data: {
        taskId: task.id,
        amount: task.budget,
        platformFee: task.platformFee,
        urgencyFee: task.urgencyFee,
        totalAmount: task.totalCost,
        escrowStatus: task.status === 'COMPLETED' ? 'RELEASED' : 'FUNDED',
        fundedAt: task.publishedAt,
        ...(task.status === 'COMPLETED' && { releasedAt: task.completedAt }),
      },
    });
  }

  console.log(`  ✅ Payments: ${publishedTasks.length} payment records created`);

  // Create a proof for task3 (PROOF_SUBMITTED)
  await prisma.taskProof.create({
    data: {
      taskId: task3.id,
      submittedById: morgan.id,
      proofType: 'TEXT',
      textContent: 'Successfully negotiated with the landlord. They agreed to reduce the increase from $200/month to $75/month. New rate: $1,575/month (was proposed at $1,700, originally $1,500). Landlord said they will send updated lease by Friday.',
      notes: 'Called twice. First call got redirected. Second call reached the property manager directly.',
    },
  });

  // Create a review for task4 (COMPLETED)
  await prisma.taskReview.create({
    data: {
      taskId: task4.id,
      reviewerId: alex.id,
      reviewedId: morgan.id,
      rating: 5,
      comment: 'Handled it perfectly. Neighbour was very understanding. Morgan was professional and calm.',
    },
  });

  console.log(`  ✅ Proofs: 1, Reviews: 1`);
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Requester: alex@payfear.io / password123');
  console.log('  Executor:  morgan@payfear.io / password123');
  console.log('  Admin:     admin@payfear.io / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
