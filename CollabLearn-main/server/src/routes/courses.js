const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth'); // Optional: if we want to protect routes

// GET /api/courses - Get all courses (optionally filter by category)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query.category = category;
        }

        const courses = await Course.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: courses.length, courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET /api/courses/:id - Get single course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, course });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// POST /api/courses/seed - Seed database with curriculum data
// Note: In production, you'd protect this route or run it via script
router.post('/seed', async (req, res) => {
    try {
        await Course.deleteMany({}); // Clear existing courses

        const seedData = [
            // Category A: Visual Design
            {
                title: "Graphic Design Bootcamp",
                instructor: "Sarah Art",
                description: "Mastery of color theory and typography.",
                category: "Visual Design",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1626785774573-4b799314346d?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Canva for Beginners",
                instructor: "Emily Draft",
                description: "Creating social media assets quickly.",
                category: "Visual Design",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Logo Design: From Sketch to Vector",
                instructor: "Mark Brand",
                description: "Learn professional logo design workflows.",
                category: "Visual Design",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "UI/UX Basics",
                instructor: "Alex Interface",
                description: "Designing your first mobile app interface.",
                category: "Visual Design",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Photo Editing Masterclass",
                instructor: "Jessica Lens",
                description: "Adobe Lightroom presets and tweaks.",
                category: "Visual Design",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1554048612-387768052bf7?w=800&auto=format&fit=crop&q=60"
            },

            // Category B: Content Creation
            {
                title: "Video Editing 101",
                instructor: "Mike Cut",
                description: "CapCut and Premiere Pro basics.",
                category: "Content Creation",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1574717432707-c1d42a225381?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "YouTube Strategy",
                instructor: "David Tube",
                description: "Thumbnails, titles, and SEO.",
                category: "Content Creation",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Copywriting That Converts",
                instructor: "Lisa Pen",
                description: "Writing headlines that convert.",
                category: "Content Creation",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Podcasting for Beginners",
                instructor: "Sam Voice",
                description: "Setup, recording, and distribution.",
                category: "Content Creation",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Short-Form Video Mastery",
                instructor: "Chloe Reel",
                description: "Mastering TikTok and Reels.",
                category: "Content Creation",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&auto=format&fit=crop&q=60"
            },

            // Category C: Productivity
            {
                title: "Notion Mastery",
                instructor: "Productive Pete",
                description: "Organizing your life and work.",
                category: "Productivity",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Time Management",
                instructor: "Tim Ferris-ish",
                description: "The Pomodoro technique and deep work.",
                category: "Productivity",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Remote Work Setup",
                instructor: "Home Office Hero",
                description: "Setting up a home office.",
                category: "Productivity",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Public Speaking",
                instructor: "Speaker Steve",
                description: "Overcoming stage fright.",
                category: "Productivity",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1475721027767-p742627fea3d?w=800&auto=format&fit=crop&q=60"
            },
            {
                title: "Personal Finance",
                instructor: "Money Mike",
                description: "Budgeting for freelancers.",
                category: "Productivity",
                videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                thumbnailUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60"
            }
        ];

        await Course.insertMany(seedData);
        res.json({ success: true, message: 'Database seeded with 15 courses!', count: seedData.length });
    } catch (error) {
        console.error('Error seeding courses:', error);
        res.status(500).json({ success: false, message: 'Server Error during seed' });
    }
});

module.exports = router;
