import {
  AuthenticationHandler,
  AuthenticationRequest,
} from '../../src/common/handler';

class AuthenticationHandler extends AuthenticationHandler {
  async handle(request: AuthenticationRequest) {
    request.accept();
    return await super.handle(request);
  }
}

export default AuthenticationHandler;
