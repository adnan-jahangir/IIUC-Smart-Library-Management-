const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "antigravity-preview-05-2026",
      messages: [{ role: "user", content: "Hello" }]
    });
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error("ERROR", error.status, error.message);
  }
}

test();
