import { ActivityHandler, TurnContext } from 'botbuilder';

export class EchoBot extends ActivityHandler {
  constructor() {
    super();

    // Événement quand un message est reçu
    this.onMessage(async (context: TurnContext, next) => {
      const userMessage = context.activity.text;
      await context.sendActivity(`Tu as dit : "${userMessage}"`);
      await next();
    });

    // Événement quand un nouveau membre rejoint la conversation
    this.onMembersAdded(async (context: TurnContext, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded || []) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity("Bonjour ! Je suis un chatbot RAG. Pose-moi une question !");
        }
      }
      await next();
    });
  }
}
