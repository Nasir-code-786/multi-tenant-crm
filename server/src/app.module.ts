import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { NotesModule } from './notes/notes.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { Organization } from './organizations/organization.entity';
import { User } from './users/user.entity';
import { Customer } from './customers/customer.entity';
import { Note } from './notes/note.entity';
import { ActivityLog } from './activity-log/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: parseInt(config.get('DATABASE_PORT', '5432'), 10),
        username: config.get('DATABASE_USER', 'postgres'),
        password: config.get('DATABASE_PASSWORD', 'postgres'),
        database: config.get('DATABASE_NAME', 'crm'),
        entities: [Organization, User, Customer, Note, ActivityLog],
        synchronize: true, // dev only - for production, use migrations
      }),
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    NotesModule,
    ActivityLogModule,
  ],
})
export class AppModule {}
