import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, IsNull, Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { User } from '../users/user.entity';

const MAX_ASSIGNED = 5;

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    private readonly dataSource: DataSource,
    private readonly activity: ActivityLogService,
  ) {}

  async findAll(query: QueryCustomerDto, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.customers
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.assignee', 'assignee')
      .where('c.organizationId = :orgId', { orgId: user.organizationId })
      .andWhere('c.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('c.name ILIKE :s', { s: `%${query.search}%` })
            .orWhere('c.email ILIKE :s', { s: `%${query.search}%` });
        }),
      );
    }

    const [data, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const customer = await this.customers.findOne({
      where: { id, organizationId: user.organizationId, deletedAt: IsNull() },
      relations: ['assignee'],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async assertEmailUnique(
    email: string,
    organizationId: string,
    excludeId?: string,
  ) {
    const existing = await this.customers.findOne({
      where: {
        email: email.toLowerCase(),
        organizationId,
        deletedAt: IsNull(),
      },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        'A customer with this email already exists in your organization',
      );
    }
  }

  async create(dto: CreateCustomerDto, user: CurrentUserPayload) {
    const email = dto.email.toLowerCase();
    await this.assertEmailUnique(email, user.organizationId);
    const customer = this.customers.create({
      ...dto,
      email,
      organizationId: user.organizationId,
    });
    const saved = await this.customers.save(customer);
    await this.activity.log({
      entityType: 'customer',
      entityId: saved.id,
      action: 'created',
      performedBy: user.id,
      organizationId: user.organizationId,
    });
    return saved;
  }

  async update(id: string, dto: UpdateCustomerDto, user: CurrentUserPayload) {
    const customer = await this.findOne(id, user);
    const next = { ...dto };
    if (next.email) {
      next.email = next.email.toLowerCase();
      if (next.email !== customer.email) {
        await this.assertEmailUnique(next.email, user.organizationId, id);
      }
    }
    Object.assign(customer, next);
    const saved = await this.customers.save(customer);
    await this.activity.log({
      entityType: 'customer',
      entityId: id,
      action: 'updated',
      performedBy: user.id,
      organizationId: user.organizationId,
    });
    return saved;
  }

  async softDelete(id: string, user: CurrentUserPayload) {
    const customer = await this.findOne(id, user);
    await this.customers.softRemove(customer);
    await this.activity.log({
      entityType: 'customer',
      entityId: id,
      action: 'deleted',
      performedBy: user.id,
      organizationId: user.organizationId,
    });
    return { success: true };
  }

  async restore(id: string, user: CurrentUserPayload) {
    const customer = await this.customers.findOne({
      where: { id, organizationId: user.organizationId },
      withDeleted: true,
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (!customer.deletedAt)
      throw new BadRequestException('Customer not deleted');
    // Make sure no live customer with the same email has taken its place
    await this.assertEmailUnique(customer.email, user.organizationId, id);
    await this.customers.restore(id);
    await this.activity.log({
      entityType: 'customer',
      entityId: id,
      action: 'restored',
      performedBy: user.id,
      organizationId: user.organizationId,
    });
    return { success: true };
  }

  async assign(
    customerId: string,
    assignToUserId: string,
    currentUser: CurrentUserPayload,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const targetUser = await manager
        .createQueryBuilder(User, 'u')
        .where('u.id = :id', { id: assignToUserId })
        .andWhere('u.organizationId = :orgId', {
          orgId: currentUser.organizationId,
        })
        .setLock('pessimistic_write')
        .getOne();
      if (!targetUser)
        throw new NotFoundException(
          'Target user not found in your organization',
        );

      // 2. Verify customer exists in org
      const customer = await manager.findOne(Customer, {
        where: {
          id: customerId,
          organizationId: currentUser.organizationId,
          deletedAt: IsNull(),
        },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      // 3. Safe to count without a row lock — the user-row lock above
      //    already serializes all assignments to this user.
      const activeCount = await manager
        .createQueryBuilder(Customer, 'c')
        .where('c.assignedTo = :userId', { userId: assignToUserId })
        .andWhere('c.deletedAt IS NULL')
        .andWhere('c.organizationId = :orgId', {
          orgId: currentUser.organizationId,
        })
        .getCount();

      if (
        customer.assignedTo !== assignToUserId &&
        activeCount >= MAX_ASSIGNED
      ) {
        throw new BadRequestException(
          `User already has ${MAX_ASSIGNED} active customers assigned`,
        );
      }

      await manager.update(Customer, customerId, {
        assignedTo: assignToUserId,
      });

      await this.activity.log(
        {
          entityType: 'customer',
          entityId: customerId,
          action: 'assigned',
          performedBy: currentUser.id,
          organizationId: currentUser.organizationId,
          metadata: { assignedTo: assignToUserId },
        },
        manager,
      );

      return manager.findOne(Customer, {
        where: { id: customerId },
        relations: ['assignee'],
      });
    });
  }
}
