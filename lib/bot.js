"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoBot = void 0;
const botbuilder_1 = require("botbuilder");
const axios_1 = require("axios");
const dotenv = require("dotenv");
dotenv.config();
// 🔐 Azure Cognitive Search
const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const SEARCH_API_KEY = process.env.AZURE_SEARCH_API_KEY;
const SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX;
// 🤖 Azure OpenAI via Foundry (GPT-4)
const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;
const OPENAI_CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT_NAME;
// 🔍 Recherche dynamique dans Azure Cognitive Search
async function searchCognitiveIndex(query, topK = 3) {
    const url = `${SEARCH_ENDPOINT}/indexes/${SEARCH_INDEX}/docs/search?api-version=2023-07-01-Preview`;
    const response = await axios_1.default.post(url, { search: query, top: topK }, {
        headers: {
            'Content-Type': 'application/json',
            'api-key': SEARCH_API_KEY
        }
    });
    const docs = response.data.value;
    return docs.map((doc) => doc.content || '');
}
// 💬 Appel Azure OpenAI GPT-4 (via Foundry) en mode souple
async function generateResponse(question, contextChunks) {
    const url = `https://scanbeton-api.openai.azure.com/openai/deployments/scanbeton-gpt-35-turbo/chat/completions?api-version=2025-01-01-preview`;
    const systemPrompt = `Tu es un assistant intelligent. Si le contexte ci-dessous est utile, utilise-le pour répondre. 
Sinon, réponds normalement à la question avec tes connaissances générales.`;
    const messages = contextChunks.length > 0
        ? [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextChunks.join('\n\n') },
            { role: 'user', content: question }
        ]
        : [
            { role: 'system', content: 'Tu es un assistant utile. Réponds clairement à la question de l’utilisateur.' },
            { role: 'user', content: question }
        ];
    const response = await axios_1.default.post(url, {
        messages,
        temperature: 0.7,
        max_tokens: 500
    }, {
        headers: {
            'Content-Type': 'application/json',
            'api-key': OPENAI_API_KEY
        }
    });
    return response.data.choices[0].message.content.trim();
}
// 🤖 Ton bot RAG dynamique + fallback GPT-4 libre
class EchoBot extends botbuilder_1.ActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            var _a;
            const question = context.activity.text;
            console.log("📩 Question reçue :", question);
            try {
                const contextChunks = await searchCognitiveIndex(question, 3);
                const response = await generateResponse(question, contextChunks);
                await context.sendActivity(response);
            }
            catch (err) {
                console.error("❌ Erreur :", ((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
                await context.sendActivity("Une erreur est survenue lors de l'appel à l'IA.");
            }
            await next();
        });
    }
}
exports.EchoBot = EchoBot;
//# sourceMappingURL=bot.js.map