import { Logger } from 'ts-log';
import { oneLine } from 'common-tags';

import { OcppEndpointConfig } from '../endpoint';
import OcppMessageType from '../../types/ocpp/message-type';
import { InboundMessage, OutboundMessage } from '../message';
import { InboundOcppCall, OutboundOcppCall } from '../call';
import { OutboundOcppCallError } from '../callerror';
import { InboundMessageHandler, OutboundMessageHandler } from '../handler';

class InboundActionsAllowedHandler extends InboundMessageHandler {
  private config: OcppEndpointConfig;
  private logger: Logger;

  constructor(config: OcppEndpointConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async handle(message: InboundMessage) {
    if (
      message instanceof InboundOcppCall &&
      !this.config.actionsAllowed.includes(message.action)
    ) {
      this.logger.warn(
        oneLine`Received ${OcppMessageType[message.type]}
        message with unsupported action: ${message.action}`
      );

      throw new OutboundOcppCallError(
        message.sender,
        message.id,
        'NotImplemented',
        'Action is not supported'
      );
    }

    return await super.handle(message);
  }
}

class OutboundActionsAllowedHandler extends OutboundMessageHandler {
  private config: OcppEndpointConfig;
  private logger: Logger;

  constructor(config: OcppEndpointConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async handle(message: OutboundMessage) {
    if (
      message instanceof OutboundOcppCall &&
      !this.config.actionsAllowed.includes(message.action)
    ) {
      this.logger.warn(
        oneLine`Attempted to send ${OcppMessageType[message.type]}
        message with unsupported action: ${message.action}`
      );
      return;
    }

    return await super.handle(message);
  }
}

export { InboundActionsAllowedHandler, OutboundActionsAllowedHandler };