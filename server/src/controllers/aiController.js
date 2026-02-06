const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper to get initialized client
const getGenAI = () => {
    const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
    if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
        return null;
    }
    return new GoogleGenerativeAI(key);
};

const chat = async (req, res) => {
    try {
        const { message } = req.body;
        const genAI = getGenAI();

        if (!genAI) {
            console.log("DEBUG: API Key missing in chat handler");
            return res.json({
                success: true,
                response: "⚠️ API Key Missing: Please add your GEMINI_API_KEY to the server/.env file to enable real AI features."
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `You are an expert educational assistant for a skill-learning platform called CollabLearn. 
        User asks: "${message}". 
        Provide a helpful, encouraging, and concise answer about learning this skill. Keep it under 100 words.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({
            success: true,
            response: text
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(500).json({ success: false, message: 'AI Service Error: ' + error.message });
    }
};

const generateRoadmap = async (req, res) => {
    try {
        const { skill } = req.body;
        const genAI = getGenAI();

        if (!genAI) {
            console.log("DEBUG: API Key missing in generateRoadmap handler");
            return res.json({
                success: true,
                roadmap: {
                    steps: [
                        { title: "Configuration Required", description: "Please add GEMINI_API_KEY to server/.env" },
                        { title: "Restart Server", description: "Restart the backend to load the new key" },
                        { title: "Enjoy AI", description: "Generate real custom roadmaps for any skill!" }
                    ],
                    resources: [
                        { type: "Video", title: "How to get Gemini API Key", url: "https://ai.google.dev/" },
                        { type: "Article", title: "CollabLearn Setup Guide", url: "https://github.com/collablearn" }
                    ]
                }
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Generate a detailed learning roadmap for "${skill}" in JSON format.
        The structure MUST be:
        {
          "steps": [
            {"title": "Step Title", "description": "Brief description", "duration": "Estimated time"},
            ...
          ],
          "resources": [
            {"type": "Video", "title": "Resource Title", "url": "URL or Search Term"},
            {"type": "Article", "title": "Resource Title", "url": "URL"},
            {"type": "Course", "title": "Resource Title", "url": "URL"}
          ]
        }
        Provide at least 5 steps and 3 high-quality study resources (official docs, popular courses, or tutorials).
        Return ONLY valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if Gemini includes it
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const roadmap = JSON.parse(text);

        res.json({
            success: true,
            roadmap: roadmap
        });

    } catch (error) {
        console.error('AI Roadmap error:', error);
        // Fallback for parsing errors or API limits
        res.status(500).json({ success: false, message: 'Failed to generate roadmap. ' + error.message });
    }
};

module.exports = {
    chat,
    generateRoadmap
};
