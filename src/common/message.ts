import OcppMessageType from '../types/ocpp/message-type';
import { OcppClient } from './session';
import { InboundMessageHandler, ResponseHandler } from './handler';

type OcppMessageValue =
  | string
  | number
  | boolean
  | Date
  | { [x: string]: OcppMessageValue }
  | Array<OcppMessageValue>;

type OcppMessagePayload = OcppMessageValue | null | {};

abstract class OcppMessage {
  readonly type!: OcppMessageType;
  readonly id: string;
  protected _timestamp?: Date;

  constructor(id: string) {
    this.id = id;
    this._timestamp = null;
  }

  get timestamp() {
    return this._timestamp;
  }
}

abstract class InboundMessage extends OcppMessage {
  readonly sender: OcppClient;

  constructor(sender: OcppClient, id: string) {
    super(id);
    this.sender = sender;
    this._timestamp = new Date();
  }
}

abstract class OutboundMessage extends OcppMessage {
  recipient: OcppClient;
  private _isSent: boolean;

  constructor(recipient: OcppClient, id: string) {
    super(id);
    this.recipient = recipient;
    this._isSent = false;
  }

  setSent() {
    this._isSent = true;
    this._timestamp = new Date();
  }

  get isSent() {
    return this._isSent;
  }
}

abstract class RespondableOcppMessage<
  TResponse extends OutboundMessage
> extends InboundMessage {
  private _responseHandler?: ResponseHandler<TResponse>;
  private _response?: OutboundMessage;

  constructor(
    sender: OcppClient,
    id: string,
    responseHandler?: ResponseHandler<TResponse>
  ) {
    super(sender, id);
    this._responseHandler = responseHandler || null;
    this._response = null;
  }

  async respond(response: TResponse) {
    if (!this._responseHandler) {
      throw new Error('respond() was called but responseHandler is not set');
    }

    await this._responseHandler(response);
    this._response = response;
  }

  set responseHandler(handler: ResponseHandler<TResponse>) {
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
  TResponse extends InboundMessage
> extends OutboundMessage {
  private _responseHandler?: InboundMessageHandler<TResponse>;
  private _response?: TResponse;

  constructor(
    recipient: OcppClient,
    id: string,
    responseHandler?: InboundMessageHandler<TResponse>
  ) {
    super(recipient, id);
    this._responseHandler = responseHandler || null;
  }

  async onResponse(response: TResponse) {
    if (!this._responseHandler) {
      throw new Error('onResponse() was called but responseHandler is not set');
    }

    this._response = response;
    await this._responseHandler.handle(response);
  }

  set responseHandler(handler: InboundMessageHandler<TResponse>) {
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
  OcppMessagePayload,
  InboundMessage,
  OutboundMessage,
  RespondableOcppMessage,
  ResultingOcppMessage,
};
