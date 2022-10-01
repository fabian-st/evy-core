import { OcppClient } from './session';
import OcppMessageType from '../types/ocpp/message-type';
import OcppAction from '../types/ocpp/action';
import OcppMessage, {
  OcppMessagePayload,
  InboundMessage,
  OutboundMessage,
} from './message';

type RPCError =
  | 'FormatViolation'
  | 'GenericError'
  | 'InternalError'
  | 'MessageTypeNotSupported'
  | 'NotImplemented'
  | 'NotSupported'
  | 'OccurrenceConstraintViolation'
  | 'PropertyConstraintViolation'
  | 'ProtocolError'
  | 'RpcFrameworkError'
  | 'SecurityError'
  | 'TypeConstraintViolation';

interface OcppCallErrorMessage extends OcppMessage {
  readonly type: OcppMessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: OcppMessagePayload;
}

class InboundOcppCallError
  extends InboundMessage
  implements OcppCallErrorMessage
{
  readonly type: OcppMessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: OcppMessagePayload;

  constructor(
    sender: OcppClient,
    id: string,
    code: RPCError = 'GenericError',
    description = '',
    details: OcppMessagePayload = {}
  ) {
    super(sender, id);
    this.type = OcppMessageType.CALLERROR;
    this.code = code;
    this.description = description;
    this.details = details;
  }
}

class OutboundOcppCallError
  extends OutboundMessage
  implements OcppCallErrorMessage
{
  readonly type: OcppMessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: OcppMessagePayload;

  constructor(
    recipient: OcppClient,
    id: string,
    code: RPCError = 'GenericError',
    description = '',
    details: OcppMessagePayload = {}
  ) {
    super(recipient, id);
    this.type = OcppMessageType.CALLERROR;
    this.code = code;
    this.description = description;
    this.details = details;
  }
}

export default OcppCallErrorMessage;
export { InboundOcppCallError, OutboundOcppCallError, RPCError };
