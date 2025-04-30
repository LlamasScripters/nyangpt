import { UserInsert } from 'src/db/schema';

export class CreateUserDto implements UserInsert {
  username: string;
  email: string;
  password: string;
  id?: string | undefined;
  color?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
