async function testBackendEndToEnd() {
    try {
        console.log("1. Registering a test user...");
        const email = `testuser_${Date.now()}@example.com`;
        const registerRes = await fetch('http://localhost:5001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test User API",
                email: email,
                password: "password123"
            })
        });
        
        const registerData = await registerRes.json();
        if (!registerRes.ok) {
            throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
        }
        
        const token = registerData.token;
        console.log(`User created. Access Token acquired: ${token.substring(0, 15)}...`);
        
        console.log("\n2. Requesting AI Roadmap Generation (NVIDIA NIM via aiController)...");
        const roadmapRes = await fetch('http://localhost:5001/api/ai/roadmap', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                skill: "Test Driven Development in Node",
                learnerLevel: "Intermediate",
                weeklyHours: 5,
                targetWeeks: 4,
                focusAreas: ["Jest", "Supertest"]
            })
        });
        
        const roadmapData = await roadmapRes.json();
        if (!roadmapRes.ok) {
            throw new Error(`Roadmap Generation failed: ${JSON.stringify(roadmapData)}`);
        }
        
        console.log("\nSUCCESS! Received AI Roadmap from provider:", roadmapData.provider || roadmapData.source);
        if (roadmapData.model) {
            console.log("Model:", roadmapData.model);
        }
        console.log("Number of generated chunks/phases:", roadmapData.roadmap?.length);
        console.log("\nPreview of Phase 1:");
        console.log(JSON.stringify(roadmapData, null, 2));
        
    } catch (err) {
        console.error("\nTEST PIPELINE ERROR:");
        console.error(err.message);
    }
}

testBackendEndToEnd();
