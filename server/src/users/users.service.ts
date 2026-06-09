import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findAllInOrg(currentUser: CurrentUserPayload) {
    return this.users.find({
      where: { organizationId: currentUser.organizationId },
      select: ['id', 'name', 'email', 'role', 'organizationId', 'createdAt'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(dto: CreateUserDto, currentUser: CurrentUserPayload) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      ...dto,
      password: hashed,
      organizationId: currentUser.organizationId,
    });
    const saved = await this.users.save(user);
    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      organizationId: saved.organizationId,
      createdAt: saved.createdAt,
    };
  }
}
