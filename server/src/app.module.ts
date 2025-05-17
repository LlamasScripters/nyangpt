import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzlePostgresModule } from '@knaadh/nestjs-drizzle-postgres';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';
import { MessagesService } from './messages/messages.service';

@Module({
  imports: [
    DrizzlePostgresModule.register({
      tag: 'DB_DEV',
      postgres: {
        url: 'postgres://localhost:5432/nyangpt',
      },
    }),
    UsersModule,
    MessagesModule,
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MessagesService],
})
export class AppModule {}
