"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoBot = void 0;
const botbuilder_1 = require("botbuilder");
class EchoBot extends botbuilder_1.ActivityHandler {
    constructor() {
        super();
        // Événement quand un message est reçu
        this.onMessage(async (context, next) => {
            const userMessage = context.activity.text;
            await context.sendActivity(`Tu as dit : "${userMessage}"`);
            await next();
        });
        // Événement quand un nouveau membre rejoint la conversation
        this.onMembersAdded(async (context, next) => {
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
exports.EchoBot = EchoBot;
//# sourceMappingURL=bot.js.map