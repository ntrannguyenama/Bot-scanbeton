const axios = require('axios');
require('dotenv').config();

async function searchDocuments(embedding) {
  const response = await axios.post(
    `${process.env.AZURE_SEARCH_ENDPOINT}/indexes/${process.env.AZURE_SEARCH_INDEX}/docs/search?api-version=2023-11-01`,
    {
      vectors: [{
        value: embedding,
        fields: 'contentVector',
        k: 5
      }],
      top: 5
    },
    {
      headers: {
        'api-key': process.env.AZURE_SEARCH_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.value.map(doc => ({ content: doc.content }));
}

module.exports = { searchDocuments };
