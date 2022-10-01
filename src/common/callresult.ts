import { OcppClient } from './session';
import OcppMessageType from '../types/ocpp/message-type';
import OcppAction from '../types/ocpp/action';
import OcppMessage, {
  OcppMessagePayload,
  InboundMessage,
  OutboundMessage,
} from './message';

interface OcppCallResultMessage<
  TPayload extends OcppMessagePayload = OcppMessagePayload
> extends OcppMessage {
  readonly type: OcppMessageType.CALLRESULT;
  data: TPayload;
}

class InboundOcppCallResult<
    TPayload extends OcppMessagePayload = OcppMessagePayload
  >
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

class OutboundOcppCallResult<
    TPayload extends OcppMessagePayload = OcppMessagePayload
  >
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
export { InboundOcppCallResult, OutboundOcppCallResult };
