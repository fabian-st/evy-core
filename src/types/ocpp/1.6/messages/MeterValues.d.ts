import { InboundOcppCall } from '../../../../common/call';
import { OutboundCallResult } from '../../../../common/callresult';
import MeterValue from '../structs/MeterValue';

declare type MeterValuesRequest = InboundOcppCall<
  'MeterValues',
  MeterValuesRequestPayload,
  {},
  MeterValuesResponse
>;

declare type MeterValuesResponse = OutboundCallResult<{}>;

declare type MeterValuesRequestPayload = {
  connectorId: number;
  transactionId?: number;
  meterValues: MeterValue[];
};

export { MeterValuesRequest, MeterValuesResponse };
