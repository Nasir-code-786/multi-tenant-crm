import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Customer } from '../customers/customer.entity';
import { Note } from '../notes/note.entity';
import { ActivityLog } from '../activity-log/activity-log.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  console.log('🧹 Clearing existing data...');
  await ds.query(
    'TRUNCATE TABLE activity_logs, notes, customers, users, organizations RESTART IDENTITY CASCADE',
  );

  // Try to create extra indexes (best effort)
  try {
    await ds.query(
      `CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || email))`,
    );
  } catch (e) {
    console.warn('Could not create FTS index:', (e as Error).message);
  }

  // Partial unique index — enforces "one live customer per (org, email)" at the
  // DB level so concurrent POST /customers requests cannot race past the
  // service-level dedupe check. Allows soft-deleted rows to coexist.
  try {
    await ds.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_email_unique
       ON customers ("organizationId", email) WHERE "deletedAt" IS NULL`,
    );
  } catch (e) {
    console.warn('Could not create unique email index:', (e as Error).message);
  }

  const orgRepo = ds.getRepository(Organization);
  const userRepo = ds.getRepository(User);
  const customerRepo = ds.getRepository(Customer);
  const noteRepo = ds.getRepository(Note);
  const logRepo = ds.getRepository(ActivityLog);

  const password = await bcrypt.hash('password123', 10);

  const seedOrg = async (
    orgName: string,
    userDefs: Array<{ name: string; email: string; role: 'admin' | 'member' }>,
    customerDefs: Array<{
      name: string;
      email: string;
      phone: string;
      assigneeIdx: number;
    }>,
  ) => {
    const org = await orgRepo.save(orgRepo.create({ name: orgName }));
    const users: User[] = [];
    for (const u of userDefs) {
      users.push(
        await userRepo.save(
          userRepo.create({
            ...u,
            password,
            organizationId: org.id,
          }),
        ),
      );
    }

    const admin = users[0];
    for (const c of customerDefs) {
      const assignee = users[c.assigneeIdx];
      const customer = await customerRepo.save(
        customerRepo.create({
          name: c.name,
          email: c.email,
          phone: c.phone,
          organizationId: org.id,
          assignedTo: assignee.id,
        }),
      );

      await logRepo.save(
        logRepo.create({
          entityType: 'customer',
          entityId: customer.id,
          action: 'created',
          performedBy: admin.id,
          organizationId: org.id,
        }),
      );

      // 2 sample notes
      for (let i = 1; i <= 2; i++) {
        await noteRepo.save(
          noteRepo.create({
            content: `Sample note ${i} for ${c.name}`,
            customerId: customer.id,
            organizationId: org.id,
            createdById: assignee.id,
          }),
        );
        await logRepo.save(
          logRepo.create({
            entityType: 'customer',
            entityId: customer.id,
            action: 'note_added',
            performedBy: assignee.id,
            organizationId: org.id,
          }),
        );
      }
    }
    console.log(`✅ Seeded org "${orgName}"`);
  };

  // Org 1: TechCorp Inc
  await seedOrg(
    'TechCorp Inc',
    [
      { name: 'Alice Admin', email: 'alice@techcorp.com', role: 'admin' },
      { name: 'Bob Member', email: 'bob@techcorp.com', role: 'member' },
      { name: 'Carol Member', email: 'carol@techcorp.com', role: 'member' },
    ],
    [
      {
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '555-0101',
        assigneeIdx: 1,
      },
      {
        name: 'Globex',
        email: 'hello@globex.com',
        phone: '555-0102',
        assigneeIdx: 1,
      },
      {
        name: 'Initech',
        email: 'info@initech.com',
        phone: '555-0103',
        assigneeIdx: 1,
      },
      {
        name: 'Umbrella',
        email: 'contact@umbrella.com',
        phone: '555-0104',
        assigneeIdx: 1,
      },
      {
        name: 'Hooli',
        email: 'hi@hooli.com',
        phone: '555-0105',
        assigneeIdx: 1,
      },
      {
        name: 'Pied Piper',
        email: 'pp@pp.com',
        phone: '555-0106',
        assigneeIdx: 2,
      },
      {
        name: 'Stark Industries',
        email: 'stark@stark.com',
        phone: '555-0107',
        assigneeIdx: 2,
      },
      {
        name: 'Wayne Enterprises',
        email: 'wayne@wayne.com',
        phone: '555-0108',
        assigneeIdx: 2,
      },
      {
        name: 'Cyberdyne',
        email: 'cyber@cyber.com',
        phone: '555-0109',
        assigneeIdx: 2,
      },
      {
        name: 'Soylent',
        email: 'soy@soy.com',
        phone: '555-0110',
        assigneeIdx: 2,
      },
    ],
  );

  // Org 2: StartupXYZ
  await seedOrg(
    'StartupXYZ',
    [
      { name: 'Dave Admin', email: 'dave@startupxyz.com', role: 'admin' },
      { name: 'Eve Member', email: 'eve@startupxyz.com', role: 'member' },
      { name: 'Frank Member', email: 'frank@startupxyz.com', role: 'member' },
    ],
    [
      {
        name: 'Alpha LLC',
        email: 'a@alpha.com',
        phone: '555-0201',
        assigneeIdx: 1,
      },
      {
        name: 'Beta Co',
        email: 'b@beta.com',
        phone: '555-0202',
        assigneeIdx: 1,
      },
      {
        name: 'Gamma Inc',
        email: 'g@gamma.com',
        phone: '555-0203',
        assigneeIdx: 1,
      },
      {
        name: 'Delta Group',
        email: 'd@delta.com',
        phone: '555-0204',
        assigneeIdx: 1,
      },
      {
        name: 'Epsilon',
        email: 'e@eps.com',
        phone: '555-0205',
        assigneeIdx: 1,
      },
      {
        name: 'Zeta Ltd',
        email: 'z@zeta.com',
        phone: '555-0206',
        assigneeIdx: 2,
      },
      {
        name: 'Eta Tech',
        email: 'h@eta.com',
        phone: '555-0207',
        assigneeIdx: 2,
      },
      {
        name: 'Theta Labs',
        email: 't@theta.com',
        phone: '555-0208',
        assigneeIdx: 2,
      },
      {
        name: 'Iota Co',
        email: 'i@iota.com',
        phone: '555-0209',
        assigneeIdx: 2,
      },
      {
        name: 'Kappa Inc',
        email: 'k@kappa.com',
        phone: '555-0210',
        assigneeIdx: 2,
      },
    ],
  );

  console.log('🌱 Seeding complete');
  await app.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
