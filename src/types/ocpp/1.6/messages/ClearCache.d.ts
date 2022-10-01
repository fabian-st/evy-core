import { OutboundOcppCall } from '../../../../common/call';
import { InboundCallResult } from '../../../../common/callresult';

declare type ClearCacheRequest = OutboundOcppCall<
  'ClearCache',
  null,
  ClearCacheResponsePayload,
  ClearCacheResponse
>;

declare type ClearCacheResponse = InboundCallResult<ClearCacheResponsePayload>;

declare type ClearCacheResponsePayload = {
  status: ClearCacheStatus;
};

declare type ClearCacheStatus = 'Accepted' | 'Rejected';

export { ClearCacheRequest, ClearCacheResponse };
