import { OcppClient } from './session';
import MessageType from '../types/ocpp/type';
import OcppAction from '../types/ocpp/action';
import OcppMessage, {
  Payload,
  InboundMessage,
  OutboundMessage,
} from './message';

interface OcppCallResultMessage<TPayload extends Payload = Payload>
  extends OcppMessage {
  readonly type: MessageType.CALLRESULT;
  data: TPayload;
}

class InboundCallResult<TPayload extends Payload = Payload>
  extends InboundMessage
  implements OcppCallResultMessage<TPayload>
{
  readonly type: MessageType.CALLRESULT;
  action: OcppAction;
  data: TPayload;

  constructor(sender: OcppClient, id: string, data: TPayload) {
    super(sender, id);
    this.type = MessageType.CALLRESULT;
    this.data = data;
  }
}

class OutboundCallResult<TPayload extends Payload = Payload>
  extends OutboundMessage
  implements OcppCallResultMessage<TPayload>
{
  readonly type: MessageType.CALLRESULT;
  action: OcppAction;
  data: TPayload;

  constructor(recipient: OcppClient, id: string, data: TPayload) {
    super(recipient, id);
    this.type = MessageType.CALLRESULT;
    this.data = data;
  }
}

export default OcppCallResultMessage;
export { InboundCallResult, OutboundCallResult };
