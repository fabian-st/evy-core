import { Client } from './session';
import MessageType from '../types/ocpp/type';
import OcppAction from '../types/ocpp/action';
import { InboundCallResult, OutboundCallResult } from './callresult';
import OcppMessage, {
  Payload,
  RespondableMessage,
  ResultingMessage,
} from './message';
import { InboundMessageHandler, ResponseHandler } from './handler';

interface CallMessage<
  TAction extends OcppAction = OcppAction,
  TPayload extends Payload = Payload
> extends OcppMessage {
  readonly type: MessageType.CALL;
  action: TAction;
  data: TPayload;
}

class InboundCall<
    TAction extends OcppAction = OcppAction,
    TPayload extends Payload = Payload,
    TResponsePayload extends Payload = Payload,
    TResponse extends OutboundCallResult<TResponsePayload> = OutboundCallResult<TResponsePayload>
  >
  extends RespondableMessage<TResponse>
  implements CallMessage<TAction, TPayload>
{
  type: MessageType.CALL;
  action: TAction;
  data: TPayload;

  constructor(
    sender: Client,
    id: string,
    action: TAction,
    data: TPayload,
    responseHandler?: ResponseHandler<TResponse>
  ) {
    super(sender, id, responseHandler);
    this.type = MessageType.CALL;
    this.action = action;
    this.data = data;
  }
}

class OutboundCall<
    TAction extends OcppAction = OcppAction,
    TPayload extends Payload = Payload,
    TResponsePayload extends Payload = Payload,
    TResponse extends InboundCallResult<TResponsePayload> = InboundCallResult<TResponsePayload>
  >
  extends ResultingMessage<TResponse>
  implements CallMessage<TAction, TPayload>
{
  type: MessageType.CALL;
  action: TAction;
  data: TPayload;

  constructor(
    recipient: Client,
    id: string,
    action: TAction,
    data: TPayload,
    responseHandler?: InboundMessageHandler<TResponse>
  ) {
    super(recipient, id, responseHandler);
    this.type = MessageType.CALL;
    this.action = action;
    this.data = data;
  }
}

export default CallMessage;
export { InboundCall, OutboundCall };
