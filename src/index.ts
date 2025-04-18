import * as path from 'path';

import { config } from 'dotenv';
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

import * as restify from 'restify';

import { INodeSocket } from 'botframework-streaming';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    createBotFrameworkAuthenticationFromConfiguration
} from 'botbuilder';

// This bot's main dialog.
import { EchoBot } from './bot';


// Create HTTP server.
const server = restify.createServer();

server.use(restify.plugins.queryParser());

console.log('v8')
server.get('/webhook', (req, res, next) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    console.log('📩 Requête webhook reçue :', { mode, token, challenge });

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook WhatsApp vérifié avec succès.');
        res.send(200, parseInt(challenge));
    } else {
        console.error('❌ Échec de la vérification du webhook WhatsApp.');
        res.send(403, 'Forbidden');
    }

    return next();
});

server.post('/webhook', (req, res, next) => {
    try {
      const body = req.body;
      console.log('Webhook reçu:', JSON.stringify(body, null, 2));
   
      if (
        body.object === 'whatsapp_business_account' &&
        Array.isArray(body.entry) &&
        body.entry.length > 0
      ) {
        for (const entry of body.entry) {
          if (Array.isArray(entry.changes) && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.field === 'messages') {
                const messages = change.value?.messages || [];
                for (const message of messages) {
                  const enhancedMessage = {
                    ...message,
                    phone_number_id: change?.value?.metadata?.phone_number_id,
                  };
   
                  if (message.type === 'text') {
                    console.log('whatsapp.text', enhancedMessage);
                  } else if (message.type === 'order') {
                    console.log('whatsapp.order', enhancedMessage);
                  } else if (
                    message.type === 'interactive' &&
                    enhancedMessage.interactive?.type === 'button_reply'
                  ) {
                    console.log('whatsapp.reply', enhancedMessage);
                  }
                }
              }
   
              if (change.field === 'statuses') {
                const statuses = change.value?.statuses || [];
                for (const status of statuses) {
                  console.log('Statut reçu:', status);
                  // Ajoute ici ta logique pour les statuts
                }
              }
            }
          }
        }
      }
   
      res.send(200); // Toujours répondre 200 sinon WhatsApp renvoie l’événement
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error.message);
      res.send(500, 'Erreur interne');
    }
   
    return next();
  });

server.use(restify.plugins.bodyParser());


const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create the main dialog.
const myBot = new EchoBot();

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => myBot.run(context));
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => myBot.run(context));
});


server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});