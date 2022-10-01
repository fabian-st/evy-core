import { OutboundOcppCall } from '../../../../common/call';
import { InboundCallResult } from '../../../../common/callresult';

declare type ResetRequest = OutboundOcppCall<
  'Reset',
  ResetRequestPayload,
  ResetResponsePayload,
  ResetResponse
>;

declare type ResetRequestPayload = {
  type: ResetType;
};

declare type ResetType = 'Hard' | 'Soft';

declare type ResetResponse = InboundCallResult<ResetResponsePayload>;

declare type ResetResponsePayload = {
  status: ResetStatus;
};

declare type ResetStatus = 'Accepted' | 'Rejected';

export { ResetRequest, ResetResponse };
