import { PrismaClient } from '@prisma/client';
import { createUserWithPassword } from './src/utils/seedHelpers';

const prisma = new PrismaClient();

async function main() {
  // Hole den Test-Customer
  const customer = await prisma.customer.findFirst();
  
  if (!customer) {
    console.error('❌ Kein Customer gefunden!');
    return;
  }

  // Erstelle Admin mit deinen gewohnten Credentials
  const admin = await createUserWithPassword(prisma, {
    email: 'admin@sicherheitsdienst.de',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    customerId: customer.id,
    password: 'password123'
  });

  console.log('✅ Admin-Account erstellt:');
  console.log('   Email: admin@sicherheitsdienst.de');
  console.log('   Passwort: password123');
  console.log(`   ID: ${admin.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Fehler:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
