require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("No API key found in .env");
    process.exit(1);
  }
  console.log("Found key ending in:", key.substring(key.length - 4));
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log("Sending Hi...");
    const res = await model.generateContent('Hi');
    console.log("Success! Response:", res.response.text());
    process.exit(0);
  } catch (err) {
    console.log("Error:", err.message);
    process.exit(1);
  }
}

test();
