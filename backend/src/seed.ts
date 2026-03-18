import prisma from './utils/prisma.js';

async function main() {
  // Clear existing data
  await prisma.incident.deleteMany();
  await prisma.taskPhoto.deleteMany();
  await prisma.taskMessage.deleteMany();
  await prisma.cleaningTask.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const customer1 = await prisma.user.create({
    data: { email: 'customer1@example.com', password: 'password123', name: 'Jan Jansen', role: 'CUSTOMER' }
  });
  const customer2 = await prisma.user.create({
    data: { email: 'customer2@example.com', password: 'password123', name: 'Piet Peters', role: 'CUSTOMER' }
  });
  const customer3 = await prisma.user.create({
    data: { email: 'customer3@example.com', password: 'password123', name: 'Marie Mertens', role: 'CUSTOMER' }
  });

  const cleaner1 = await prisma.user.create({
    data: { email: 'cleaner1@example.com', password: 'password123', name: 'An de Kuis', role: 'CLEANER' }
  });
  const cleaner2 = await prisma.user.create({
    data: { email: 'cleaner2@example.com', password: 'password123', name: 'Tom Turbo', role: 'CLEANER' }
  });

  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', password: 'password123', name: 'De Baas', role: 'ADMIN' }
  });

  // Create Locations
  const loc1 = await prisma.location.create({ data: { name: 'Kantoor Antwerpen', address: 'Meir 1, 2000 Antwerpen', customerId: customer1.id } });
  const loc2 = await prisma.location.create({ data: { name: 'Magazijn Gent', address: 'Veldstraat 10, 9000 Gent', customerId: customer1.id } });
  const loc3 = await prisma.location.create({ data: { name: 'Woning Brussel', address: 'Wetstraat 1, 1000 Brussel', customerId: customer2.id } });
  const loc4 = await prisma.location.create({ data: { name: 'Appartement Knokke', address: 'Zeedijk 50, 8300 Knokke', customerId: customer2.id } });
  const loc5 = await prisma.location.create({ data: { name: 'Villa Hasselt', address: 'Demerlaan 5, 3500 Hasselt', customerId: customer3.id } });

  // Create Tasks
  const tasks = [];
  const locations = [loc1, loc2, loc3, loc4, loc5];
  const cleaners = [cleaner1, cleaner2];

  for (let i = 0; i < 10; i++) {
    const task = await prisma.cleaningTask.create({
      data: {
        title: `Schoonmaak Beurt ${i + 1}`,
        description: `Standaard wekelijkse schoonmaak #${i + 1}`,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Next 10 days
        status: i % 4 === 0 ? 'DONE' : i % 3 === 0 ? 'ISSUE' : 'PLANNED',
        locationId: locations[i % locations.length]!.id,
        cleanerId: cleaners[i % cleaners.length]!.id,
        managerId: admin.id
      }
    });
    tasks.push(task);
  }

  // Add messages for the first task
  await prisma.taskMessage.create({
    data: { content: 'Hallo, ik ben onderweg naar de locatie.', taskId: tasks[0]!.id, senderId: cleaner1.id }
  });
  await prisma.taskMessage.create({
    data: { content: 'Prima, tot zo!', taskId: tasks[0]!.id, senderId: customer1.id }
  });

  console.log('Demo data seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
