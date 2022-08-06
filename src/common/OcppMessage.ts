import OcppClient from './OcppClient';
import OcppSession from './OcppSession';
import { InboundOcppMessageHandler, OutboundOcppMessageHandler } from './OcppHandlers';

enum OcppMessageType {
  CALL = 2,
  CALLRESULT = 3,
  CALLERROR = 4,
}

type OcppMessageValue =
  | string
  | number
  | boolean
  | Date
  | { [x: string]: OcppMessageValue }
  | Array<OcppMessageValue>;

type OcppMessagePayload = OcppMessageValue | null | {};

abstract class OcppMessageContext<
  TOriginal,
  TClient extends OcppClient,
  TSession extends OcppSession<TClient>
> {
  private _original: TOriginal;
  private _session: TSession;

  constructor(original: TOriginal, session: TSession) {
    this._original = original;
    this._session = session;
  }

  get original() {
    return this._original;
  }

  get session() {
    return this._session;
  }
}

abstract class OcppMessage<
  TClient extends OcppClient = OcppClient,
  TSession extends OcppSession<TClient> = OcppSession<TClient>,
  TContext extends OcppMessageContext<unknown, TClient, TSession> = null
> {
  type!: OcppMessageType;
  private _id: string;
  private _context?: TContext;
  protected _timestamp?: Date;

  constructor(id: string, context?: TContext) {
    this._id = id;
    this._context = context || null;
    this._timestamp = null;
  }

  get id() {
    return this._id;
  }

  set context(context: TContext) {
    this._context = context;
  }

  get context() {
    return this._context;
  }

  get timestamp() {
    return this._timestamp;
  }
}

abstract class InboundOcppMessage<
  TClient extends OcppClient = OcppClient,
  TSession extends OcppSession<TClient> = OcppSession<TClient>,
  TContext extends OcppMessageContext<unknown, TClient, TSession> = null
> extends OcppMessage<TClient, TSession, TContext> {
  protected _sender: OcppClient;

  constructor(id: string, sender: OcppClient, context?: TContext) {
    super(id, context);
    this._timestamp = new Date();
    this._sender = sender;
  }

  get sender() {
    return this._sender;
  }
}

abstract class OutboundOcppMessage<
  TClient extends OcppClient = OcppClient,
  TSession extends OcppSession<TClient> = OcppSession<TClient>,
  TContext extends OcppMessageContext<unknown, TClient, TSession> = null
> extends OcppMessage<TClient, TSession, TContext> {
  _recipient?: OcppClient;
  _isSent: boolean;

  constructor(id: string, recipient?: OcppClient, context?: TContext) {
    super(id, context);
    this._recipient = recipient;
    this._isSent = false;
  }

  setSent() {
    this._isSent = true;
    this._timestamp = new Date();
  }

  set recipient(recipient: OcppClient) {
    this.recipient = recipient;
  }

  get recipient() {
    return this._recipient;
  }

  get isSent() {
    return this._isSent;
  }
}

abstract class RespondableOcppMessage<
  TResponse extends OutboundOcppMessage,
  TClient extends OcppClient = OcppClient,
  TSession extends OcppSession<TClient> = OcppSession<TClient>,
  TContext extends OcppMessageContext<unknown, TClient, TSession> = null
> extends InboundOcppMessage<TClient, TSession, TContext> {
  private _responseHandler?: OutboundOcppMessageHandler<TResponse>;
  private _response?: OutboundOcppMessage;

  constructor(
    id: string,
    sender: OcppClient,
    responseHandler?: OutboundOcppMessageHandler<TResponse>,
    context?: TContext
  ) {
    super(id, sender, context);
    this._responseHandler = responseHandler || null;
    this._response = null;
  }

  async respond(response: TResponse) {
    if (!this._responseHandler) {
      throw new Error('respond() was called but responseHandler is not set');
    }

    await this._responseHandler.handle(response);
    this._response = response;
  }

  set responseHandler(handler: OutboundOcppMessageHandler<TResponse>) {
    this._responseHandler = handler;
  }

  get isResponded() {
    return !!this._response;
  }

  get response() {
    return this._response;
  }
}

abstract class ResultingOcppMessage<
  TResponse extends InboundOcppMessage,
  TClient extends OcppClient = OcppClient,
  TSession extends OcppSession<TClient> = OcppSession<TClient>,
  TContext extends OcppMessageContext<unknown, TClient, TSession> = null
> extends OutboundOcppMessage<TClient, TSession, TContext> {
  private _responseHandler?: InboundOcppMessageHandler<TResponse>;
  private _response?: TResponse;

  constructor(
    id: string,
    recipient?: OcppClient,
    responseHandler?: InboundOcppMessageHandler<TResponse>,
    context?: TContext
  ) {
    super(id, recipient, context);
    this._responseHandler = responseHandler || null;
    this._response = null;
  }

  async onResponse(response: TResponse) {
    if (!this._responseHandler) {
      throw new Error('onResponse() was called but responseHandler is not set');
    }

    this._response = response;
    await this._responseHandler.handle(response);
  }

  set responseHandler(handler: InboundOcppMessageHandler<TResponse>) {
    this._responseHandler = handler;
  }

  get hasResponse() {
    return !!this._response;
  }

  get response() {
    return this._response;
  }
}

export default OcppMessage;
export {
  OcppMessageType,
  OcppMessagePayload,
  OcppMessageContext,
  InboundOcppMessage,
  OutboundOcppMessage,
  RespondableOcppMessage,
  ResultingOcppMessage,
};