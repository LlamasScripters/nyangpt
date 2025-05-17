import { RoomInsert } from 'src/db/schema';

export class CreateRoomDto
  implements Omit<RoomInsert, 'id' | 'createdAt' | 'updatedAt'>
{
  name: string;
  description?: string;
}
