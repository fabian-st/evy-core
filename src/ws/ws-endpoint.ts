import { Logger } from 'ts-log';

import path from 'path';
import { Duplex } from 'stream';
import { promises as fsPromises } from 'fs';
import { IncomingMessage as HTTPRequest, STATUS_CODES } from 'http';
import { WebSocket, Server as WSServer, ServerOptions as WSOptions } from 'ws';
import { validate as validateJsonSchema } from 'jsonschema';
import { oneLine, oneLineInlineLists } from 'common-tags';
import { randomBytes } from 'crypto';
import basicAuth from 'basic-auth';
import merge from 'lodash.merge';

import OcppEndpoint, { OcppEndpointConfig } from '../common/endpoint';
import { OcppClient, OcppSessionService } from '../common/session';
import { InboundOcppCall, OutboundOcppCall } from '../common/call';

import {
  InboundOcppCallResult,
  OutboundOcppCallResult,
} from '../common/callresult';

import {
  InboundOcppCallError,
  OutboundOcppCallError,
} from '../common/callerror';

import OcppProtocolVersion, {
  OcppProtocolVersions,
} from '../types/ocpp/OcppProtocolVersion';
import OcppMessageType from '../types/ocpp/OcppMessageType';
import OcppAction from '../types/ocpp/action';

import {
  InboundOcppMessage,
  OcppMessagePayload,
  OutboundOcppMessage,
} from '../common/message';

import {
  InboundOcppMessageHandler,
  OcppAuthenticationHandler,
  OcppAuthenticationRequest,
  OutboundOcppMessageHandler,
} from '../common/handler';

type WebSocketConfig = OcppEndpointConfig & {
  wsOptions?: WSOptions;
  route?: string;
  protocols?: Readonly<OcppProtocolVersion[]>;
  basicAuth?: boolean;
  certificateAuth?: boolean;
  schemaValidation?: boolean;
  schemaDir?: Map<OcppProtocolVersion[], string>;
};

class WebSocketEndpoint extends OcppEndpoint<WebSocketConfig> {
  protected wsServer: WSServer;
  protected requestSchemas: Map<OcppAction, Record<string, any>>;
  protected responseSchemas: Map<OcppAction, Record<string, any>>;

  constructor(
    config: WebSocketConfig,
    authenticationHandlers: OcppAuthenticationHandler[],
    inboundMessageHandlers: InboundOcppMessageHandler[],
    outboundMessageHandlers?: OutboundOcppMessageHandler[],
    sessionService?: OcppSessionService,
    logger?: Logger
  ) {
    super(
      config,
      authenticationHandlers,
      inboundMessageHandlers,
      outboundMessageHandlers,
      sessionService,
      logger
    );
    this.wsServer = new WSServer(this.config.wsOptions);
    this.httpServer.on('upgrade', this.onHttpUpgrade);
    this.wsServer.on('connection', this.onWsConnected);

    this.requestSchemas = new Map();
    this.responseSchemas = new Map();
  }

  protected get defaultConfig() {
    const schemaBase = path.join(__dirname, '../../../var/jsonschema');

    const config: WebSocketConfig = {
      wsOptions: { noServer: true },
      route: 'ocpp',
      protocols: OcppProtocolVersions,
      basicAuth: true,
      certificateAuth: true,
      schemaValidation: true,
      schemaDir: new Map([
        // OCPP <= 1.6    /var/jsonschema/ocpp1.6
        [['ocpp1.2', 'ocpp1.5', 'ocpp1.6'], path.join(schemaBase, 'ocpp1.6')],
        // OCPP >= 2.0    /var/jsonschema/ocpp2.0.1
        [['ocpp2.0', 'ocpp2.0.1'], path.join(schemaBase, 'ocpp2.0.1')],
      ]),
    };

    return merge(super.defaultConfig, config);
  }

  protected get sendMessageHandler() {
    const handleSend = async (message: OutboundOcppMessage) => {
      const ws = this.getSocket(message.recipient.id);
      const session = await this.sessionService.get(message.recipient.id);

      const messageArr: any[] = [message.type, message.id];
      if (message instanceof OutboundOcppCall) {
        messageArr.push(message.action, message.data);
      } else if (message instanceof OutboundOcppCallResult) {
        messageArr.push(message.data);
      } else if (message instanceof OutboundOcppCallError) {
        messageArr.push(message.code, message.description, message.details);
      }

      if (
        this.config.schemaValidation &&
        (message instanceof OutboundOcppCall ||
          message instanceof OutboundOcppCallResult)
      ) {
        const dateToString = (key: string, value: string) => value;
        const rawData = JSON.parse(JSON.stringify(message.data), dateToString);

        const messageValidation = await this.validateSchema(
          message.type,
          message.action || session.pendingInboundMessage.action,
          rawData,
          ws.protocol as OcppProtocolVersion
        );

        if (!messageValidation?.valid) {
          this.logger.warn(
            oneLine`Outbound ${OcppMessageType[message.type]}
            message payload is not valid`
          );
          this.logger.trace(messageValidation.errors);
          return;
        } else {
          this.logger.debug(
            `Outbound ${OcppMessageType[message.type]} message payload is valid`
          );
        }
      }

      ws.send(JSON.stringify(messageArr));
    };

    return new (class extends OutboundOcppMessageHandler {
      async handle(message: OutboundOcppMessage) {
        await handleSend(message);
        return await super.handle(message);
      }
    })() as OutboundOcppMessageHandler;
  }

  public hasSession(clientId: string) {
    return this.getSocket(clientId)?.readyState === WebSocket.OPEN;
  }

  public async dropSession(
    clientId: string,
    force = false,
    code = 1000,
    data?: string | Buffer
  ) {
    const ws = this.getSocket(clientId);

    if (force) {
      ws.terminate();
    } else {
      ws.close(code, data);
    }

    this.onSessionClosed(clientId);
  }

  protected getSocket(clientId: string) {
    let socket: WebSocket;
    this.wsServer.clients.forEach(ws => {
      if (path.parse(ws.url).base === clientId) {
        socket = ws;
      }
    });

    return socket;
  }

  protected onHttpUpgrade = (
    request: HTTPRequest,
    socket: Duplex,
    head: Buffer
  ) => {
    let error;
    let requestProperties;

    try {
      requestProperties = this.parseUpgradeRequest(request);
    } catch (err) {
      error = err as any as Error;
    }

    const { id, password, protocols } = requestProperties;

    const authRequest = new (class extends OcppAuthenticationRequest {
      client = new OcppClient(id);
      protocols = protocols;
      password = password ?? undefined;

      accept(protocol = this.protocols[0]) {
        super.accept(protocol);
        onAccept(protocol);
      }

      reject(status = 401) {
        super.reject();
        onReject(status);
      }
    })();

    const onAccept = async (protocol: OcppProtocolVersion) => {
      this.logger.debug(
        `Upgrading WebSocket connection with subprotocol: ${protocol}`
      );

      await this.onAuthenticationSuccess(authRequest);

      this.wsServer.handleUpgrade(request, socket, head, ws => {
        (ws as any)._url = request.url;

        ws.on('close', (code, reason) =>
          this.onWsDisconnected(ws, code, reason)
        );

        this.wsServer.emit('connection', ws, request, authRequest.client);
      });
    };

    const onReject = (status: number) => {
      this.logger.debug(
        oneLine`Rejecting upgrade request with
        status: ${status} ${STATUS_CODES[status]}`
      );

      this.onAuthenticationFailure(authRequest);

      socket.write(`HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\n\r\n`);
      socket.destroy();
    };

    if (error) {
      this.logger.warn('Error while parsing HTTP(S) upgrade request');
      this.logger.trace(error.stack);
      authRequest.reject(400);
    }

    this.onAuthenticationAttempt(authRequest);
  };

  protected parseUpgradeRequest(request: HTTPRequest) {
    const requestPath = path.parse(request.url);
    const clientId = requestPath.base;

    const basicCredentials = this.config.basicAuth
      ? basicAuth(request)
      : undefined;

    const clientProtocols =
      request.headers['sec-websocket-protocol']?.split(',');

    const supportedProtocols = this.config.protocols.filter(protocol =>
      clientProtocols?.includes(protocol)
    ) as OcppProtocolVersion[];

    const trimSlashesRegex = /^\/+|\/+$/g;
    if (
      requestPath.dir.replaceAll(trimSlashesRegex, '') !==
      this.config.route.replaceAll(trimSlashesRegex, '')
    ) {
      throw new Error(
        oneLine`Client with id ${clientId} attempted
        authentication on invalid route: ${request.url}`
      );
    } else if (!clientProtocols) {
      throw new Error(
        oneLine`Client with id ${clientId} attempted authentication
        without specifying any WebSocket subprotocol`
      );
    } else if (supportedProtocols.length === 0) {
      throw new Error(
        oneLineInlineLists`Client with id ${clientId}
        attempted authentication with unsupported WebSocket
        subprotocol(s): ${clientProtocols}`
      );
    } else if (this.config.basicAuth && !basicCredentials) {
      throw new Error(
        oneLine`Client with id ${clientId} attempted
        authentication without supplying BASIC credentials`
      );
    } else if (this.config.basicAuth && basicCredentials.name !== clientId) {
      throw new Error(
        oneLine`Client attempted authentication with
        mismatching ids ${clientId} in request path and
        ${basicCredentials.name} in BASIC credentials`
      );
    }

    return {
      id: clientId,
      password: basicCredentials?.pass,
      protocols: supportedProtocols,
    };
  }

  protected onWsConnected = (
    ws: WebSocket,
    request: HTTPRequest,
    client: OcppClient
  ) => {
    ws.on('message', async (data, isBinary) => {
      if (isBinary) {
        this.logger.warn(
          `Received message with binary data from client with
          id ${client.id} which is currently not supported`
        );
        this.dropSession(client.id);
        return;
      }

      let messageProperties;
      try {
        messageProperties = this.parseRawMessage(data.toString());
      } catch (err: any) {
        this.logger.warn(
          `Error while parsing message from client with id ${client.id}`
        );
        this.logger.trace(err.stack);

        const errorResponse = new OutboundOcppCallError(
          client,
          randomBytes(16).toString('hex'),
          'ProtocolError',
          `Failed to parse message: ${err.message}`,
          null
        );

        await this.sendMessage(errorResponse);
        return;
      }

      const {
        type,
        id,
        action,
        payload,
        errorCode,
        errorDescription,
        errorDetails,
      } = messageProperties;

      if (
        this.config.schemaValidation &&
        (type === OcppMessageType.CALL || type === OcppMessageType.CALLRESULT)
      ) {
        const messageValidation = await this.validateSchema(
          type,
          action,
          payload,
          ws.protocol as OcppProtocolVersion
        );

        if (!messageValidation?.valid) {
          this.logger.warn(
            `Inbound ${OcppMessageType[type]} message payload is not valid`
          );
          this.logger.trace(messageValidation.errors);
          return;
        } else {
          this.logger.debug(
            `Inbound ${OcppMessageType[type]} message payload is valid`
          );
        }
      }

      const responseHandler = async (response: OutboundOcppMessage) => {
        await this.sendMessage(response);
      };

      let message: InboundOcppMessage;
      switch (type) {
        case OcppMessageType.CALL:
          message = new InboundOcppCall(
            client,
            id,
            action,
            payload,
            responseHandler
          );
          break;

        case OcppMessageType.CALLRESULT:
          message = new InboundOcppCallResult(client, id, payload);
          break;

        case OcppMessageType.CALLERROR:
          message = new InboundOcppCallError(
            client,
            id,
            errorCode,
            errorDescription,
            errorDetails
          );
          break;
      }

      this.onInboundMessage(message);
    });
  };

  protected onWsDisconnected = (
    ws: WebSocket,
    code: number,
    reason: Buffer
  ) => {
    this.onSessionClosed(path.parse(ws.url).base);
  };

  protected parseRawMessage(rawMessage: string) {
    let message: Array<any>;
    try {
      message = JSON.parse(rawMessage);
    } catch (err: any) {
      throw new Error('Invalid JSON format', { cause: err });
    }

    if (!Array.isArray(message)) {
      throw new Error('Message is not an array');
    }

    const type: number = message[0];
    if (
      typeof type !== 'number' ||
      !Object.values(OcppMessageType).includes(type)
    ) {
      throw new Error('Missing or invalid type field');
    }

    const isCallMessage = type === OcppMessageType.CALL;
    const isCallResultMessage = type === OcppMessageType.CALLRESULT;
    const isCallErrorMessage = type === OcppMessageType.CALLERROR;

    const id: string = message[1];
    if (typeof id !== 'string') {
      throw new Error('Missing or invalid id field');
    }

    const action: OcppAction = isCallMessage ? message[2] : null;
    if (isCallMessage && typeof action !== 'string') {
      throw new Error('Missing or invalid action field');
    }

    const errorCode = isCallErrorMessage ? message[2] : null;
    const errorDescription = isCallErrorMessage ? message[3] : null;
    const errorDetails = isCallErrorMessage ? message[4] : null;
    if (
      isCallErrorMessage &&
      (typeof errorCode !== 'string' || typeof errorDescription !== 'string')
    ) {
      throw new Error('Missing or invalid error code or description field');
    }

    const payload: OcppMessagePayload = isCallMessage
      ? message[3]
      : isCallResultMessage
      ? message[2]
      : null;

    return {
      type,
      id,
      action,
      payload,
      errorCode,
      errorDescription,
      errorDetails,
    };
  }

  protected async validateSchema(
    type: OcppMessageType.CALL | OcppMessageType.CALLRESULT,
    action: OcppAction,
    payload: OcppMessagePayload,
    protocol: OcppProtocolVersion
  ) {
    let schema: Record<string, any>;
    let schemaType: 'request' | 'response';
    let schemaMap: Map<OcppAction, Record<string, any>>;

    switch (type) {
      case OcppMessageType.CALL:
        schemaType = 'request';
        schemaMap = this.requestSchemas;
        break;

      case OcppMessageType.CALLRESULT:
        schemaType = 'response';
        schemaMap = this.responseSchemas;
        break;
    }

    if (!schemaMap.has(action)) {
      schema = await this.loadSchema(schemaType, action, protocol);
      schemaMap.set(action, schema);
    } else {
      schema = schemaMap.get(action);
    }

    return validateJsonSchema(payload, schema);
  }

  protected async loadSchema(
    type: 'request' | 'response',
    action: OcppAction,
    protocol: OcppProtocolVersion
  ) {
    let schemaDir: string;
    this.config.schemaDir.forEach((dir, protocols) => {
      if (protocols.includes(protocol)) {
        schemaDir = dir;
      }
    });

    if (!schemaDir) {
      throw new Error(
        `Missing schema directory for protocol
        ${protocol} in WebSocket endpoint config`
      );
    }

    const schemaPath = path.join(schemaDir, `${action}R${type.slice(1)}.json`);

    let rawSchema: string;
    try {
      rawSchema = await (await fsPromises.readFile(schemaPath)).toString();
    } catch (err) {
      throw new Error(
        `Error while attempting to read JSON schema from file: ${schemaPath}`,
        { cause: err as any }
      );
    }

    let jsonSchema: Record<string, any>;
    try {
      jsonSchema = JSON.parse(rawSchema);
    } catch (err) {
      throw new Error('Error while attempting to parse JSON schema', {
        cause: err as any,
      });
    }

    return jsonSchema;
  }
}

export default WebSocketEndpoint;
export { WebSocketConfig };
