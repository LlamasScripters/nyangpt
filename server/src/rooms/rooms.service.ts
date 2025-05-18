import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PostgresError } from 'postgres';
import * as schema from '../db/schema';
import { Room, rooms } from '../db/schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DB_DEV') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    try {
      const [newRoom] = await this.db
        .insert(rooms)
        .values({
          ...createRoomDto,
        })
        .returning();

      return newRoom;
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException('Nom de salle déjà pris');
      }
      throw error;
    }
  }

  async findAll(): Promise<Room[]> {
    try {
      return this.db.select().from(rooms);
    } catch (error) {
      console.error('Erreur lors de la récupération des salles:', error);
      return [];
    }
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);

    if (!room.length) {
      throw new NotFoundException(`Salle avec l'ID ${id} non trouvée`);
    }

    return room[0];
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    try {
      const [updatedRoom] = await this.db
        .update(rooms)
        .set({
          name: updateRoomDto.name,
          description: updateRoomDto.description,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, id))
        .returning();

      if (!updatedRoom) {
        throw new NotFoundException(`Salle avec l'ID ${id} non trouvée`);
      }

      return updatedRoom;
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException('Nom de salle déjà pris');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Room> {
    const [deletedRoom] = await this.db
      .delete(rooms)
      .where(eq(rooms.id, id))
      .returning();

    if (!deletedRoom) {
      throw new NotFoundException(`Salle avec l'ID ${id} non trouvée`);
    }

    return deletedRoom;
  }

  async findByName(name: string): Promise<Room> {
    const room = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.name, name))
      .limit(1);

    if (!room.length) {
      throw new NotFoundException(`Salle avec le nom ${name} non trouvée`);
    }

    return room[0];
  }
}
