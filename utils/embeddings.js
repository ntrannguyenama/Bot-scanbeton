const axios = require('axios');
require('dotenv').config();

async function getEmbedding(text) {
  const response = await axios.post(
    `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_EMBEDDING_DEPLOYMENT}/embeddings?api-version=2023-03-15-preview`,
    { input: text },
    {
      headers: {
        'api-key': process.env.AZURE_OPENAI_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data[0].embedding;
}

module.exports = { getEmbedding };
