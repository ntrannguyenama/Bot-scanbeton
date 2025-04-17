import * as path from 'path';
import { config } from 'dotenv';
import * as restify from 'restify';
import { INodeSocket } from 'botframework-streaming';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } from 'botbuilder';
import { EchoBot } from './bot';
import axios from 'axios';

// Charger les variables d'environnement
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Créer un serveur Restify
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Créer l'authentification du bot via le Bot Framework
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Création du bot (EchoBot)
const myBot = new EchoBot();

// Route pour vérifier le webhook (requête GET envoyée par Meta pour valider l'URL)
server.get('/webhook', async (req, res, next) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Vérification du token de vérification
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook vérifié avec succès.');
        res.send(200, challenge);  // Retourner le challenge pour valider le webhook
    } else {
        console.error('Échec de la vérification du webhook.');
        res.send(403, 'Forbidden');  // Si le token ne correspond pas
    }

    next();  // Toujours appeler next() pour signaler que le traitement est terminé
});

// Route pour recevoir les messages du Bot Framework (en provenance de WhatsApp)
server.post('/webhook', async (req, res) => {
    const messageData = req.body;
    console.log('Message reçu de WhatsApp:', messageData);

    // Extraire l'expéditeur et le contenu du message
    const from = messageData.entry[0].changes[0].value.messages[0].from;
    const text = messageData.entry[0].changes[0].value.messages[0].text.body;

    console.log(`Message reçu de ${from}: ${text}`);

    // Traiter le message avec ton bot (en appelant l'adaptateur et le bot)
    const context = {};  // Crée ou récupère le contexte du bot
    await adapter.process(req, res, (context) => myBot.run(context));

    // Répondre à l'utilisateur via WhatsApp avec l'API WhatsApp Business
    sendMessageToWhatsApp(from, "Merci pour votre message !");
    res.send(200, 'OK');  // Retourner un statut 200 (OK) à Meta (WhatsApp)
});

// Fonction pour envoyer un message via WhatsApp Business API
const sendMessageToWhatsApp = async (to: string, text: string) => {
    try {
        const response = await axios.post('https://graph.facebook.com/v14.0/your_phone_number_id/messages', {
            messaging_product: 'whatsapp',
            to: to,
            text: { body: text }
        }, {
            headers: {
                'Authorization': `Bearer YOUR_ACCESS_TOKEN`,  // Utiliser ton access token ici
                'Content-Type': 'application/json'
            }
        });
        console.log('Message envoyé à WhatsApp:', response.data);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message à WhatsApp:', error);
    }
};

// Lancer le serveur Restify
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`Server is listening at ${server.url}`);
});

// WebSocket pour gérer les connexions en streaming
server.on('upgrade', (req, socket, head) => {
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Gestion des erreurs pour le WebSocket
    streamingAdapter.onTurnError = async (context, error) => {
        console.error('Error during turn processing', error);
        await context.sendActivity('Sorry, something went wrong.');
    };

    // Assurez-vous que le socket est du bon type (cast explicite)
    const webSocket = socket as unknown as INodeSocket;  // Cast explicite pour convertir le duplex stream en INodeSocket

    // Utilisation correcte de process pour les connexions WebSocket
    streamingAdapter.process(req, webSocket, head, async (context) => {
        try {
            // Traite la requête avec ton bot
            await myBot.run(context);
        } catch (error) {
            console.error('Error while processing bot turn', error);
            await context.sendActivity('There was an error while processing the message.');
        }
    });
});
