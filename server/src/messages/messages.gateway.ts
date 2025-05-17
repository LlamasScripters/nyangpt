import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
})
export class MessagesGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.join(roomId);
    const messages = await this.messagesService.findAllByRoom(roomId);
    return { event: 'messages', data: messages };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    await client.leave(roomId);
    return { event: 'leftRoom', data: roomId };
  }

  @SubscribeMessage('createMessage')
  async handleCreateMessage(@MessageBody() createMessageDto: CreateMessageDto) {
    const message = await this.messagesService.create(createMessageDto);

    // Broadcast the message to everyone in the room
    this.server.to(createMessageDto.roomId).emit('newMessage', message);

    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @MessageBody() updateData: { userId: string; message: UpdateMessageDto },
  ) {
    const { userId, message } = updateData;
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
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() deleteData: { id: string; userId: string; roomId: string },
  ) {
    const { id, userId, roomId } = deleteData;
    await this.messagesService.remove(id, userId);

    this.server.to(roomId).emit('messageDeleted', id);

    return { event: 'messageDeleted', data: id };
  }
}
