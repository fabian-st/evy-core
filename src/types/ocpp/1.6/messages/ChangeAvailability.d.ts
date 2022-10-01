import { OutboundOcppCall } from '../../../../common/call';
import { InboundOcppCallResult } from '../../../../common/callresult';

declare type ChangeAvailabilityRequest = OutboundOcppCall<
  'ChangeAvailability',
  ChangeAvailabilityRequestPayload,
  ChangeAvailabilityResponsePayload,
  ChangeAvailabilityResponse
>;

declare type ChangeAvailabilityRequestPayload = {
  connectorId: number;
  type: AvailabilityType;
};

declare type AvailabilityType = 'Inoperative' | 'Operative';

declare type ChangeAvailabilityResponse =
  InboundOcppCallResult<ChangeAvailabilityResponsePayload>;

declare type ChangeAvailabilityResponsePayload = {
  status: AvailabilityStatus;
};

declare type AvailabilityStatus = 'Accepted' | 'Rejected';

export { ChangeAvailabilityRequest, ChangeAvailabilityResponse };
