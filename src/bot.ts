import { ActivityHandler, TurnContext } from 'botbuilder';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export class EchoBot extends ActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context: TurnContext, next) => {
            const userMessage = context.activity.text;
            console.log(">>> Message reçu :", userMessage);

            const response = await this.callOpenAI(userMessage);
            console.log(">>> Réponse envoyée :", response);

            await context.sendActivity(response);
            await next();
        });
    }

    private async callOpenAI(message: string): Promise<string> {
        try {
            const response = await axios.post(
                `https://scanbetoneastu8388355606.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`,
                {
                    messages: [{ role: 'user', content: message }],
                    temperature: 0.7,
                    max_tokens: 800
                },
                {
                    headers: {
                        'api-key': '5bWmVdpowrfG8bD57LXV7AZaWfXJn3z9WpxgsSn4qbwHFA4VuoiZJQQJ99BDACYeBjFXJ3w3AAAAACOGTK9z',
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content.trim();
        } catch (err: any) {
            console.error('❌ Erreur Azure OpenAI :', err?.response?.data || err.message);
            return "Désolé, je n'ai pas pu interroger Azure OpenAI.";
        }
    }
}
