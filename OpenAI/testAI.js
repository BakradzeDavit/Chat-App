const OpenAI = require("openai");
require("dotenv").config();

// Create client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test function
async function testAI() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello!" }
      ]
    });

    console.log("AI response:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testAI();
