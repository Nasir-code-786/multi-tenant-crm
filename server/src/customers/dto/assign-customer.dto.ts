import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignCustomerDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}
