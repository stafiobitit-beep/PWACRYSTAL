import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing
  await prisma.user.deleteMany();
  
  // Create Demo Admin
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: 'password123',
      name: 'De Baas',
      role: 'ADMIN'
    }
  });

  // Create Demo Cleaner
  await prisma.user.create({
    data: {
      email: 'cleaner1@example.com',
      password: 'password123',
      name: 'An de Kuis',
      role: 'CLEANER'
    }
  });

  console.log('Admin user created: admin@example.com / password123');
  console.log('Cleaner user created: cleaner1@example.com / password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
