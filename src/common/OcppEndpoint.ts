/* eslint-disable node/no-unpublished-import */
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import OcppClient from './OcppClient';
import OcppSession from './OcppSession';
import OcppSessionService from './OcppSessionService';
import { InboundOcppMessage, OutboundOcppMessage } from './OcppMessage';
import {
  AsyncHandler,
  OcppAuthenticationHandler,
  OcppAuthenticationRequest,
  InboundOcppMessageHandler,
  OutboundOcppMessageHandler,
} from './OcppHandlers';

abstract class OcppEndpoint<
  TConfig extends OcppEndpointConfig,
  TClient extends OcppClient,
  TSession extends OcppSession<TClient>,
  TSessionService extends OcppSessionService<TClient, TSession>,
  TInboundMessage extends InboundOcppMessage,
  TOutboundMessage extends OutboundOcppMessage,
  TInboundMessageHandler extends InboundOcppMessageHandler<TInboundMessage>,
  TOutboundMessageHandler extends OutboundOcppMessageHandler<TOutboundMessage>,
  TAuthenticationRequest extends OcppAuthenticationRequest<TClient, TSession>,
  TAuthenticationHandler extends OcppAuthenticationHandler<
    TClient,
    TSession,
    TAuthenticationRequest
  >
> extends (EventEmitter as new () => TypedEmitter<OcppEndpointEvents>) {
  public readonly config: TConfig;

  private sessionService: TSessionService;
  private authenticationHandlers: TAuthenticationHandler[];
  private inboundMessageHandlers: TInboundMessageHandler[];
  private outboundMessageHandlers: TOutboundMessageHandler[];

  protected abstract get isListening(): boolean;
  protected abstract handleCreate(): void;
  protected abstract handleCreated(): void;
  protected abstract handleListen(): Promise<void>;
  protected abstract handleStop(): Promise<void>;

  constructor(
    config: TConfig,
    sessionService: TSessionService,
    authenticationHandlers: TAuthenticationHandler[],
    inboundMessageHandlers: TInboundMessageHandler[],
    outboundMessageHandlers: TOutboundMessageHandler[]
  ) {
    super();
    this.handleCreate();
    this.config = config;
    this.sessionService = sessionService;
    this.authenticationHandlers.concat(AsyncHandler.map(authenticationHandlers));
    this.inboundMessageHandlers.concat(AsyncHandler.map(inboundMessageHandlers));
    this.outboundMessageHandlers.concat(AsyncHandler.map(outboundMessageHandlers));
    this.handleCreated();
  }

  public async listen() {
    if (this.isListening) {
      throw new Error('Endpoint is already listening for connections');
    }

    this.emit('server_starting', this.config);
    await this.handleListen();
    this.emit('server_listening', this.config);
  }

  public async stop() {
    if (!this.isListening) {
      throw new Error('Endpoint is currently not listening for connections');
    }

    this.emit('server_stopping');
    await this.handleStop();
    this.emit('server_stopped');
  }

  public async sendMessage(message: TOutboundMessage) {
    if (!this.isListening) {
      throw new Error('Endpoint is currently not listening for connections');
    } else if (!this.sessionService.has(message.recipient.id)) {
      throw new Error(`Client with id ${message.recipient.id} is currently not connected`);
    }

    await this.outboundMessageHandlers[0].handle(message);
    this.emit('message_sent', message);
  }

  protected onConnectionAttempt(properties: TAuthenticationRequest) {
    this.authenticationHandlers[0].handle(properties);
  }

  protected onClientConnected(session: TSession) {
    if (this.sessionService.has(session.client.id)) {
      throw new Error(`Client with id ${session.client.id} is already connected`);
    }

    this.sessionService.add(session);
    this.emit('client_connected', session.client);
  }

  protected onClientDisconnected(session: TSession) {
    if (!this.sessionService.has(session.client.id)) {
      throw new Error(`Client with id ${session.client.id} is currently not connected`);
    }

    this.sessionService.remove(session);
    this.emit('client_disconnected', session.client);
  }

  protected onInboundMessage(message: TInboundMessage) {
    this.emit('message_received', message);
    this.inboundMessageHandlers[0].handle(message);
  }
}

type OcppEndpointEvents = {
  server_starting: (config: OcppEndpointConfig) => void;
  server_listening: (config: OcppEndpointConfig) => void;
  server_stopping: () => void;
  server_stopped: () => void;
  client_connected: (client: OcppClient) => void;
  client_disconnected: (client: OcppClient) => void;
  message_sent: (message: OutboundOcppMessage) => void;
  message_received: (message: InboundOcppMessage) => void;
};

type OcppEndpointConfig = {
  port: number;
  messageTimeout: number;
};

export default OcppEndpoint;
export { OcppEndpointEvents, OcppEndpointConfig };
