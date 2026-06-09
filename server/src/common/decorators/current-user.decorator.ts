import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../users/user.entity';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export type AuthenticatedRequest = Request & { user: CurrentUserPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
