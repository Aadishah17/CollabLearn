require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function test() {
  const key = process.env.GEMINI_API_KEY || 'AIzaSyAqByCR2EEoDFWC2KBbTFG-NC5plAUBLlk';
  let out = 'Testing with key: ' + key + '\n';
  try {
    const genAI = new GoogleGenerativeAI(key);
    
    out += 'Testing gemini-1.5-flash\n';
    const model15 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    try {
      const res1 = await model15.generateContent('Hi');
      out += '1.5 success: ' + res1.response.text() + '\n';
    } catch(e) {
      out += '1.5 error: ' + e.message + '\n';
    }
    
    out += '\nTesting gemini-2.0-flash\n';
    const model20 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    try {
      const res2 = await model20.generateContent('Hi');
      out += '2.0 success: ' + res2.response.text() + '\n';
    } catch(e) {
      out += '2.0 error: ' + e.message + '\n';
    }
    
    out += '\nTesting gemini-pro\n';
    const modelPro = genAI.getGenerativeModel({ model: 'gemini-pro' });
    try {
      const res3 = await modelPro.generateContent('Hi');
      out += 'pro success: ' + res3.response.text() + '\n';
    } catch(e) {
      out += 'pro error: ' + e.message + '\n';
    }

  } catch (error) {
    out += 'Core Error: ' + error.message + '\n';
  }
  fs.writeFileSync('test_out.txt', out);
}

test();
