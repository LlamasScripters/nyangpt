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
        throw new ConflictException('Room name already taken');
      }
      throw error;
    }
  }

  async findAll(): Promise<Room[]> {
    return this.db.query.rooms.findMany();
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, id),
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
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
        throw new NotFoundException(`Room with ID ${id} not found`);
      }

      return updatedRoom;
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException('Room name already taken');
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
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return deletedRoom;
  }

  async findByName(name: string): Promise<Room> {
    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.name, name),
    });

    if (!room) {
      throw new NotFoundException(`Room with name ${name} not found`);
    }

    return room;
  }
}
