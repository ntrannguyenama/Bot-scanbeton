"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const dotenv_1 = require("dotenv");
const ENV_FILE = path.join(__dirname, '..', '.env');
(0, dotenv_1.config)({ path: ENV_FILE });
const restify = require("restify");
// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const botbuilder_1 = require("botbuilder");
// This bot's main dialog.
const bot_1 = require("./bot");
// Create HTTP server.
const server = restify.createServer();
server.get('/', (req, res, next) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook WhatsApp vérifié avec succès.');
        res.send(200, challenge);
    }
    else {
        console.error('❌ Échec de la vérification du webhook WhatsApp.');
        res.send(403, 'Forbidden');
    }
    return next();
});
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});
const credentialsFactory = new botbuilder_1.ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});
const botFrameworkAuthentication = (0, botbuilder_1.createBotFrameworkAuthenticationFromConfiguration)(null, credentialsFactory);
// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};
// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;
// Create the main dialog.
const myBot = new bot_1.EchoBot();
// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => myBot.run(context));
});
// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new botbuilder_1.CloudAdapter(botFrameworkAuthentication);
    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;
    await streamingAdapter.process(req, socket, head, (context) => myBot.run(context));
});
//# sourceMappingURL=index.js.map