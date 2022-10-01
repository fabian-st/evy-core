import { InboundOcppCall } from '../../../../common/call';
import { OutboundCallResult } from '../../../../common/callresult';
import IdTagInfo from '../structs/IdTagInfo';

declare type AuthorizeRequest = InboundOcppCall<
  'Authorize',
  AuthorizeRequestPayload,
  AuthorizeResponsePayload,
  AuthorizeResponse
>;

declare type AuthorizeRequestPayload = {
  idTag: string;
};

declare type AuthorizeResponse = OutboundCallResult<AuthorizeResponsePayload>;

declare type AuthorizeResponsePayload = {
  idTagInfo: IdTagInfo;
};

export { AuthorizeRequest, AuthorizeResponse };
