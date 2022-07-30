import OcppClient from './OcppClient';

declare enum OcppMessageType {
  CALL = 2,
  CALLRESULT = 3,
  CALLERROR = 4,
}

declare type OcppMessageId = string;
declare type OcppMessageAction = string;

declare type JSONValue =
  | string
  | number
  | boolean
  | Date
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

declare type OcppMessagePayload = Record<string, JSONValue> | null;

declare type OcppMessage = {
  get type(): OcppMessageType;
  get id(): OcppMessageId;
};

declare type InboundOcppMessage = OcppMessage & {
  get recipient(): OcppClient;
  set recipient(recipient: OcppClient);
};

declare type OutboundOcppMessage = OcppMessage & {
  get sender(): OcppClient;
  get state(): OutboundOcppMessageState;
};

declare enum OutboundOcppMessageState {
  Unsent,
  Sent,
}

declare type RespondableOcppMessage<TResponse extends OutboundOcppMessage> =
  InboundOcppMessage & {
    respond: (response: TResponse) => void;
    get state(): RespondableOcppMessageState;
  };

declare enum RespondableOcppMessageState {
  ResponseUnsent,
  ResponseSent,
}

declare type ResultingOcppMessage<TResponse extends InboundOcppMessage> =
  OutboundOcppMessage & {
    handleResponse: (handler: (response: TResponse) => void) => void;
    get state(): ResultingOcppMessageState;
  };

declare enum ResultingOcppMessageState {
  ResponsePending,
  ResponseReceived,
}

export default OcppMessage;