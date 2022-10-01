import { OcppClient } from './session';
import MessageType from '../types/ocpp/type';
import OcppAction from '../types/ocpp/action';
import OcppMessage, {
  Payload,
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
  readonly type: MessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: Payload;
}

class InboundCallError extends InboundMessage implements OcppCallErrorMessage {
  readonly type: MessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: Payload;

  constructor(
    sender: OcppClient,
    id: string,
    code: RPCError = 'GenericError',
    description = '',
    details: Payload = {}
  ) {
    super(sender, id);
    this.type = MessageType.CALLERROR;
    this.code = code;
    this.description = description;
    this.details = details;
  }
}

class OutboundCallError
  extends OutboundMessage
  implements OcppCallErrorMessage
{
  readonly type: MessageType.CALLERROR;
  code: RPCError;
  description: string;
  details: Payload;

  constructor(
    recipient: OcppClient,
    id: string,
    code: RPCError = 'GenericError',
    description = '',
    details: Payload = {}
  ) {
    super(recipient, id);
    this.type = MessageType.CALLERROR;
    this.code = code;
    this.description = description;
    this.details = details;
  }
}

export default OcppCallErrorMessage;
export { InboundCallError, OutboundCallError, RPCError };
