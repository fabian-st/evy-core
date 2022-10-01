import { OcppClient } from './session';
import MessageType from '../types/ocpp/type';
import OcppAction from '../types/ocpp/action';
import { InboundCallResult, OutboundCallResult } from './callresult';
import OcppMessage, {
  Payload,
  RespondableOcppMessage,
  ResultingOcppMessage,
} from './message';
import { InboundMessageHandler, ResponseHandler } from './handler';

interface OcppCallMessage<
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
  extends RespondableOcppMessage<TResponse>
  implements OcppCallMessage<TAction, TPayload>
{
  type: MessageType.CALL;
  action: TAction;
  data: TPayload;

  constructor(
    sender: OcppClient,
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
  extends ResultingOcppMessage<TResponse>
  implements OcppCallMessage<TAction, TPayload>
{
  type: MessageType.CALL;
  action: TAction;
  data: TPayload;

  constructor(
    recipient: OcppClient,
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

export default OcppCallMessage;
export { InboundCall, OutboundCall };
