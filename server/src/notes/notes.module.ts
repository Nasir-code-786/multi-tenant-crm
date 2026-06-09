import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Customer } from '../customers/customer.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Customer]), ActivityLogModule],
  providers: [NotesService],
  controllers: [NotesController],
})
export class NotesModule {}
