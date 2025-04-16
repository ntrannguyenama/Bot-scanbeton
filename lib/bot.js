"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoBot = void 0;
const botbuilder_1 = require("botbuilder");
const axios_1 = require("axios");
const dotenv = require("dotenv");
dotenv.config();
class EchoBot extends botbuilder_1.ActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            const userMessage = context.activity.text;
            console.log(">>> Message reçu :", userMessage);
            const response = await this.callOpenAI(userMessage);
            console.log(">>> Réponse envoyée :", response);
            await context.sendActivity(response);
            await next();
        });
    }
    async callOpenAI(message) {
        var _a;
        try {
            const response = await axios_1.default.post(`https://scanbetoneastu8388355606.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`, {
                messages: [{ role: 'user', content: message }],
                temperature: 0.7,
                max_tokens: 800
            }, {
                headers: {
                    'api-key': '5bWmVdpowrfG8bD57LXV7AZaWfXJn3z9WpxgsSn4qbwHFA4VuoiZJQQJ99BDACYeBjFXJ3w3AAAAACOGTK9z',
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (err) {
            console.error('❌ Erreur Azure OpenAI :', ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
            return "Désolé, je n'ai pas pu interroger Azure OpenAI.";
        }
    }
}
exports.EchoBot = EchoBot;
//# sourceMappingURL=bot.js.map