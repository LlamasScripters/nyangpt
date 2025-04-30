import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PostgresError } from 'postgres';
import * as schema from '../db/schema';
import { User, users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DB_DEV') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      const hashedPassword = await hash(createUserDto.password, 10);

      const [newUser] = await this.db
        .insert(users)
        .values({
          ...createUserDto,
          password: hashedPassword,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          color: users.color,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      return newUser;
    } catch (error) {
      // Handle unique constraint violations
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException('Username or email already taken');
      }
      throw error;
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.db.query.users.findMany({
      columns: {
        password: false,
      },
    });
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    try {
      const [updatedUser] = await this.db
        .update(users)
        .set({
          username: updateUserDto.username,
          email: updateUserDto.email,
          color: updateUserDto.color,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          color: users.color,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException('Username or email already taken');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Omit<User, 'password'>> {
    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        color: users.color,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return deletedUser;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    return user;
  }
}
