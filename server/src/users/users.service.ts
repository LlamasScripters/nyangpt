import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PostgresError } from 'postgres';
import * as schema from '../db/schema';
import { User, users } from '../db/schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordUtils } from '../utils/password.utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('DB_DEV') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      this.logger.log(
        `Création d'un nouvel utilisateur: ${createUserDto.username}`,
      );

      // remplacement de bcrypt par PasswordUtils car ça fait crasher le back
      const hashedPassword = PasswordUtils.hash(createUserDto.password);

      this.logger.debug('Mot de passe haché avec succès');

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

      this.logger.log(`Utilisateur créé avec succès: ${newUser.username}`);
      return newUser;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Erreur lors de la création de l'utilisateur: ${errorMessage}`,
        errorStack,
      );

      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException("Nom d'utilisateur ou email déjà utilisé");
      }
      throw error;
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    try {
      return this.db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          color: users.color,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Erreur lors de la récupération des utilisateurs: ${errorMessage}`,
        errorStack,
      );
      return [];
    }
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        color: users.color,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user[0];
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
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      return updatedUser;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Erreur lors de la mise à jour de l'utilisateur: ${errorMessage}`,
        errorStack,
      );
      if (error instanceof PostgresError && error.code === '23505') {
        throw new ConflictException("Nom d'utilisateur ou email déjà utilisé");
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
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return deletedUser;
  }

  async findByUsername(username: string): Promise<User> {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(
        `Utilisateur avec le nom d'utilisateur ${username} non trouvé`,
      );
    }

    return result[0];
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const hashedPassword = PasswordUtils.hash(newPassword);

      await this.db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .execute();

      this.logger.log(`Mot de passe mis à jour pour l'utilisateur ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : '';

      this.logger.error(
        `Erreur lors de la mise à jour du mot de passe: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
