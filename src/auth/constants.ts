
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const jwtConstants = {
    secret: 'SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE,DO NOT USE THIS VALUE, INSTEAD, CREATE A COMPLEX CODE.',
  };