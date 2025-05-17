import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { Message, messages } from '../db/schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('DB_DEV') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const [newMessage] = await this.db
      .insert(messages)
      .values(createMessageDto)
      .returning();

    return newMessage;
  }

  async findAll(): Promise<Message[]> {
    return this.db.query.messages.findMany({
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            color: true,
          },
        },
      },
    });
  }

  async findAllByRoom(roomId: string): Promise<Message[]> {
    return this.db.query.messages.findMany({
      where: eq(messages.roomId, roomId),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            color: true,
          },
        },
      },
      orderBy: messages.createdAt,
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.db.query.messages.findFirst({
      where: eq(messages.id, id),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            color: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async update(
    id: string,
    userId: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    const [updatedMessage] = await this.db
      .update(messages)
      .set({
        content: updateMessageDto.content,
      })
      .where(and(eq(messages.id, id), eq(messages.userId, userId)))
      .returning();

    if (!updatedMessage) {
      throw new NotFoundException(
        `Message with ID ${id} not found or you don't have permission to update it`,
      );
    }

    return updatedMessage;
  }

  async remove(id: string, userId: string): Promise<Message> {
    const [deletedMessage] = await this.db
      .delete(messages)
      .where(and(eq(messages.id, id), eq(messages.userId, userId)))
      .returning();

    if (!deletedMessage) {
      throw new NotFoundException(
        `Message with ID ${id} not found or you don't have permission to delete it`,
      );
    }

    return deletedMessage;
  }
}
