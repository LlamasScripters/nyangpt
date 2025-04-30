import type { User } from 'src/db/schema';

export class UpdateUserDto
  implements Pick<User, 'id' | 'username' | 'email' | 'color'>
{
  id: string;
  username: string;
  email: string;
  color: string;
}
