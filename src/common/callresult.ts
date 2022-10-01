import { OcppClient } from './session';
import OcppMessageType from '../types/ocpp/message-type';
import OcppAction from '../types/ocpp/action';
import OcppMessage, {
  Payload,
  InboundMessage,
  OutboundMessage,
} from './message';

interface OcppCallResultMessage<TPayload extends Payload = Payload>
  extends OcppMessage {
  readonly type: OcppMessageType.CALLRESULT;
  data: TPayload;
}

class InboundCallResult<TPayload extends Payload = Payload>
  extends InboundMessage
  implements OcppCallResultMessage<TPayload>
{
  readonly type: OcppMessageType.CALLRESULT;
  action: OcppAction;
  data: TPayload;

  constructor(sender: OcppClient, id: string, data: TPayload) {
    super(sender, id);
    this.type = OcppMessageType.CALLRESULT;
    this.data = data;
  }
}

class OutboundCallResult<TPayload extends Payload = Payload>
  extends OutboundMessage
  implements OcppCallResultMessage<TPayload>
{
  readonly type: OcppMessageType.CALLRESULT;
  action: OcppAction;
  data: TPayload;

  constructor(recipient: OcppClient, id: string, data: TPayload) {
    super(recipient, id);
    this.type = OcppMessageType.CALLRESULT;
    this.data = data;
  }
}

export default OcppCallResultMessage;
export { InboundCallResult, OutboundCallResult };
