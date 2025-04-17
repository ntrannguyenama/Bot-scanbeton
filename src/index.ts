import * as restify from 'restify';
import { config } from 'dotenv';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } from 'botbuilder';
import { EchoBot } from './bot';
import axios from 'axios';

config({ path: './.env' });  // Charger les variables d'environnement

// Créer le serveur Restify
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Route pour vérifier le webhook
server.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Vérification du token de Meta
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook vérifié avec succès.');
        res.send(challenge); // Retourne le challenge pour valider le webhook
    } else {
        console.error('Échec de la vérification du webhook.');
        res.send(403, 'Forbidden');  // Si le token ne correspond pas
    }
});

// Configuration de l'adaptateur Bot Framework
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
});
const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Création du bot (EchoBot)
const myBot = new EchoBot();

// Route pour recevoir les messages du Bot Framework
server.post('/api/messages', async (req, res) => {
    await adapter.process(req, res, (context) => myBot.run(context));
});

// WebSocket pour gérer les connexions en streaming
server.on('upgrade', async (req, socket, head) => {
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);
    await streamingAdapter.process(req, socket as any, head, (context) => myBot.run(context));
});

// Lancer le serveur sur le port spécifié
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`Server is listening at ${server.url}`);
});
