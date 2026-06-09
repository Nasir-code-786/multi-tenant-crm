import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Note } from './note.entity';
import { Customer } from '../customers/customer.entity';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly activity: ActivityLogService,
  ) {}

  private async assertCustomerInOrg(customerId: string, orgId: string) {
    const customer = await this.customers.findOne({
      where: { id: customerId, organizationId: orgId, deletedAt: IsNull() },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async listForCustomer(customerId: string, user: CurrentUserPayload) {
    await this.assertCustomerInOrg(customerId, user.organizationId);
    return this.notes.find({
      where: { customerId, organizationId: user.organizationId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(customerId: string, content: string, user: CurrentUserPayload) {
    await this.assertCustomerInOrg(customerId, user.organizationId);
    const note = this.notes.create({
      content,
      customerId,
      organizationId: user.organizationId,
      createdById: user.id,
    });
    const saved = await this.notes.save(note);
    await this.activity.log({
      entityType: 'customer',
      entityId: customerId,
      action: 'note_added',
      performedBy: user.id,
      organizationId: user.organizationId,
    });
    return this.notes.findOne({
      where: { id: saved.id },
      relations: ['createdBy'],
    });
  }
}
