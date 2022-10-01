import {
  AuthenticationHandler,
  OcppAuthenticationRequest,
} from '../../src/common/handler';

class AuthenticationHandler extends AuthenticationHandler {
  async handle(request: OcppAuthenticationRequest) {
    request.accept();
    return await super.handle(request);
  }
}

export default AuthenticationHandler;
