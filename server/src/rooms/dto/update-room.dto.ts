import type { RoomUpdate } from 'src/db/schema';

export class UpdateRoomDto implements RoomUpdate {
  id: string;
  name?: string | undefined;
  description?: string | null | undefined;
}
