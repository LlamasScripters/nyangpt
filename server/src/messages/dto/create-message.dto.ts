import { MessageInsert } from 'src/db/schema';

export class CreateMessageDto
  implements Omit<MessageInsert, 'id' | 'createdAt'>
{
  content: string;
  userId: string;
}
