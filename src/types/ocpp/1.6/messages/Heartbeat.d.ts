import { InboundOcppCall } from '../../../../common/call';
import { OutboundCallResult } from '../../../../common/callresult';

declare type HeartbeatRequest = InboundOcppCall<
  'Heartbeat',
  {},
  HeartbeatResponsePayload,
  HeartbeatResponse
>;

declare type HeartbeatResponse = OutboundCallResult<HeartbeatResponsePayload>;

declare type HeartbeatResponsePayload = {
  currentTime: Date;
};

export { HeartbeatRequest, HeartbeatResponse };
