import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './login.dto';
import { PasswordUtils } from '../utils/password.utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(
        `Tentative de connexion pour l'utilisateur: ${loginDto.username}`,
      );

      const user = await this.usersService.findByUsername(loginDto.username);

      const isPasswordValid = PasswordUtils.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Échec d'authentification pour l'utilisateur: ${loginDto.username}`,
        );
        throw new UnauthorizedException('Identifiants invalides');
      }

      const payload = { sub: user.id, username: user.username };
      const token = this.jwtService.sign(payload);

      this.logger.log(
        `Connexion réussie pour l'utilisateur: ${loginDto.username}`,
      );

      const { ...result } = user;
      return {
        user: result,
        token,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erreur lors de la connexion: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la connexion',
      );
    }
  }

  async validateUser(payload: { sub: string; username: string }) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Erreur de validation du token: ${errorMessage}`,
        errorStack,
      );
      throw new UnauthorizedException('Session invalide');
    }
  }
}
