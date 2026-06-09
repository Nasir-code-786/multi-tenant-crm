import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ActivityAction, ActivityLog } from './activity-log.entity';

interface LogParams {
  entityType: string;
  entityId: string;
  action: ActivityAction;
  performedBy: string;
  organizationId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async log(params: LogParams, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ActivityLog) : this.repo;
    const entry = repo.create(params);
    return repo.save(entry);
  }

  findForCustomer(customerId: string, organizationId: string) {
    return this.repo.find({
      where: { entityId: customerId, entityType: 'customer', organizationId },
      relations: ['performer'],
      order: { timestamp: 'DESC' },
    });
  }
}
