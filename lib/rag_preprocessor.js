"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const dossierFichiers = path.join(__dirname, 'rag-data');
const fichiers = ['liste_1.txt', 'liste_2.txt', 'liste_3.txt'];
// ⏱️ Délai pour éviter les erreurs 429
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// 📥 Lire les fichiers .txt ligne par ligne
function lireFichiers() {
    let chunks = [];
    fichiers.forEach((nomFichier) => {
        const chemin = path.join(dossierFichiers, nomFichier);
        const contenu = fs.readFileSync(chemin, 'utf-8');
        const lignes = contenu.split('\n').filter((l) => l.trim() !== '');
        chunks = chunks.concat(lignes);
    });
    return chunks;
}
// 🔌 Appel Azure OpenAI embeddings avec diagnostics
async function getEmbedding(texte) {
    var _a;
    if (!texte || typeof texte !== 'string' || texte.trim() === '') {
        console.warn(`⚠️ Chunk ignoré (texte invalide) :`, texte);
        return [];
    }
    const url = `https://scanbetoneastu8388355606.openai.azure.com/openai/deployments/text-embedding-ada-002/embeddings?api-version=2023-05-15`;
    try {
        console.log(`📤 Envoi à Azure : "${texte}"`);
        console.log(`📎 Type de texte :`, typeof texte);
        console.log(`📎 Payload JSON :`, JSON.stringify({ input: texte }));
        const response = await axios_1.default.post(url, { input: texte }, // ou essaye { input: [texte] } si besoin
        {
            headers: {
                'api-key': '5bWmVdpowrfG8bD57LXV7AZaWfXJn3z9WpxgsSn4qbwHFA4VuoiZJQQJ99BDACYeBjFXJ3w3AAAAACOGTK9z',
                'Content-Type': 'application/json',
            },
        });
        const vector = response.data.data[0].embedding;
        console.log(`✅ Embedding reçu (${vector.length} dimensions)`);
        return vector;
    }
    catch (err) {
        console.error(`❌ Erreur embedding pour : "${texte}"`);
        console.error(((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
        return [];
    }
}
// 🚀 Script principal
async function main() {
    const lignes = lireFichiers();
    const chunks = lignes.map((texte, index) => ({
        id: `chunk_${index}`,
        texte,
        source: 'fichiers_txt'
    }));
    console.log(`📄 ${chunks.length} chunks à vectoriser.`);
    for (const chunk of chunks) {
        chunk.embedding = await getEmbedding(chunk.texte);
        await delay(2000); // attendre 2 secondes
    }
    const outputPath = path.join(__dirname, 'embeddings.json');
    fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2), 'utf-8');
    console.log(`✅ Embeddings sauvegardés dans : ${outputPath}`);
}
main();
//# sourceMappingURL=rag_preprocessor.js.map