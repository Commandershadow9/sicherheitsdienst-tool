const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    console.log('\n📊 Checking Templates in Database...\n');

    const templates = await prisma.siteTemplate.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log(`Found ${templates.length} templates:\n`);

    if (templates.length === 0) {
      console.log('❌ NO TEMPLATES FOUND! You need to create templates first.\n');
    } else {
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ID: ${template.id}`);
        console.log(`   Description: ${template.description || 'N/A'}`);
        console.log(`   Active: ${template.isActive ? '✅' : '❌'}`);
        console.log(`   Created: ${template.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Also check customers
    console.log('\n📊 Checking Customers in Database...\n');

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
        primaryContact: true,
      },
    });

    console.log(`Found ${customers.length} customers:\n`);

    if (customers.length === 0) {
      console.log('❌ NO CUSTOMERS FOUND!\n');
    } else {
      customers.forEach((customer, index) => {
        const contact = customer.primaryContact;
        console.log(`${index + 1}. ${customer.companyName}`);
        console.log(`   ID: ${customer.id}`);
        console.log(`   Contact: ${contact.name || 'N/A'} (${contact.email || 'N/A'})`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
