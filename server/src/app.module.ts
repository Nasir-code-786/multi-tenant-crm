import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { NotesModule } from './notes/notes.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { HealthModule } from './health/health.module';
import { Organization } from './organizations/organization.entity';
import { User } from './users/user.entity';
import { Customer } from './customers/customer.entity';
import { Note } from './notes/note.entity';
import { ActivityLog } from './activity-log/activity-log.entity';
import { isProduction } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const prod = isProduction(config);
        const databaseUrl = config.get<string>('DATABASE_URL');
        const synchronize =
          !prod || config.get<string>('DATABASE_SYNCHRONIZE') === 'true';
        const common = {
          type: 'postgres' as const,
          entities: [Organization, User, Customer, Note, ActivityLog],
          synchronize,
          ssl: prod ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return { ...common, url: databaseUrl };
        }

        return {
          ...common,
          host: config.get<string>('DATABASE_HOST', 'localhost'),
          port: parseInt(config.get<string>('DATABASE_PORT', '5432'), 10),
          username: config.get<string>('DATABASE_USER', 'postgres'),
          password: config.get<string>('DATABASE_PASSWORD', 'postgres'),
          database: config.get<string>('DATABASE_NAME', 'crm'),
        };
      },
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    NotesModule,
    ActivityLogModule,
  ],
})
export class AppModule {}
