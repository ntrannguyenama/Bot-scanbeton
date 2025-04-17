import * as path from 'path';
import { config } from 'dotenv';
import * as restify from 'restify';
import axios from 'axios';

// Charger les variables d'environnement
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Créer un serveur Restify
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nBot is ready to send WhatsApp messages!');
});

// Route pour vérifier le webhook (requête GET envoyée par Meta pour valider l'URL)
server.get('/webhook', async (req, res, next) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Vérification du token de vérification
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook vérifié avec succès.');
        res.send(challenge);  // Retourner le challenge pour valider le webhook
    } else {
        console.error('Échec de la vérification du webhook.');
        res.send(403, 'Forbidden');  // Si le token ne correspond pas
    }

    next();  // Toujours appeler next() pour signaler que le traitement est terminé
});

// Fonction pour envoyer un message via WhatsApp Business API
const sendMessageToWhatsApp = async (to: string, text: string) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v14.0/${process.env.WHATSAPP_PHONE_ID}/messages`, 
            {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Message envoyé à WhatsApp:', response.data);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message à WhatsApp:', error);
    }
};

// Exemple d'envoi de message (à tester selon ton besoin)
sendMessageToWhatsApp('<RECIPIENT_PHONE_NUMBER>', 'Hello from your bot!');

