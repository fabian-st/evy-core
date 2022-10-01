import { OutboundOcppCall } from '../../../../common/call';
import { InboundOcppCallResult } from '../../../../common/OcppCallResultMessage';

declare type UnlockConnectorRequest = OutboundOcppCall<
  'UnlockConnector',
  UnlockConnectorRequestPayload,
  UnlockConnectorResponsePayload,
  UnlockConnectorResponse
>;

declare type UnlockConnectorRequestPayload = {
  connectorId: number;
};

declare type UnlockConnectorResponse =
  InboundOcppCallResult<UnlockConnectorResponsePayload>;

declare type UnlockConnectorResponsePayload = {
  status: UnlockStatus;
};

declare type UnlockStatus = 'Unlocked' | 'UnlockFailed' | 'NotSupported';

export { UnlockConnectorRequest, UnlockConnectorResponse };
