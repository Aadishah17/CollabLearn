require('dotenv').config();
const { OpenAI } = require('openai');

async function testNVIDIA() {
  console.log("Testing NVIDIA AI Integration...");
  const apiKey = process.env.NVIDIA_API_KEY;
  const modelName = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';
  
  if (!apiKey || apiKey.includes('your_nvidia')) {
    console.error("No valid NVIDIA_API_KEY found in .env");
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    console.log(`Sending ping to ${modelName}...`);
    
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [{"role":"user","content":"Say 'NVIDIA is connected to CollabLearn'"}],
      temperature: 0.2,
      max_tokens: 50,
    });

    console.log("Response received:");
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("NVIDIA Test Failed:", err.message);
  }
}

testNVIDIA();
