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

// Tinna's Character Constants - used in prompt generation
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

// Error messages maintaining Tinna's helpful tone
const ERROR_MESSAGES = {
    rateLimited: "I'm currently helping many visitors, but I'd be happy to assist you in just a moment. Please try again shortly.",
    general: "I apologize, but I'm having a technical difficulty right now. Could you please try your question again?",
    connectionError: "I'm having trouble connecting to our system. Please give me a moment to resolve this."
};

// Brand Guidelines
const LAVA_SHOW_GUIDELINES = {
    terminology: {
        preferred: {
            'team members': 'staff'     // Use team members instead of staff
        }
    }
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

// Add this line to trust proxy headers
app.set('trust proxy', 1);  // trust first proxy

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

// Generate system prompt for Tinna based on language and available knowledge
const generateSystemPrompt = (language = 'en', relevantKnowledge = []) => {
    // Start with empty prompt
    let basePrompt = '';
    
    // Language-specific personality setup
    if (language === 'en') {
        // Use TINNA_PERSONALITY to construct the prompt
        const traits = Object.entries(TINNA_PERSONALITY.core_traits)
            .filter(([_, value]) => value)
            .map(([trait, _]) => trait.replace('_', ' '))
            .join(', ');
            
        const interests = TINNA_PERSONALITY.special_interests
            .map(interest => `- ${interest}`)
            .join('\n');
            
        basePrompt = `You are Tinna, Lava Show's enthusiastic and knowledgeable AI chatbot. You're passionate about volcanic science and safety!

PERSONALITY AND VOICE:
- ${TINNA_PERSONALITY.voice_characteristics.tone}
- Enthusiastic about ${TINNA_PERSONALITY.special_interests.slice(0, 3).join(', ')}
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
- Keep messages concise and easy to read (2-3 paragraphs maximum)
- Break information into short, digestible paragraphs
- Be specific with temperatures, times, and safety measures
- Include relevant educational content when appropriate
- Maintain enthusiasm while being precise with facts
- For small talk or greetings, respond naturally without forcing promotional information
- If asked about something you don't know, be honest and offer to help with what you do know`;
    } else if (language === 'is') {
        // Icelandic version
        basePrompt = `Þú ert Tinna, gervigreindarfulltrúi hjá Lava Show.

PERSÓNULEIKI OG RÖDD:
- Hlý og vinaleg, en samt fagleg
- Áhugasöm um eldfjallafræði og öryggi
- Fræðandi og upplýsandi
- Leggur alltaf áherslu á öryggisupplýsingar
- Notaðu "okkar" frekar en "sýningin" þegar vísað er til sýningar og aðstöðu

Haltu skilaboðum hnitmiðuðum og auðlesnum (hámark 2-3 málsgreinar)`;
    } else {
        // Generic prompt for other languages, assuming GPT can translate appropriately
        basePrompt = `You are Tinna, Lava Show's enthusiastic and knowledgeable AI chatbot. 
Respond in the same language the user is using.

Keep messages concise (2-3 paragraphs maximum).
Break information into short, digestible paragraphs.
Be specific with temperatures, times, and safety measures.
Maintain enthusiasm while being precise with facts.`;
    }

    // Add today's date
    basePrompt += `\n\nToday is ${new Date().toLocaleDateString()}.`;
    
    // Add knowledge base data if available
    if (relevantKnowledge.length > 0) {
        basePrompt += '\n\nKNOWLEDGE BASE DATA:';
        relevantKnowledge.forEach(info => {
            basePrompt += `\n\n${info.type.toUpperCase()}:\n${JSON.stringify(info.content, null, 2)}`;
        });
    } else {
        // Guidance for questions outside knowledge base
        basePrompt += `\n\nIf asked about information not in the knowledge base:
- For basic facts about lava, volcanoes, or Icelandic geology, you can answer with general knowledge
- For specific details about Lava Show schedules, prices, or operations, apologize and offer to help with general information
- For unrelated topics, politely redirect to Lava Show information`;
    }

    // ADD WEBSITE LINKS GUIDELINES HERE.
    basePrompt += `\n\nWEBSITE LINKS GUIDELINES:
1. For Location Info:
   - For Reykjavík location: Format map link as "[View Reykjavík Location on Google Maps 📍](map_url)"
   - For Vík location: Format map link as "[View Vík Location on Google Maps 📍](map_url)"
   - For booking links: Format as "[Book Name Experience](booking_url)"
   - When showing both locations, only include ONE map link for EACH location
   - NEVER duplicate or nest map links inside other URLs
   - Include links AFTER the location description, not within it


2. For Booking and Tickets:
   - Main Booking Page: "[Book Your Experience](https://www.lavashow.com/tickets)"
   - Reykjavík Tickets: "[Book Reykjavík Experience](https://www.lavashow.com/reykjavik)"
   - Vík Tickets: "[Book Vík Experience](https://www.lavashow.com/vik)"
   - Gift Cards: "[Purchase Gift Cards](https://www.lavashow.com/giftcard)"

3. For General Information:
   - Main Website: "[Visit Lava Show Website](https://www.lavashow.com)"
   - About Us: "[Learn About Us](https://www.lavashow.com/about)"

4. Link Formatting:
   - ALWAYS use: "[Display Text](URL)" format (NO space between ] and ()
   - Include location emoji 📍 for map links
   - Place links at end of relevant information
   - For booking links, use action verbs like "Book," "Purchase," "Reserve"
   - For location info, use verbs like "View," "Find," "Locate"

5. Common Use Cases:
   - When mentioning pricing, add: "[Book Now](https://www.lavashow.com/tickets)"
   - When discussing location details, add appropriate map link
   - When mentioning gift options, add: "[View Gift Cards](https://www.lavashow.com/giftcard)"
   - When sharing general information about shows, add: "[Learn More](https://www.lavashow.com)"`;

    // ADD NEW PRICING QUERY GUIDELINES HERE
    basePrompt += `\n\nPRICING QUERY GUIDELINES:
1. When answering pricing questions:
   - ALWAYS use the exact pricing from the 'Calculated pricing information' JSON when provided
   - NEVER state that any age group gets free admission unless explicitly stated in the calculation
   - Children (12 and younger) pay 3,590 ISK for Classic Experience, NOT free
   - Adults (13+) pay 6,590 ISK for Classic Experience
   - For Premium Experience: Adults (13+) pay 9,990 ISK
   - The Premium Experience has an age restriction of 13+
   - Always calculate the total correctly by multiplying the number of people by their respective prices
   - Children are NEVER free - make sure to include their cost in the total

2. Response Format:
   - Clearly state the individual costs (adults, children, etc.)
   - Show the total cost
   - Include the "[Book Now](https://www.lavashow.com/tickets)" link
   - Be friendly but accurate with pricing`;   

    return basePrompt;
};

// Format response for better readability
const formatResponse = (response) => {
    if (!response) return '';
    
    // First, check if response already has paragraphs
    if (response.includes('\n\n')) return response;
    
    // Split long responses into paragraphs (if not already formatted)
    const sentences = response.split(/(?<=[.!?])\s+/);
    let paragraphs = [];
    let currentParagraph = '';
    
    sentences.forEach(sentence => {
        if (currentParagraph.length + sentence.length > 150) {
            paragraphs.push(currentParagraph.trim());
            currentParagraph = sentence;
        } else {
            currentParagraph += (currentParagraph ? ' ' : '') + sentence;
        }
    });
    
    if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
    }
    
    return paragraphs.join('\n\n');
};

// Price calculation function
const calculatePricing = (message, context) => {
    // Base prices - UPDATED to match knowledgeBase
    const PRICING = {
        classic: {
            adult: 6590,      // ISK (updated from 5,900)
            child: 3590,      // ISK (updated from 3,500)
            student: 5270,    // ISK (updated - assuming still ~80% of adult price)
            senior: 5270      // ISK (updated - assuming still ~80% of adult price)
        },
        premium: {
            adult: 9990,      // ISK (updated from 9,900)
            child: null,      // Not applicable - Premium Experience is 13+ only
            student: 7990,    // ISK (updated - assuming ~80% of adult price)
            senior: 7990      // ISK (updated - assuming ~80% of adult price)
        },
        group: {
            minSize: 10,
            discount: 0.15    // 15% discount for groups of 10+
        },
        family: {
            maxAdults: 2,
            maxChildren: 3,
            price: 16990      // ISK (updated from 14,990 to reflect increased prices)
        }
    };
    
    // Extract information from message and context
    const messageLower = message.toLowerCase();
    
    // Determine package type
    let packageType = context.bookingInfo.packageType || 
        (messageLower.includes('premium') ? 'premium' : 'classic');
    
    // Group size
    let groupSize = context.bookingInfo.groupSize;
    if (!groupSize) {
        const sizeMatch = messageLower.match(/(\d+)\s*(people|persons|guests|visitors)/i);
        if (sizeMatch) {
            groupSize = parseInt(sizeMatch[1]);
        } else {
            groupSize = 1; // Default to 1 person
        }
    }
    
    // Visitor types
    let adults = groupSize;
    let children = 0;
    let students = 0;
    let seniors = 0;
    
    // Check for specific visitor types
    const adultMatch = messageLower.match(/(\d+)\s*adults?/i);
    const childMatch = messageLower.match(/(\d+)\s*children|kids|child/i);
    const studentMatch = messageLower.match(/(\d+)\s*students?/i);
    const seniorMatch = messageLower.match(/(\d+)\s*seniors?/i);
    
    if (adultMatch || childMatch || studentMatch || seniorMatch) {
        adults = adultMatch ? parseInt(adultMatch[1]) : 0;
        children = childMatch ? parseInt(childMatch[1]) : 0;
        students = studentMatch ? parseInt(studentMatch[1]) : 0;
        seniors = seniorMatch ? parseInt(seniorMatch[1]) : 0;
        
        // Update total group size
        groupSize = adults + children + students + seniors;
    }
    
    // Check for family package
    const isFamily = messageLower.includes('family') || 
        (adults <= PRICING.family.maxAdults && 
         children > 0 && 
         children <= PRICING.family.maxChildren &&
         students === 0 && 
         seniors === 0);
         
    // Calculate base pricing
    let totalPrice = 0;
    let breakdown = {};
    
    if (isFamily) {
        totalPrice = PRICING.family.price;
        breakdown = {
            package: 'Family Package',
            basePrice: PRICING.family.price,
            totalPrice: PRICING.family.price,
            details: 'Family package includes 2 adults and up to 3 children'
        };
    } else {
        // Calculate individual prices
        const adultPrice = adults * PRICING[packageType].adult;
        const childPrice = children * PRICING[packageType].child;
        const studentPrice = students * PRICING[packageType].student;
        const seniorPrice = seniors * PRICING[packageType].senior;
        
        totalPrice = adultPrice + childPrice + studentPrice + seniorPrice;
        
        // Check for group discount
        let discount = 0;
        if (groupSize >= PRICING.group.minSize) {
            discount = totalPrice * PRICING.group.discount;
            totalPrice -= discount;
        }
        
        breakdown = {
            package: packageType.charAt(0).toUpperCase() + packageType.slice(1),
            adults: {
                count: adults,
                pricePerPerson: PRICING[packageType].adult,
                total: adultPrice
            },
            children: children > 0 ? {
                count: children,
                pricePerPerson: PRICING[packageType].child,
                total: childPrice
            } : undefined,
            students: students > 0 ? {
                count: students,
                pricePerPerson: PRICING[packageType].student,
                total: studentPrice
            } : undefined,
            seniors: seniors > 0 ? {
                count: seniors,
                pricePerPerson: PRICING[packageType].senior,
                total: seniorPrice
            } : undefined,
            groupDiscount: discount > 0 ? {
                percentage: PRICING.group.discount * 100,
                amount: discount
            } : undefined,
            totalPrice: Math.round(totalPrice),
            currency: 'ISK'
        };
        
        // Remove undefined properties
        Object.keys(breakdown).forEach(key => 
            breakdown[key] === undefined && delete breakdown[key]
        );
    }
    
    return breakdown;
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

// Enhanced context analysis and tracking
const updateContextFromMessage = (context, message, knowledgeMatches) => {
    // Track knowledge categories that were relevant to this query
    const queryTopics = knowledgeMatches.map(k => k.type);
    if (queryTopics.length > 0) {
        context.conversation.currentTopic = queryTopics[0]; // Most relevant topic
        context.conversation.topicHistory.push(queryTopics[0]);
        
        // Keep topic history manageable
        if (context.conversation.topicHistory.length > 5) {
            context.conversation.topicHistory = context.conversation.topicHistory.slice(-5);
        }
    }
    
    // Analyze message for booking information
    const messageLower = message.toLowerCase();
    
    // Group size detection
    const groupSizeMatch = messageLower.match(/(\d+)\s*(people|persons|guests|visitors|group)/i);
    if (groupSizeMatch && !context.bookingInfo.groupSize) {
        context.bookingInfo.groupSize = parseInt(groupSizeMatch[1]);
    }
    
    // Date detection (simple patterns - could be enhanced)
    const dateMatch = messageLower.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)/i);
    if (dateMatch && !context.bookingInfo.preferredDate) {
        context.bookingInfo.preferredDate = dateMatch[1];
    }
    
    // Time detection
    const timeMatch = messageLower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch && !context.bookingInfo.preferredTime) {
        context.bookingInfo.preferredTime = timeMatch[1];
    }
    
    // Package type detection
    if (messageLower.includes('premium') && !context.bookingInfo.packageType) {
        context.bookingInfo.packageType = 'premium';
    } else if (messageLower.includes('classic') && !context.bookingInfo.packageType) {
        context.bookingInfo.packageType = 'classic';
    }
    
    // Detect user interests
    const interestKeywords = [
        'science', 'geology', 'volcano', 'safety', 'education', 
        'pricing', 'booking', 'schedule', 'location', 'photos'
    ];
    
    interestKeywords.forEach(keyword => {
        if (messageLower.includes(keyword) && !context.userPreferences.interests.includes(keyword)) {
            context.userPreferences.interests.push(keyword);
        }
    });
    
    // Track query type
    if (messageLower.match(/cost|price|how much|discount/i)) {
        context.conversation.lastQueryType = 'pricing';
    } else if (messageLower.match(/book|reserve|when|time|schedule|date/i)) {
        context.conversation.lastQueryType = 'booking';
    } else if (messageLower.match(/where|location|address|directions|get there/i)) {
        context.conversation.lastQueryType = 'location';
    } else if (messageLower.match(/safety|danger|protect|risk/i)) {
        context.conversation.lastQueryType = 'safety';
    } else if (messageLower.match(/science|how|work|temperature|lava/i)) {
        context.conversation.lastQueryType = 'educational';
    }
    
    // Store previous queries (up to 3)
    if (context.conversation.lastQueryType) {
        context.userPreferences.previousQueries.unshift(context.conversation.lastQueryType);
        if (context.userPreferences.previousQueries.length > 3) {
            context.userPreferences.previousQueries = context.userPreferences.previousQueries.slice(0, 3);
        }
    }
    
    console.log('\n📊 Updated Context:', {
        currentTopic: context.conversation.currentTopic,
        bookingInfo: context.bookingInfo,
        interests: context.userPreferences.interests,
        queryType: context.conversation.lastQueryType
    });
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
    try {
        console.log('\n📝 Incoming Message:', req.body.message);
        
        const userMessage = req.body.message;
        const userLanguage = req.body.language || 'en';
        const sessionId = req.body.sessionId || `session_${Date.now()}`;

        // Check cache
        const cacheKey = `${sessionId}:${userMessage.toLowerCase().trim()}:${userLanguage}`;
        const cached = responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log('\n📦 Using cached response');
            return res.json(cached.response);
        }

        // Get conversation history with enhanced context tracking
        let context = conversationContext.get(sessionId) || {
            messages: [],
            lastInteraction: Date.now(),
            userPreferences: {
                language: userLanguage,
                interests: [],       // Track what topics the user is interested in
                previousQueries: []  // Store previous query types
            },
            bookingInfo: {
                groupSize: null,
                preferredDate: null,
                preferredTime: null,
                packageType: null,
                specialRequests: null
            },
            conversation: {
                currentTopic: null,
                topicHistory: [],    // Track conversation flow
                lastQueryType: null  // Categorize last query (booking, info, pricing, etc.)
            }
        };

        // Get relevant knowledge with enhanced retrieval
        const knowledgeResult = getRelevantKnowledge(userMessage, context);
        const relevantKnowledge = knowledgeResult.relevantInfo;
        const queryType = knowledgeResult.queryType;
        
        console.log('\n📚 Knowledge Base Match:', {
            queryType: queryType,
            matches: relevantKnowledge.length,
            types: relevantKnowledge.map(k => k.type)
        });

        // Check if we need to calculate pricing
        const isPricingQuery = queryType === 'pricing';
        let calculatedPricing = null;
        
        if (isPricingQuery) {
            calculatedPricing = calculatePricing(userMessage, context);
            console.log('\n💰 Price calculation:', calculatedPricing);
        }

        // Create base system prompt with Tinna's personality
        let systemPrompt = generateSystemPrompt(userLanguage, relevantKnowledge);

        // Prepare messages array
        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // Add conversation history (limited to last 5 messages for context)
        if (context.messages && context.messages.length > 0) {
            messages.push(...context.messages.slice(-5));
        }

        // Add user message with any pricing calculations
        messages.push({
            role: "user",
            content: userMessage + (calculatedPricing ? 
                `\n\nCalculated pricing information: ${JSON.stringify(calculatedPricing, null, 2)}` : '')
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
        
        // Format response for better readability
        const formattedResponse = formatResponse(enhancedResponse);
        console.log('\n✨ Final Response:', formattedResponse);

        // Update conversation context
        context.messages.push({ role: "user", content: userMessage });
        context.messages.push({ role: "assistant", content: formattedResponse });
        
        // Store the query type in context
        context.conversation.lastQueryType = queryType;
        
        // Maintain reasonable history size
        if (context.messages.length > 10) {
            context.messages = context.messages.slice(-10);
        }
        
        // Update context with conversation analysis
        updateContextFromMessage(context, userMessage, relevantKnowledge);
        
        context.lastInteraction = Date.now();
        conversationContext.set(sessionId, context);

        // Cache the response
        responseCache.set(cacheKey, {
            response: {
                message: formattedResponse
            },
            timestamp: Date.now()
        });

        // Return response
        return res.status(200).json({
            message: formattedResponse
        });

    } catch (error) {
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