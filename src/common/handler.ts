import { AsyncHandler } from './util/handler';
import { OcppClient } from './session';
import OcppMessage, { InboundOcppMessage, OutboundMessage } from './message';
import OcppProtocolVersion from '../types/ocpp/protocol-version';

abstract class OcppAuthenticationHandler<
  TRequest extends OcppAuthenticationRequest = OcppAuthenticationRequest
> extends AsyncHandler<TRequest> {}

abstract class OcppAuthenticationRequest {
  private _accepted: boolean;
  private _rejected: boolean;
  private _protocol: OcppProtocolVersion;

  readonly client: OcppClient;
  readonly protocols: OcppProtocolVersion[];
  readonly password?: string;
  readonly certificate?: unknown;

  constructor() {
    this._accepted = this._rejected = false;
  }

  accept(protocol: OcppProtocolVersion = this.protocols[0]) {
    if (this.isAccepted || this.isRejected) {
      throw new Error(
        `accept() was called but authentication attempt from
        client with id ${this.client.id} has already been
        ${this.isAccepted ? 'accepted' : this.isRejected ? 'rejected' : ''}`
      );
    }

    this._accepted = true;
    this._protocol = protocol;
  }

  reject(reason?: unknown) {
    if (this.isAccepted || this.isRejected) {
      throw new Error(
        `reject() was called but authentication attempt from
        client with id ${this.client.id} has already been
        ${this.isAccepted ? 'accepted' : this.isRejected ? 'rejected' : ''}`
      );
    }

    this._rejected = true;
  }

  get isAccepted() {
    return this._accepted;
  }

  get isRejected() {
    return this._rejected;
  }

  get protocol() {
    return this._protocol;
  }
}

abstract class OcppMessageHandler<
  TMessage extends OcppMessage = OcppMessage
> extends AsyncHandler<TMessage> {}

abstract class InboundMessageHandler<
  TMessage extends InboundOcppMessage = InboundOcppMessage
> extends OcppMessageHandler<TMessage> {}

abstract class OutboundMessageHandler<
  TMessage extends OutboundMessage = OutboundMessage
> extends OcppMessageHandler<TMessage> {}

type ResponseHandler<TResponse extends OutboundMessage> = (
  response: TResponse
) => Promise<void>;

export {
  AsyncHandler,
  OcppAuthenticationHandler,
  OcppAuthenticationRequest,
  InboundMessageHandler,
  OutboundMessageHandler,
  ResponseHandler,
};
