import { InboundOcppCall } from '../../../../common/call';
import { OutboundOcppCallResult } from '../../../../common/callresult';

declare type StatusNotificationRequest = InboundOcppCall<
  'StatusNotification',
  StatusNofificationRequestPayload,
  {},
  StatusNotificationResponse
>;

declare type StatusNotificationResponse = OutboundOcppCallResult<{}>;

declare type StatusNofificationRequestPayload = {
  connectorId: number;
  errorCode: ChargePointErrorCode;
  info?: string;
  status: ChargePointStatus;
  timestamp?: Date;
  vendorId: string;
  vendorErrorCode: string;
};

declare type ChargePointErrorCode = '';

declare type ChargePointStatus = '';

export { StatusNotificationRequest, StatusNotificationResponse };
