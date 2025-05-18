import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagesGateway.name);
  private connectedClients = new Map<
    string,
    { userId: string; socket: Socket }
  >();

  @WebSocketServer() server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;

      if (!token) {
        this.logger.error(
          `Client ${client.id} refusé: pas de token d'authentification`,
        );
        client.disconnect(true);
        return;
      }

      try {
        interface JwtPayload {
          sub: string;
        }
        const payload = this.jwtService.verify<JwtPayload>(token);
        const userId = payload.sub;

        if (!userId) {
          this.logger.error(
            `Token invalide pour le client ${client.id}: pas d'ID utilisateur`,
          );
          client.disconnect(true);
          return;
        }

        try {
          await this.usersService.findOne(userId);
        } catch {
          this.logger.error(
            `Utilisateur ${userId} non trouvé pour le client ${client.id}`,
          );
          client.disconnect(true);
          return;
        }

        this.connectedClients.set(client.id, { userId, socket: client });
        this.logger.log(`Client ${client.id} connecté (utilisateur ${userId})`);

        client.emit('connection_success', {
          message: 'Connecté au serveur de chat',
        });
      } catch (error) {
        this.logger.error(
          `Token invalide pour le client ${client.id}:`,
          error instanceof Error ? error.message : String(error),
        );
        client.disconnect(true);
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la connexion du client ${client.id}:`,
        error,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} déconnecté`);
  }

  private getUserIdFromClient(client: Socket): string {
    const connection = this.connectedClients.get(client.id);
    if (!connection) {
      throw new WsException('Client non authentifié');
    }
    return connection.userId;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    try {
      this.logger.log(`Client ${client.id} rejoint la salle ${roomId}`);
      await client.join(roomId);
      const messages = await this.messagesService.findAllByRoom(roomId);
      return { event: 'messages', data: messages };
    } catch (error) {
      this.logger.error(`Erreur lors de l'accès à la salle ${roomId}:`, error);
      client.emit('error', {
        message: 'Impossible de rejoindre la salle de discussion',
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    this.logger.log(`Client ${client.id} quitte la salle ${roomId}`);
    await client.leave(roomId);
    return { event: 'leftRoom', data: roomId };
  }

  @SubscribeMessage('createMessage')
  async handleCreateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const userId = this.getUserIdFromClient(client);

      const messageData = {
        ...createMessageDto,
        userId,
      };

      this.logger.log(
        `Création de message par l'utilisateur ${userId} dans la salle ${messageData.roomId}`,
      );

      const message = await this.messagesService.create(messageData);

      this.server.to(messageData.roomId).emit('newMessage', message);

      return { event: 'messageSent', data: message };
    } catch (error) {
      this.logger.error('Erreur lors de la création du message:', error);
      client.emit('error', { message: 'Impossible de créer le message' });
    }
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateData: { userId: string; message: UpdateMessageDto },
  ) {
    try {
      const userId = this.getUserIdFromClient(client);

      const { message } = updateData;

      this.logger.log(
        `Mise à jour du message ${message.id} par l'utilisateur ${userId}`,
      );

      const updatedMessage = await this.messagesService.update(
        message.id,
        userId,
        message,
      );

      const originalMessage = await this.messagesService.findOne(message.id);

      this.server
        .to(originalMessage.roomId)
        .emit('messageUpdated', updatedMessage);

      return { event: 'messageUpdated', data: updatedMessage };
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du message:', error);
      client.emit('error', {
        message: 'Impossible de mettre à jour le message',
      });
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() deleteData: { id: string; userId: string; roomId: string },
  ) {
    try {
      const userId = this.getUserIdFromClient(client);

      const { id, roomId } = deleteData;

      this.logger.log(
        `Suppression du message ${id} par l'utilisateur ${userId}`,
      );

      await this.messagesService.remove(id, userId);

      this.server.to(roomId).emit('messageDeleted', id);

      return { event: 'messageDeleted', data: id };
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du message:', error);
      client.emit('error', { message: 'Impossible de supprimer le message' });
    }
  }
}
