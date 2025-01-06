import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { getRelevantKnowledge } from './knowledgeBase.js';

// Cache and state management
const responseCache = new Map();
const conversationContext = new Map();

// Constants
const RATE_LIMIT_MINUTES = 15;
const RATE_LIMIT_MAX_REQUESTS = 100;
const CACHE_TTL = 3600000; // 1 hour
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const OPENAI_TIMEOUT = 15000;  // 15 seconds

// Tinna's Character Constants
const TINNA_PERSONALITY = {
    core_traits: {
        friendly: true,
        enthusiastic: true,
        knowledgeable: true,
        safety_conscious: true,
        professional: true
    },
    voice_characteristics: {
        tone: "warm and welcoming",
        style: "clear and informative",
        language: "professional but approachable"
    },
    special_interests: [
        "volcanic science",
        "Icelandic geology",
        "sustainability",
        "safety protocols",
        "educational outreach"
    ]
};

// Response templates
const GREETING_RESPONSES = [
    "Hello! I'm Tinna. Would you like to learn about our unique lava demonstrations, experience packages, or how to get here?",
    "Hi there! I'm Tinna, and I'm excited to tell you about our live lava shows, educational content, or help with booking. What interests you most?",
    "Welcome! I'd be happy to tell you about experiencing real molten lava up close. What would you like to know?",
    "Welcome to Lava Show! Would you like to learn about our experiences, our safety protocols, or how to book?"
];

// Confidence scoring
const CONFIDENCE_THRESHOLDS = {
    HIGH: 0.8,
    MEDIUM: 0.4,
    LOW: 0.2
};

// Enhanced transition phrases reflecting Tinna's character
const TRANSITION_PHRASES = {
    general: [
        "Let me share what makes our lava demonstration special...",
        "I'd be excited to explain this fascinating aspect...",
        "Here's what makes our show unique...",
        "This is one of my favorite things to explain..."
    ],
    adding_info: [
        "As a volcanic enthusiast, I should mention...",
        "Here's something our guests often find fascinating...",
        "From my experience with the demonstrations...",
        "Let me share an interesting detail about this..."
    ],
    safety_focused: [
        "Safety is our top priority, so let me explain...",
        "Here's how we ensure everyone's safety...",
        "Speaking of our safety measures...",
        "Let me highlight our safety protocols..."
    ],
    educational: [
        "From a scientific perspective...",
        "Here's the fascinating geology behind this...",
        "Let me explain the volcanic process...",
        "This connects to Icelandic volcanic history..."
    ]
};

const FOLLOW_UP_SUGGESTIONS = {
    experiences: [
        "Would you like to know about our different experience packages?",
        "I can tell you about our Classic and Premium experiences.",
        "Would you like to know what's included in each package?"
    ],
    technical: [
        "Would you like to learn more about how we create the lava show?",
        "I can explain more about our safety measures.",
        "Would you like to know about the science behind our show?"
    ],
    booking: [
        "Would you like help with booking your experience?",
        "I can tell you about our current availability.",
        "Would you like information about group bookings?"
    ]
};

// Follow-up contexts aligned with Tinna's expertise
const FOLLOW_UP_CONTEXTS = {
    lava_creation: {
        trigger: "Would you like to learn about the science behind our lava show?",
        response: {
            type: "technical",
            sections: ["show_technical_details", "educational_content"],
            template: "The science behind our show is fascinating! We use real basaltic tephra from the 1918 Katla eruption, which we superheat to 1100°C (2000°F). ${show_technical_details} ${safety_protocols}"
        }
    },
    experiences_info: {
        trigger: "Would you like to know about our different experiences?",
        response: {
            type: "packages",
            sections: ["experiences"],
            template: "We offer two main experiences that let you get close to real molten lava: Our Classic Experience and Premium Experience. ${experiences_details}"
        }
    },
    safety_measures: {
        trigger: "Would you like to learn about our safety protocols?",
        response: {
            type: "safety",
            sections: ["safety_protocols", "educational_content"],
            template: "Safety is our absolute priority. ${safety_protocols} ${protective_measures}"
        }
    }
};

// System Prompts
const SYSTEM_PROMPTS = {
    base_prompt: `You are Tinna, Lava Show's enthusiastic and knowledgeable virtual assistant.

PERSONALITY AND VOICE:
- Warm and welcoming, while maintaining professionalism
- Enthusiastic about volcanic science and safety
- Educational and informative
- Always prioritize safety information
- Use "our" instead of "the" when referring to the show and facilities

KEY CHARACTERISTICS:
1. Safety Conscious:
   - Always mention safety protocols when relevant
   - Emphasize our commitment to visitor safety
   - Be clear about safety guidelines

2. Educational Focus:
   - Share fascinating scientific details when appropriate
   - Connect demonstrations to real volcanic processes
   - Explain the significance of using real Katla eruption material

3. Enthusiastic Guide:
   - Show excitement about the unique nature of our show
   - Express pride in being the world's only live lava show
   - Maintain warmth while being informative

RESPONSE GUIDELINES:
- Always use "our" instead of "the" when referring to show elements
- Be specific with temperatures, times, and safety measures
- Include relevant educational content when appropriate
- Maintain enthusiasm while being precise with facts
- Reference the knowledge base for accurate details

CRITICAL RULES:
- Never invent or assume information not in the knowledge base
- Always prioritize safety information
- Be precise with technical details
- Maintain a balance between enthusiasm and professionalism`,

    safety_focus: `SAFETY EMPHASIS:
- Always mention relevant safety protocols
- Be clear about temperature information
- Explain protective measures
- Highlight our safety-first approach`,

    educational_focus: `EDUCATIONAL EMPHASIS:
- Share relevant volcanic science
- Connect to Icelandic geology
- Explain the Katla eruption connection
- Highlight unique learning opportunities`,

    booking_focus: `BOOKING EMPHASIS:
- Be clear about availability
- Explain package differences
- Highlight included features
- Mention group booking options`
};

// Brand Guidelines
const LAVA_SHOW_GUIDELINES = {
    terminology: {
        preferred: {
            'team members': 'staff'     // Use team members instead of staff
        }
    }
};

// Error messages maintaining Tinna's helpful tone
const ERROR_MESSAGES = {
    rateLimited: "I'm currently helping many visitors, but I'd be happy to assist you in just a moment. Please try again shortly.",
    general: "I apologize, but I'm having a technical difficulty right now. Could you please try your question again?",
    connectionError: "I'm having trouble connecting to our system. Please give me a moment to resolve this."
};

// Configuration
const config = {
    PORT: process.env.PORT || "8080",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    API_KEY: process.env.API_KEY
};

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: config.OPENAI_API_KEY
});

// Initialize Express
const app = express();

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://lavashow-chat-demo.vercel.app',
        // Add your production URLs here
    ],
    methods: ['POST', 'OPTIONS', 'GET'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'webhook-headers'],
    credentials: true
};

// Rate limiter
const limiter = rateLimit({
    windowMs: RATE_LIMIT_MINUTES * 60 * 1000,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: { error: "Too many requests. Please try again later." }
});

// Enhanced error logging
const logError = (error, context = {}) => {
    console.error('\n❌ Error Details:', {
        message: error.message,
        stack: error.stack,
        type: error.name,
        context: {
            ...context,
            timestamp: new Date().toISOString()
        }
    });
};

// API Key verification middleware
const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        console.error('❌ Invalid or missing API key');
        return res.status(401).json({ error: "Unauthorized request" });
    }
    next();
};

// Enhanced context management
const updateContext = (sessionId, message, response) => {
    let context = conversationContext.get(sessionId) || {
        messages: [],
        lastInteraction: Date.now(),
        lastTopic: null,
        offeredFollowUp: null,
        pendingFollowUp: null,
        lastResponse: null
    };

    // Update follow-up tracking
    if (response && Object.values(FOLLOW_UP_SUGGESTIONS).flat().includes(response)) {
        // Store which follow-up was offered
        context.offeredFollowUp = response;
        // Find corresponding context
        context.pendingFollowUp = Object.entries(FOLLOW_UP_CONTEXTS)
            .find(([_, data]) => data.trigger === response)?.[0];
    }

    // Check for follow-up acknowledgment
    const isAcknowledgment = message.toLowerCase().match(/^(yes|yeah|sure|okay|ok|definitely|please|tell me|id like that|i would|go ahead)$/);
    if (isAcknowledgment && context.pendingFollowUp) {
        const followUpData = FOLLOW_UP_CONTEXTS[context.pendingFollowUp];
        if (followUpData) {
            // Get relevant knowledge for this follow-up
            const relevantKnowledge = getRelevantKnowledge(followUpData.sections.join(' '));
            // Generate response using follow-up template and knowledge
            const generatedResponse = generateFollowUpResponse(followUpData, relevantKnowledge);
            context.lastResponse = generatedResponse;
            // Clear pending follow-up after handling
            context.pendingFollowUp = null;
            context.offeredFollowUp = null;
        }
    }

    // Update messages array
    context.messages.push({
        role: 'user',
        content: message
    });
    if (response) {
        context.messages.push({
            role: 'assistant',
            content: response
        });
    }

    // Maintain reasonable history size
    if (context.messages.length > 10) {
        context.messages = context.messages.slice(-10);
    }

    // Update last interaction time
    context.lastInteraction = Date.now();
    
    conversationContext.set(sessionId, context);
    return context;
};

// Generate response for follow-up questions using templates and knowledge
const generateFollowUpResponse = (followUpData, relevantKnowledge) => {
    let response = followUpData.response.template;
    
    // Replace template variables with actual content
    for (const section of followUpData.response.sections) {
        const sectionContent = relevantKnowledge
            .filter(k => k.type === section)
            .map(k => JSON.stringify(k.content, null, 2));
        response = response.replace(`\${${section}}`, sectionContent);
    }

    return response;
};

// Helper function for token management
const getMaxTokens = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Complex topics that need more space
    const complexTopics = [
        'safety', 'technical', 'scientific',
        'educational', 'temperature', 'composition',
        'emergency', 'evacuation', 'group booking'
    ];

    const isComplex = complexTopics.some(topic => message.includes(topic));
    const isMultiPart = message.includes(' and ') || (message.match(/\?/g) || []).length > 1;

    if (isComplex && isMultiPart) return 800;   // Complex multi-part
    if (isComplex) return 600;                  // Single complex topic
    if (isMultiPart) return 500;                // Multi-part questions
    
    return 400;  // Default token count
};

// Helper function to enforce terminology
const enforceTerminology = (text) => {
    if (!text) return text;
    
    let modifiedText = text;
    
    console.log('\n📝 Checking terminology for:', text);

    Object.entries(LAVA_SHOW_GUIDELINES.terminology.preferred).forEach(([correct, incorrect]) => {
        const phraseRegex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        if (phraseRegex.test(modifiedText)) {
            console.log(`📝 Replacing "${incorrect}" with "${correct}"`);
            modifiedText = modifiedText.replace(phraseRegex, correct);
        }
    });

    return modifiedText;
};

// Middleware
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());

// Health check endpoints
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Lava Show chat server is running',
        timestamp: new Date().toISOString() 
    });
});

// Health check endpoint for chat path
app.get('/chat', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Lava Show chat server is running',
        timestamp: new Date().toISOString()
    });
});

// Main chat endpoint
app.post('/chat', verifyApiKey, async (req, res) => {
    let context;
    try {
        console.log('\n📝 Incoming Message:', req.body.message);
        
        const userMessage = req.body.message;
        const sessionId = req.sessionId || `session_${Date.now()}`;

        // Check cache
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}`;
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response');
            return res.json(cached.response);
        }

        // Handle greetings
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        if (greetings.includes(userMessage.toLowerCase().trim())) {
            const greeting = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
            
            // Update context
            context = updateContext(sessionId, userMessage, greeting);
            context.conversationStarted = true;

            return res.status(200).json({
                message: greeting
            });
        }

        // Initialize context
        context = conversationContext.get(sessionId) || {
            messages: [],
            lastInteraction: Date.now(),
            conversationStarted: false,
            messageCount: 0,
            lastTopic: null,
            offeredFollowUp: null,
            pendingFollowUp: null,
            lastResponse: null
        };

        // Check for follow-up acknowledgment first
        if (context?.pendingFollowUp) {
            const isAcknowledgment = userMessage.toLowerCase().match(/^(yes|yeah|sure|okay|ok|definitely|please|tell me|id like that|i would|go ahead)$/);
            if (isAcknowledgment) {
                const followUpData = FOLLOW_UP_CONTEXTS[context.pendingFollowUp];
                if (followUpData) {
                    // Handle follow-up response
                    const relevantKnowledge = getRelevantKnowledge(followUpData.response.sections.join(' '));
                    const response = generateFollowUpResponse(followUpData, relevantKnowledge);
                    
                    // Update context and return response
                    updateContext(sessionId, userMessage, response);
                    return res.json({ message: response });
                }
            }
        }

        // Get relevant knowledge
        const relevantKnowledge = getRelevantKnowledge(userMessage);
        console.log('\n📚 Knowledge Base Match:', {
            matches: relevantKnowledge.length,
            types: relevantKnowledge.map(k => k.type)
        });

        // Enhanced system prompt with knowledge base content
        let systemPrompt = `${SYSTEM_PROMPTS.base_prompt}\n\nToday is ${new Date().toLocaleDateString()}.`;
        
        if (relevantKnowledge.length > 0) {
            systemPrompt += '\n\nKNOWLEDGE BASE DATA:';
            relevantKnowledge.forEach(info => {
                systemPrompt += `\n\n${info.type.toUpperCase()}:\n${JSON.stringify(info.content, null, 2)}`;
            });
        }

        // Prepare messages array
        const messages = [
            { 
                role: "system", 
                content: systemPrompt
            }
        ];

        // Add context awareness
        if (context.messages && context.messages.length > 0) {
            messages.push(...context.messages.slice(-5));
        }

        // Add user message
        messages.push({
            role: "user",
            content: `Knowledge Base Information: ${JSON.stringify(relevantKnowledge)}
            
            User Question: ${userMessage}
            
            Please provide a natural, conversational response using ONLY the information from the knowledge base. 
            Be specific and accurate with details like times, prices, and safety information.`
        });

        // Make GPT-4 request with retries
        let attempt = 0;
        let completion;
        
        while (attempt < MAX_RETRIES) {
            try {
                completion = await openai.chat.completions.create({
                    model: "gpt-4-1106-preview",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: getMaxTokens(userMessage)
                });
                break;
            } catch (error) {
                attempt++;
                console.error(`OpenAI request failed (Attempt ${attempt}/${MAX_RETRIES}):`, {
                    error: error.message,
                    status: error.response?.status,
                    attempt: attempt,
                    maxRetries: MAX_RETRIES
                });

                if (attempt === MAX_RETRIES) {
                    throw new Error(`Failed after ${MAX_RETRIES} attempts: ${error.message}`);
                }

                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`⏳ Retrying in ${delay}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (!completion) {
            throw new Error('Failed to get completion after retries');
        }

        const response = completion.choices[0].message.content;
        console.log('\n🤖 GPT Response:', response);

        // Apply terminology enhancement
        const enhancedResponse = enforceTerminology(response);
        console.log('\n✨ Enhanced Response:', enhancedResponse);

        // Cache the response
        responseCache.set(cacheKey, {
            response: {
                message: enhancedResponse
            },
            timestamp: Date.now()
        });

        // Update conversation context
        context = updateContext(sessionId, userMessage, enhancedResponse);
        
        // Return enhanced response
        return res.status(200).json({
            message: enhancedResponse
        });

    } catch (error) {
        // Update last interaction time even on error
        if (context) {
            context.lastInteraction = Date.now();
            conversationContext.set(sessionId, context);
        }

        logError(error, {
            message: req.body?.message
        });
        
        return res.status(500).json({
            error: error.message.includes('rate_limit_exceeded') ? 
                ERROR_MESSAGES.rateLimited : 
                ERROR_MESSAGES.general
        });
    }
});

// Cleanup old contexts and cache
setInterval(() => {
    const oneHourAgo = Date.now() - CACHE_TTL;
    for (const [key, value] of conversationContext.entries()) {
        if (value.lastInteraction < oneHourAgo) {
            conversationContext.delete(key);
        }
    }
    for (const [key, value] of responseCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
            responseCache.delete(key);
        }
    }
}, CACHE_TTL);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
    console.log('\n🚀 Server Status:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log('\n⚙️ Configuration:');
    console.log(`OpenAI API Key configured: ${!!config.OPENAI_API_KEY}`);
    console.log(`API Key configured: ${!!config.API_KEY}`);
    console.log('\n🔒 Security:');
    console.log('CORS origins:', corsOptions.origin);
    console.log('Rate limiting:', `${limiter.windowMs/60000} minutes, ${limiter.max} requests`);
});

// Enhanced error handling for server startup
server.on('error', (error) => {
    logError(error, {
        context: 'Server Startup',
        port: PORT,
        environment: process.env.NODE_ENV
    });
    process.exit(1);
});

// Process-level error handling
process.on('uncaughtException', (error) => {
    logError(error, {
        context: 'Uncaught Exception',
        critical: true
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logError(reason, {
        context: 'Unhandled Rejection',
        promise: promise
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️ SIGTERM received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

export default app;            