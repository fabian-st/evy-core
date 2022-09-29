import { InboundOcppCall } from '../../../../common/OcppCallMessage';
import { OutboundOcppCallResult } from '../../../../common/OcppCallResultMessage';

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
