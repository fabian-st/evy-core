import { InboundMessageHandler, OutboundMessageHandler } from '../handler';
import { OcppSessionService } from '../session';
import { InboundOcppMessage, OutboundMessage } from '../message';
import { InboundOcppCall, OutboundOcppCall } from '../call';

class InboundPendingMessageHandler extends InboundMessageHandler {
  private sessionService;

  constructor(sessionService: OcppSessionService) {
    super();
    this.sessionService = sessionService;
    this.sessionService.create();
  }

  async handle(message: InboundOcppMessage) {
    const session = await this.sessionService.get(message.sender.id);

    if (
      !(message instanceof InboundOcppCall) &&
      session.pendingOutboundMessage &&
      message.id === session.pendingOutboundMessage.id
    ) {
      session.pendingOutboundMessage = null;
      await this.sessionService.update(session.client.id, session);
    }

    if (message instanceof InboundOcppCall && !session.pendingInboundMessage) {
      session.pendingInboundMessage = message;
      await this.sessionService.update(session.client.id, session);
    }

    return await super.handle(message);
  }
}

class OutboundPendingMessageHandler extends OutboundMessageHandler {
  private sessionService;

  constructor(sessionService: OcppSessionService) {
    super();
    this.sessionService = sessionService;
    this.sessionService.create();
  }

  async handle(message: OutboundMessage) {
    const session = await this.sessionService.get(message.recipient.id);

    if (
      !(message instanceof OutboundOcppCall) &&
      session.pendingInboundMessage &&
      message.id === session.pendingInboundMessage.id
    ) {
      session.pendingInboundMessage = null;
      await this.sessionService.update(session.client.id, session);
    }

    if (
      message instanceof OutboundOcppCall &&
      !session.pendingOutboundMessage
    ) {
      session.pendingOutboundMessage = message;
      await this.sessionService.update(session.client.id, session);
    }

    return await super.handle(message);
  }
}

export { InboundPendingMessageHandler, OutboundPendingMessageHandler };
