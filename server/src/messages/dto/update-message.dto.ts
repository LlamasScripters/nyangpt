import type { MessageUpdate } from 'src/db/schema';

export class UpdateMessageDto implements MessageUpdate {
  id: string;
  content: string;
  userId: string;
}
