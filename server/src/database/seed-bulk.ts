import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { AppModule } from '../app.module';
import { Customer } from '../customers/customer.entity';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';

const TOTAL = Number(process.env.BULK_COUNT ?? 100_000);
const BATCH = 5_000;

async function bulk() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  // Pick the first org + its members as the targets
  const org = await ds.getRepository(Organization).findOne({
    where: { name: 'TechCorp Inc' },
  });
  if (!org) throw new Error('Run `npm run seed` first to create base data');

  const members = await ds.getRepository(User).find({
    where: { organizationId: org.id },
  });
  const memberIds = members.map((m) => m.id);

  console.log(`Seeding ${TOTAL} fake customers into "${org.name}"...`);
  console.time('bulk-insert');

  for (let i = 0; i < TOTAL; i += BATCH) {
    const rows = Array.from({ length: Math.min(BATCH, TOTAL - i) }, () => ({
      name: faker.company.name(),
      // make email globally unique to satisfy the partial unique index
      email: `${faker.string.uuid()}@${faker.internet.domainName()}`,
      phone: faker.string.numeric(10),
      organizationId: org.id,
      // Leave most unassigned so the 5-cap rule still holds for our seeded members
      assignedTo:
        Math.random() < 0.0001
          ? memberIds[Math.floor(Math.random() * memberIds.length)]
          : null,
    }));

    // Single multi-row INSERT — much faster than .save() per row
    await ds
      .createQueryBuilder()
      .insert()
      .into(Customer)
      .values(rows)
      .execute();

    process.stdout.write(`  inserted ${i + rows.length}/${TOTAL}\r`);
  }

  console.log('');
  console.timeEnd('bulk-insert');

  // Quick sanity benchmark — proves the indexes do their job
  console.log('\nBenchmark queries:');

  console.time('count all');
  await ds.getRepository(Customer).count({ where: { organizationId: org.id } });
  console.timeEnd('count all');

  console.time('paginated page 1');
  await ds.getRepository(Customer).find({
    where: { organizationId: org.id },
    take: 20,
    skip: 0,
  });
  console.timeEnd('paginated page 1');

  console.time('paginated page 5000 (deep offset)');
  await ds.getRepository(Customer).find({
    where: { organizationId: org.id },
    take: 20,
    skip: 100_000,
  });
  console.timeEnd('paginated page 5000 (deep offset)');

  console.time('search ILIKE');
  await ds
    .createQueryBuilder(Customer, 'c')
    .where('c.organizationId = :org', { org: org.id })
    .andWhere('c.deletedAt IS NULL')
    .andWhere('(c.name ILIKE :s OR c.email ILIKE :s)', { s: '%inc%' })
    .take(20)
    .getMany();
  console.timeEnd('search ILIKE');

  await app.close();
  process.exit(0);
}

bulk().catch((e) => {
  console.error(e);
  process.exit(1);
});
