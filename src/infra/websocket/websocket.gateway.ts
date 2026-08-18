import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Logger from '@/infra/logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = Logger.getInstance('server');

  afterInit(server: Server) {
    this.logger.info('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.info(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.info(`Client disconnected: ${client.id}`);
  }

  // Example method to broadcast an event
  broadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
