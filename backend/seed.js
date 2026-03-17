import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing
  // await prisma.user.deleteMany(); // Keep it safer with upsert
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Demo Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'De Baas',
      role: 'ADMIN'
    }
  });

  // Create Demo Cleaner
  await prisma.user.upsert({
    where: { email: 'cleaner1@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'cleaner1@example.com',
      password: hashedPassword,
      name: 'An de Kuis',
      role: 'CLEANER'
    }
  });

  // Create Demo Customer
  await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'customer1@example.com',
      password: hashedPassword,
      name: 'Klant Kritisch',
      role: 'CUSTOMER'
    }
  });

  console.log('Seeding completed. Password for all: password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
