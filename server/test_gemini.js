require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = process.env.GEMINI_API_KEY || 'AIzaSyAqByCR2EEoDFWC2KBbTFG-NC5plAUBLlk';
  console.log('Testing with key:', key);
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Hi');
    console.log('Success:', result.response.text());
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
