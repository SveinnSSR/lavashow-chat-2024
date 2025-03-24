// knowledgeBase.js

// Synonym system for better query matching
const SYNONYMS = {
    'price': ['cost', 'fee', 'payment', 'expense', 'charge', 'pay', 'spend', 'money'],
    'schedule': ['timetable', 'times', 'hours', 'when', 'slots', 'show time', 'show times', 'slots'],
    'book': ['reserve', 'ticket', 'purchase', 'buy', 'booking', 'reservation', 'seat', 'seats'],
    'location': ['where', 'place', 'venue', 'address', 'building', 'direction', 'directions', 'find'],
    'experience': ['show', 'tour', 'visit', 'attraction', 'activity', 'watch', 'see', 'attend'],
    'group': ['team', 'party', 'company', 'class', 'school', 'families', 'friends', 'corporate'],
    'child': ['kid', 'children', 'young', 'youth', 'teenager', 'minor', 'baby', 'infant'],
    'safety': ['secure', 'safe', 'protection', 'danger', 'risk', 'hazard', 'emergency', 'protect'],
    'gift': ['souvenir', 'memento', 'present', 'shop', 'store', 'merchandise', 'buy'],
    'lava': ['magma', 'molten rock', 'volcanic', 'eruption', 'volcano', 'how it works', 'melted']
};

// Query type classification for context tracking
const QUERY_TYPES = {
    PRICING: {
        patterns: [/price|cost|how much|discount|offer|deal|cheap|expensive/i],
        type: 'pricing'
    },
    BOOKING: {
        patterns: [/book|reserve|when|time|schedule|date|slot|available|cancel|modify/i],
        type: 'booking'
    },
    LOCATION: {
        patterns: [/where|location|address|direction|find|get there|near|area|city/i],
        type: 'location'
    },
    SAFETY: {
        patterns: [/safety|danger|protect|risk|emergency|secure|hazard|threat/i],
        type: 'safety'
    },
    EDUCATIONAL: {
        patterns: [/science|how|work|temperature|lava|melt|learn|volcano|explain/i],
        type: 'educational'
    },
    GROUP: {
        patterns: [/group|team|class|school|company|corporate|private|event/i],
        type: 'group'
    },
    EXPERIENCES: {
        patterns: [/experience|package|difference|compare|classic|premium|show/i],
        type: 'experiences'
    },
    GIFT: {
        patterns: [/gift|souvenir|shop|buy|purchase|memento|store|merchandise/i],
        type: 'gift'
    },
    CHILDREN: {
        patterns: [/child|kid|young|age|restriction|family|baby|infant|allowed/i],
        type: 'children'
    },
    GREETING: {
        patterns: [/hello|hi|hey|greetings|morning|afternoon|evening/i],
        type: 'greeting'
    },
    SMALLTALK: {
        patterns: [/how are you|nice|good|glad|happy|thanks|thank you|great/i],
        type: 'smalltalk'
    }
};

// Helper function to expand terms using synonyms
function expandTerms(message) {
    let expanded = message;
    
    Object.entries(SYNONYMS).forEach(([term, synonyms]) => {
        // Check if any synonym is in the message
        if (synonyms.some(s => message.includes(s))) {
            // Add the main term if a synonym was found and the term isn't already in the message
            if (!message.includes(term)) {
                expanded += ` ${term}`;
            }
        }
    });
    
    return expanded;
}

// Function to classify the query type
function classifyQuery(message) {
    // Default to general inquiry if nothing matches
    let result = { type: 'general', confidence: 0 };
    
    Object.entries(QUERY_TYPES).forEach(([key, data]) => {
        data.patterns.forEach(pattern => {
            const matches = message.match(pattern);
            if (matches) {
                // Calculate a simple confidence score based on match length vs message length
                const matchLength = matches[0].length;
                const confidence = matchLength / message.length;
                
                // Update result if confidence is higher
                if (confidence > result.confidence) {
                    result = { type: data.type, confidence };
                }
            }
        });
    });
    
    return result;
}

// The main knowledge base object - keeping your existing content exactly as is
export const knowledgeBase = {
    website_links: {
        main: "https://www.lavashow.com",
        booking: "https://www.lavashow.com/tickets",
        reykjavik: {
            tickets: "https://www.lavashow.com/reykjavik",
            location: "https://www.google.com/maps/dir//Lava+Show+Fiskisl%C3%B3%C3%B0+73+101+Reykjav%C3%ADk/@64.1569653,-21.9430121,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48d6757d1ade5e2d:0x69b61da06072064f!2m2!1d-21.9429663!2d64.1569391"
        },
        vik: {
            tickets: "https://www.lavashow.com/vik",
            location: "https://www.google.com/maps/dir//Lava+Show+in+V%C3%ADk+V%C3%ADkurbraut+5+870+870+Vik/@63.4183709,-19.0101997,14z/data=!4m5!4m4!1m0!1m2!1s0x48d74b1db5e98aa1:0xa197ddd0bfc5ebf1"
        },
        gift_cards: "https://www.lavashow.com/giftcard",
        about: "https://www.lavashow.com/about"
    },
    general_info: {
        tagline: "LAVA SHOW recreates a volcanic eruption by superheating real lava up to 1100°C (2000°F) and then pouring it into a showroom full of people.",
        description: "Lava Show is the only live lava show in the world and has received multiple innovation awards and recognition for its educational and cultural value. With outstanding customer reviews. [Visit Lava Show Website](https://www.lavashow.com)",
        awards: ["2024 Tripadvisor Best of the Best"],
        locations: {
            reykjavik: {
                name: "LAVA SHOW in Reykjavík",
                address: "Fiskislóð 73, 101 Reykjavík",
                description: "Our brand new location is located in Reykjavík, which is world-renowned for its culture, history, and natural beauty on all fronts. In the heart of Reykjavik. [View on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+Fiskisl%C3%B3%C3%B0+73+101+Reykjav%C3%ADk/@64.1569653,-21.9430121,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48d6757d1ade5e2d:0x69b61da06072064f!2m2!1d-21.9429663!2d64.1569391)",
                booking_link: "[Book Reykjavík Experience](https://www.lavashow.com/reykjavik)",
                capacity: {
                    classic: "82 seats (can be expanded to 86)",
                    premium: "30 seats (can be expanded to 32)",
                    total: "118 seats total possible"
                },
                opened: "November 2022"
            },
            vik: {
                name: "LAVA SHOW in Vík",
                address: "Víkurbraut 5, 870 Vík",
                description: "Vík is a charming town nestled in the midst of Katla UNESCO Global Geopark, surrounded by volcanoes, glaciers, and black sand beaches. 190km (118 miles) away from Reykjavík. [View on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+in+V%C3%ADk+V%C3%ADkurbraut+5+870+870+Vik/@63.4183709,-19.0101997,14z/data=!4m5!4m4!1m0!1m2!1s0x48d74b1db5e98aa1:0xa197ddd0bfc5ebf1)",
                booking_link: "[Book Vík Experience](https://www.lavashow.com/vik)",
                capacity: {
                    current: "50 seats (can be expanded to 54/55)",
                    future: "Expanding to 65 seats by end of January 2025"
                },
                opened: "September 2018"
            }
        },
        contact: {
            main_phone: "+354 553 0005",
            email: "info@lavashow.com",
            reykjavik_desk: "+354 868 6005",
            vik_desk: "+354 835 6777",
            hours: {
                phone_support: "9 AM - 7 PM",
                website: "[www.lavashow.com](https://www.lavashow.com)"
            }
        }
    },
    experiences: {
        classic: {
            name: "Classic Experience",
            description: "The award-winning Lava Show immersive experience. [Book Classic Experience](https://www.lavashow.com/tickets)",
            duration: "45-55 minutes",
            pricing: {
                adults: "6,590 ISK (13+)",              // Updated from 5,900
                children: "3,590 ISK (age 12 and younger)" // Updated from 3,500
            },
            includes: [
                "Live lava demonstration",
                "Educational presentation",
                "Security goggles",
                "Interactive Q&A session",
                "Free parking"
            ],
            show_times: {
                reykjavik: ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
                vik: ["11:00", "13:00", "15:00", "17:00", "19:00", "21:00"]
            }
        },
        premium: {
            name: "Premium Experience",
            description: "Takes the award-winning Classic Experience to new heights. [Book Premium Experience](https://www.lavashow.com/tickets)",
            duration: "60-75 minutes",
            price: "9,990 ISK",                       // Updated from 9,900
            age_restriction: "Adults only (13+)",
            includes: [
                "Aperitif (drink) upon arrival",
                "VIP access to the premium lounge",
                "The balcony view experience (extra hot)",
                "A backstage tour to the furnace room",
                "A piece of lava from the show, giftwrapped",
                "Free parking"
            ],
            locations: ["Reykjavík only"]
        }
    },
    booking_policies: {
        cancellation: {
            policy: "All tickets fully refundable if cancelled within 24 hrs.",
            group_bookings: {
                small: "3 days notice required",
                fees: "100% fee if canceled less than 1 day before show time for individuals, 3 days for groups"
            },
            important_notes: [
                "No refunds for no-shows",
                "No refunds for late arrivals",
                "Rescheduling possible based on availability"
            ],
            booking_link: "[Book Your Experience](https://www.lavashow.com/tickets)"
        },
        arrival: {
            recommendation: "We suggest arriving at least 20 minutes early",
            late_policy: "Can accommodate late customers up to 10-13 minutes from show start",
            check_in: {
                classic: "Check in at the counter downstairs",
                premium: [
                    "Check in downstairs at the counter",
                    "Be shown to our beautiful premium lounge",
                    "Get a drink of choice from LAVA BAR",
                    "Relax and enjoy the lounge"
                ]
            }
        },
        seasonality: {
            peak_seasons: [
                "July",
                "August",
                "October",
                "Christmas & New Years (Dec 23-Jan 5)",
                "February",
                "Easter (7 days)"
            ],
            low_season: "November, December 1-22, January 6-31",
            medium_season: "March, April (apart from Easter), May, June, September"
        }
    },
    educational_content: {
        lava_info: {
            origin: "The lava originates from the 1918 Katla eruption",
            composition: {
                material: "Basaltic tephra (basaltic sand from black sand beaches)",
                elements: {
                    silica: "47%",
                    iron: "14%",
                    calcium: "9%",
                    aluminum: "13%",
                    titanium: "4%",
                    magnesium: "5%",
                    sodium: "3%"
                }
            },
            temperature: {
                melting_point: "900°C minimum",
                show_temperature: "1100°C (2000°F)",
                reason: "Optimal viscosity for demonstrating natural lava flow"
            },
            melting_process: {
                initial_heat_time: "5 hours for first show",
                subsequent_shows: "1.5-2 hours between shows",
                sustainability: {
                    reykjavik: "Furnace runs on methane from municipal waste",
                    vik: "Furnace runs on propane"
                }
            }
        },
        safety_info: {
            air_quality: {
                monitoring: "Regular air quality testing",
                ventilation: "Advanced air conditioning system",
                safety_measures: "Heat and steam extraction systems"
            },
            protective_equipment: {
                viewers: "Security goggles provided",
                temperature_control: "Optimal viewing distance maintained",
                facility_design: "Purpose-built for safe viewing"
            }
        }
    },
    group_services: {
        capacity: {
            reykjavik: {
                total: "118 seats",
                premium_lounge: "32 seats",
                main_area: "86 seats"
            },
            vik: {
                current: "50-55 seats",
                upcoming: "Expanding to 65 seats (2025)"
            }
        },
        private_events: {
            premium_lounge: {
                description: "Exclusive access to our luxurious premium lounge",
                capacity: "15-25 people (Max: 32)",
                includes: [
                    "Exclusive private access",
                    "Aperitif",
                    "Piece of lava",
                    "Premium balcony seating",
                    "Backstage tour"
                ],
                add_ons: [
                    "Food and drink options",
                    "Extended hours until 23:00",
                    "Meet the founders",
                    "Karaoke equipment rental"
                ]
            },
            entire_facility: {
                description: "Full facility rental for larger groups",
                capacity: "Up to 118 people",
                includes: [
                    "Access to entire facility",
                    "Ground floor welcome area",
                    "Premium Lounge access",
                    "Custom show experience"
                ],
                add_ons: [
                    "Food and beverage packages",
                    "Extended hours until 23:00",
                    "Founder presentations",
                    "Custom entertainment options"
                ]
            }
        }
    },
    gift_shop: {
        description: "Authentic lava products made from the lava from our show. Our collection is uniquely valuable as removing lava from its natural environment in Iceland is prohibited without explicit authorization.",
        products: {
            lava_items: [
                {
                    name: "Lava Shard",
                    description: "A shard of lava, presented in a velvet gift bag",
                    uniqueness: "From 1918 Katla eruption"
                },
                {
                    name: "Pele's Hair - Small",
                    description: "A rarity of nature in a small glass jar"
                },
                {
                    name: "Pele's Hair - Large",
                    description: "A rarity of nature in a large glass jar"
                },
                {
                    name: "Dragon Glass Necklace",
                    description: "Unique necklace made of real obsidian"
                },
                {
                    name: "Pele's Tear Necklace",
                    description: "Handmade with silver"
                },
                {
                    name: "Pele's Tear Earrings",
                    description: "Handmade with silver"
                }
            ],
            merchandise: [
                {
                    name: "T-shirts",
                    available: true
                },
                {
                    name: "Stamps",
                    available: true
                },
                {
                    name: "Postcards",
                    available: true
                }
            ]
        },
        gift_cards: {
            options: [
                {
                    name: "Classic Experience Gift Card",
                    validity: "Valid for 375 days after purchase",
                    redemption: "Contact info@lavashow.com or call +354 553 0005 to book",
                    delivery_options: {
                        electronic: {
                            default: "Sent via booking system email",
                            alternative: "Elegant version available on request"
                        },
                        physical: "Available for pickup in Reykjavík or Vík"
                    }
                },
                {
                    name: "Premium Experience Gift Card",
                    validity: "Valid for 375 days after purchase",
                    redemption: "Contact info@lavashow.com or call +354 553 0005 to book",
                    experience_details: {
                        duration: "1 hour and 15 minutes",
                        arrival: "30 minutes prior to show",
                        process: [
                            "Check in downstairs",
                            "Premium lounge access",
                            "Drink selection",
                            "Expert host interaction",
                            "Volcanologist suit photo opportunity",
                            "Premium balcony seating selection"
                        ]
                    }
                },
                {
                    name: "Premium Gift Box",
                    description: "Selected Lava Show items"
                }
            ],
            general_info: {
                validity: "375 days from purchase",
                booking_process: "Contact required to schedule visit",
                contact: {
                    email: "info@lavashow.com",
                    phone: "+354 553 0005"
                },
                delivery: {
                    electronic: {
                        default: "Sent via booking system email",
                        alternative: "Elegant version available on request"
                    },
                    physical: "Available for pickup in Reykjavík or Vík"
                },
                purchase_link: "Give the gift of an unforgettable volcanic experience. [Purchase Gift Cards](https://www.lavashow.com/giftcard)"
            }
        }
    },
    faq: {
        booking_questions: {
            advance_booking: {
                question: "Should tickets be purchased in advance?",
                answer: "We recommend purchasing tickets in advance to guarantee your seats, especially during May - early October and during Christmas. Book at www.lavashow.com to check availability."
            },
            duration: {
                question: "How long does the experience last?",
                answer: {
                    classic: "45-55 minutes for Classic experience",
                    premium: "75 minutes including VIP lounge time and backstage tour"
                }
            },
            children: {
                question: "Can children attend?",
                answer: "Children aged 1-12 are welcome at the Classic Experience at a discounted rate. The Premium experience has a minimum age requirement of 13 years.",
                note: "While family-friendly, the show may not be best suited for ages 0-4 years due to the educational nature and English-language presentation. Parents are responsible for children's behavior and may need to leave if children cannot remain seated and quiet."
            }
        },
        technical_questions: {
            lava_composition: {
                question: "What is the lava made of?",
                answer: "We melt tephra from the 1918 Katla eruption. It is basaltic volcanic glass, containing 47% Silica, 14% Iron, 9% Calcium, 13% Aluminum, 4% Titanium, 5% Magnesium, 3% Sodium."
            },
            gases: {
                question: "Does the lava produce toxic gases?",
                answer: "The lava erupted over 100 years ago and has lost all gases. When melted onto ice, it produces only water vapor. We have excellent air conditioning and regularly test air quality."
            },
            temperature: {
                question: "Why heat to 1100°C?",
                answer: "While lava melts at 900°C, we heat to 1100°C to achieve the right viscosity for demonstrating natural lava flow. This temperature matches what you'd see in nature."
            },
            cleaning: {
                question: "How do you clean up the lava?",
                answer: "We use a pitchfork and steel bucket to break up and collect the lava after each show. The lava is then reused in subsequent shows. The steel slide's expansion and lava's contraction make cleanup relatively easy."
            }
        },
        accessibility: {
            wheelchair: {
                question: "Do you have wheelchair access?",
                answer: "Yes, we have wheelchair access for the Classic Show in both Reykjavik and Vik. The Premium experience in Reykjavik is not wheelchair accessible. Please email info@lavashow.com in advance to arrange assistance."
            }
        },
        transportation: {
            nearby_reykjavik: {
                question: "What other activities are nearby in Reykjavik?",
                answer: "Located in the Grandi Harbor District, nearby attractions include Whales of Iceland Exhibition, Reykjavík Maritime Museum, Marshall House art galleries, Valdís Ice Cream, and Omnom Chocolate Factory. The area is also a departure point for whale-watching tours."
            }
        }
    },
    special_services: {
        popup_shows: {
            description: "A mobile version of Lava Show using our 'traveling furnace'",
            previous_locations: [
                "On top of glaciers",
                "At eruption sites",
                "Inside dormant volcanoes",
                "Downtown London",
                "Boston"
            ],
            note: "While the amount of lava is smaller than our showrooms, this offers a unique experience in nature. Prices vary based on project complexity."
        },
        catering: {
            options: [
                {
                    name: "Sweet Delights",
                    type: "Light refreshments"
                },
                {
                    name: "Luxury Bread and Pastries",
                    type: "Light refreshments"
                },
                {
                    name: "Pizza Party",
                    type: "Main course"
                },
                {
                    name: "Smørrebrød Canapé Style",
                    type: "Light meal"
                },
                {
                    name: "Light Finger Food",
                    details: "6 pieces"
                },
                {
                    name: "Taco & Mini-Burgers",
                    details: "10 pieces"
                },
                {
                    name: "Deluxe Finger Food + Desert",
                    details: "15 pieces"
                }
            ],
            beverages: [
                "Beer",
                "Red wine",
                "White wine",
                "Sparkling wine",
                "Champagne",
                "Volcano cocktail",
                "Ginger ale",
                "Soda",
                "Sparkling water"
            ],
            note: "Drinks are not included in food package pricing"
        }
    },
    seasonal_info: {
        schedules: {
            low_season: {
                period: "November + December 1-22 + January 6-31",
                show_times: "3-4 shows daily",
                standard_times: ["13:00", "15:00", "17:00"],
                optional_time: "19:00"
            },
            medium_season: {
                period: "March + April (except Easter) + May + June + September",
                show_times: "4-5 shows daily",
                schedule: ["11:00", "13:00", "15:00", "17:00", "19:00"]
            },
            high_season: {
                period: [
                    "July",
                    "August",
                    "October",
                    "Christmas & New Years (Dec 23-Jan 5)",
                    "February",
                    "Easter week"
                ],
                show_times: "5-6 shows daily",
                schedule: ["11:00", "13:00", "15:00", "17:00", "19:00", "21:00"]
            }
        },
        reykjavik_note: "Reykjavík location has become extremely busy year-round with 6 showtimes almost every day. Planning to open second showroom in 2026 with shows every hour."
    },

    company_history: {
        founding_story: {
            inspiration: {
                year: 2010,
                event: "Founders Júlíus and Ragnhildur witnessed a mesmerizing lavafall during Fimmvörðuháls eruption",
                vision: "Create opportunity for people to safely experience real flowing lava up close"
            },
            journey: {
                personal_challenge: {
                    year: 2011,
                    event: "Two sons diagnosed with autism",
                    impact: "Sons' tenacity inspired parents to pursue their dream"
                },
                startup: {
                    year: 2016,
                    motivation: "Show their boys that dedication and hard work make anything possible"
                },
                milestones: [
                    {
                        year: 2018,
                        event: "World's first live LAVA SHOW premiered in Vík",
                        note: "Birth of third son 'Funi' (meaning 'fire' in Icelandic)"
                    },
                    {
                        year: 2022,
                        event: "Opened Reykjavík location"
                    },
                    {
                        year: 2024,
                        achievement: "Received Tripadvisor Travelers' Choice Best of the Best award"
                    }
                ]
            }
        }
    },

    extended_faq: {
        technical_details: {
            lava_science: {
                cooling_process: {
                    question: "How long does it take the lava to cool down?",
                    answer: "In our show, we break up the lava to release heat energy and collect it right after each show. Without intervention, the thickest parts would take up to 2 days to cool to room temperature. In nature, cooling time varies greatly depending on volume and thickness."
                },
                appearance: {
                    question: "Why is the lava shiny and black?",
                    answer: "Quick cooling prevents crystallization, forming basaltic volcanic glass. The shine comes from silica content, while the black color is due to volcanic minerals like iron and magnesium."
                },
                glass_properties: {
                    question: "Is your lava obsidian?",
                    answer: "No, it's Tachylite, a type of volcanic glass. Unlike obsidian (70%+ silica from Rhyolite), our lava is 47% Silica from Basalt."
                }
            },
            operational_details: {
                furnace: {
                    question: "Does the furnace run on electricity?",
                    answer: {
                        reykjavik: "Runs on methane from municipal food waste",
                        vik: "Runs on propane"
                    }
                },
                equipment: {
                    question: "What is the slide/stick made of?",
                    answer: "Made of steel with melting temperature higher than lava (1500°C). Heat doesn't travel up the rod unless left in lava for extended periods."
                }
            }
        },
        historical_info: {
            katla_eruption: {
                question: "How long did the 1918 Katla eruption last?",
                answer: "24 days, producing a massive glacial outburst flood (Jökulhlaup) that extended Iceland's coastline by about 5km/3 miles."
            },
            safety_protocols: {
                reykjavik: {
                    question: "Is there an evacuation plan for Reykjavík?",
                    answer: "We follow Civil Defence instructions. Eruptions would likely only affect parts of the city, with boat or plane evacuation possible if needed."
                },
                vik: {
                    question: "What about evacuation plans for Vík?",
                    answer: "Well-prepared evacuation processes in place, with careful monitoring by Icelandic Meteorological Office."
                }
            }
        }
    },
    travel_sector: {
        partner_policies: {
            commission_rates: {
                standard: {
                    rate: "15-18%",
                    note: "Most partners fall into this range"
                },
                bokun: {
                    rate: "20%",
                    platform: "Bókun marketplace",
                    benefits: [
                        "Direct availability checking",
                        "Immediate booking confirmation",
                        "Automated process"
                    ]
                },
                agent_platform: {
                    rate: "20%",
                    requirements: "Few weeks implementation time",
                    note: "Available for frequent partners"
                },
                manual_bookings: {
                    rate: "15%",
                    note: "For email and phone bookings due to additional manual work"
                }
            },
            payment_terms: {
                invoice_timing: "Sent on travel date",
                payment_deadline: "15 days after travel date",
                past_due: "30 days after travel date",
                example: "Travel date Jan 1, payment date Jan 15, past due Jan 30"
            }
        },
        industry_benefits: {
            complimentary_tickets: {
                eligibility: "Travel sector professionals",
                requirements: [
                    "Request from work email",
                    "1-2 business days advance notice",
                    "Include preferred date and time"
                ]
            },
            companion_discounts: {
                discount: "20% off",
                eligibility: "Family members and friends of travel sector professionals"
            }
        },
        tour_guides: {
            foc_policy: {
                description: "Free entrance for tour leaders and guides",
                conditions: "Subject to availability, approved upon arrival"
            }
        }
    },

    group_bookings: {
        target_groups: [
            "Student groups for geology education",
            "Family groups",
            "Corporate groups",
            "Tour groups",
            "Educational institutions"
        ],
        facilities_capacity: {
            reykjavik: {
                total_capacity: "118 seats",
                premium_lounge: {
                    capacity: "32 seats",
                    usage: "Can be rented for private groups and events"
                }
            },
            vik: {
                current_capacity: "50 seats",
                expansion: {
                    new_capacity: "65 seats",
                    date: "End of January 2025"
                }
            }
        },
        private_events: {
            luxury_options: {
                facility_rental: {
                    full_facility: {
                        capacity: "Up to 118 guests",
                        includes: [
                            "Access to entire facility",
                            "Welcome area access",
                            "Premium lounge access",
                            "Customizable experience"
                        ],
                        suitable_for: [
                            "VIP visitors",
                            "Luxury groups",
                            "Incentive travel",
                            "Company events",
                            "Staff groups"
                        ]
                    },
                    premium_lounge: {
                        capacity: "15-25 guests (max 32)",
                        includes: [
                            "Private lounge access",
                            "Welcome drink",
                            "Premium viewing area",
                            "Backstage access"
                        ]
                    }
                },
                add_on_services: {
                    entertainment: [
                        "Karaoke equipment",
                        "Extended hours until 23:00",
                        "Meet the founders presentation",
                        "Custom entertainment options"
                    ],
                    catering: {
                        service_levels: [
                            "Light refreshments",
                            "Full range deluxe tasting menus",
                            "Gourmet finger food",
                            "Full dinner service"
                        ],
                        timing_options: [
                            "Pre-show service",
                            "Post-show service"
                        ]
                    }
                }
            }
        },
        popup_services: {
            description: "Mobile lava show using traveling furnace",
            previous_locations: [
                "Glacier tops",
                "Active eruption sites",
                "Dormant volcanoes",
                "International cities (London, Boston)"
            ],
            notes: [
                "Smaller lava quantity than showroom demonstrations",
                "Unique nature-based experiences",
                "Premium pricing based on complexity",
                "Highly customizable experience"
            ],
            suitable_for: "High-end private customers seeking unique experiences"
        }
    },
    facility_features: {
        reykjavik: {
            show_characteristics: {
                description: "A stunning facility where every detail has been designed to stimulate all senses",
                storyline: "Focuses on area around Reykjavik and most catastrophic eruptions in Icelandic history",
                focus: "Different storyline focusing on the area around Reykjavik and the most catastrophic eruptions in Icelandic history",
                features: [
                    "Ground floor welcome area",
                    "Premium lounge on second floor",
                    "Two-level viewing experience",
                    "LAVA BAR service",
                    "Gift shop with unique lava products"
                ]
            },
            amenities: {
                arrival: {
                    parking: "Free parking on site",
                    check_in: "Ground floor reception",
                    pre_show: "Explore facility and gift store"
                },
                services: {
                    beverages: {
                        locations: ["LAVA BAR", "Premium lounge"],
                        options: [
                            "Warm drinks",
                            "Cold drinks",
                            "Alcoholic beverages"
                        ]
                    },
                    taxi: "Dedicated taxi ordering machine at reception"
                }
            }
        },
        vik: {
            show_characteristics: {
                description: "An intimate show with unique focus on local volcanic activity",
                storyline: "Focuses on local volcanoes, particularly Katla, with emphasis on evacuation protocols",
                unique_feature: "Lava pours over blocks of ice, recreating the battle of ice and fire common to local volcanoes",
                focus: "Storyline focusing on the volcanoes in the vicinity of Vik, particularly Katla volcano and local evacuation protocols"
            },
            amenities: {
                services: {
                    parking: "Free parking available",
                    gift_shop: "On-site shop with lava products"
                }
            }
        }
    },

    show_technical_details: {
        lava_process: {
            preparation: {
                initial_heating: {
                    time: "5 hours for first show",
                    temperature: "1100°C (2000°F)",
                    reason: "Achieve optimal viscosity for natural flow demonstration"
                },
                subsequent_shows: {
                    time: "1.5-2 hours between shows",
                    note: "Faster due to maintained furnace temperature"
                }
            },
            safety_systems: {
                air_management: {
                    features: [
                        "Advanced air conditioning",
                        "Heat extraction systems",
                        "Regular air quality testing"
                    ]
                },
                protective_measures: {
                    audience: "Security goggles provided",
                    viewing_distance: "Carefully calculated safe distance",
                    facility: "Purpose-built viewing areas"
                }
            },
            sustainability: {
                lava_reuse: {
                    process: [
                        "Lava collected after each show",
                        "Broken into manageable pieces",
                        "Returned to furnace",
                        "Remelted for next show"
                    ],
                    benefits: [
                        "Environmentally conscious",
                        "Resource efficient",
                        "Maintains consistent quality"
                    ]
                },
                energy_sources: {
                    reykjavik: {
                        type: "Methane",
                        source: "Municipal food waste",
                        sustainability: "Environmentally friendly energy source"
                    },
                    vik: {
                        type: "Propane",
                        efficiency: "Optimized for smaller show volume"
                    }
                }
            },
            material_properties: {
                composition: {
                    type: "Basaltic tephra",
                    source: "1918 Katla eruption",
                    form: "Volcanic glass (Tachylite)"
                },
                physical_characteristics: {
                    cooling_process: {
                        standard: "Up to 2 days for thick sections",
                        show_setting: "Accelerated through breaking process",
                        result: "Unique volcanic glass formation"
                    },
                    appearance: {
                        color: "Black due to mineral content",
                        texture: "Shiny due to rapid cooling",
                        unique_properties: "Different from obsidian due to lower silica content"
                    }
                }
            }
        }
    },
    educational_program: {
        show_content: {
            core_elements: {
                scientific_focus: {
                    topics: [
                        "Icelandic volcanism",
                        "Lava behavior in nature",
                        "Geological processes",
                        "Local volcanic history"
                    ],
                    presentation: "Expert lava master of ceremonies provides educational commentary"
                },
                location_specific: {
                    reykjavik: {
                        focus: "Catastrophic eruptions in Icelandic history",
                        regional_context: "Volcanic activity around Reykjavík",
                        historical_significance: "Impact on urban development"
                    },
                    vik: {
                        focus: "Katla volcano and local volcanic systems",
                        safety_protocols: "Community evacuation procedures",
                        geographical_context: "UNESCO Global Geopark setting"
                    }
                }
            },
            interactive_elements: {
                qa_session: "Open question and answer period with expert host",
                demonstration: "Live lava pouring and behavior observation",
                sensory_experience: [
                    "See molten lava flow",
                    "Feel intense heat radiation",
                    "Hear lava movement",
                    "Experience rapid cooling process"
                ]
            }
        },
        target_audiences: {
            students: {
                description: "Ultimate geology class experience",
                suitability: "Highly educational for school groups"
            },
            families: {
                age_considerations: {
                    recommended: "Ages 5+",
                    note: "Show includes substantial English language content",
                    guidance: "Parents responsible for child behavior during show"
                }
            },
            scientific_community: "Unique opportunity to observe controlled lava behavior"
        }
    },

    show_scheduling: {
        regular_timings: {
            reykjavik: {
                standard_slots: [
                    "10:00", "12:00", "14:00",
                    "16:00", "18:00", "20:00"
                ],
                notes: [
                    "Six shows daily most of the year",
                    "10am show may be skipped in December 1-20 and April-May"
                ],
                future_plans: "Second showroom planned for 2026 enabling hourly shows"
            },
            vik: {
                standard_slots: [
                    "13:00", "15:00", "17:00"
                ],
                additional_slots: [
                    "11:00", "19:00", "21:00"
                ],
                note: "Additional times based on season and demand"
            }
        },
        seasonal_variations: {
            low_season: {
                period: "November, December 1-22, January 6-31",
                minimum_shows: "3-4 daily",
                base_schedule: ["13:00", "15:00", "17:00", "19:00"]
            },
            medium_season: {
                period: "March, April (except Easter), May, June, September",
                shows: "4-5 daily",
                schedule: ["11:00", "13:00", "15:00", "17:00", "19:00"]
            },
            peak_season: {
                period: [
                    "July",
                    "August",
                    "October",
                    "Christmas & New Years (Dec 23-Jan 5)",
                    "February",
                    "Easter week"
                ],
                shows: "5-6 daily",
                full_schedule: [
                    "11:00", "13:00", "15:00",
                    "17:00", "19:00", "21:00"
                ]
            }
        },
        arrival_guidelines: {
            standard: {
                arrival_time: "20 minutes before show time",
                check_in: "At main reception desk",
                late_policy: {
                    grace_period: "Up to 10-13 minutes after start",
                    note: "Subject to show conditions"
                }
            },
            premium_experience: {
                arrival_time: "30 minutes before show time",
                reason: "Enjoy lounge access and welcome drink",
                activities: [
                    "Check in at reception",
                    "Access premium lounge",
                    "Receive welcome drink",
                    "Explore lava displays",
                    "Select premium viewing seats"
                ]
            }
        }
    },
    marketing_highlights: {
        unique_selling_points: {
            exclusivity: "The only live lava show in the world",
            recognition: [
                "2024 Tripadvisor Best of the Best award",
                "Multiple innovation awards",
                "Educational and cultural value recognition"
            ],
            experience_value: "One of the highest rated attractions in Iceland",
            authenticity: {
                material: "Real lava from 1918 Katla eruption",
                demonstration: "Live volcanic eruption recreation",
                cultural: "Deep connection to Icelandic geological heritage"
            }
        },
        visitor_experience: {
            sensory_elements: [
                "See molten lava up close",
                "Feel intense heat radiation",
                "Experience rapid cooling process",
                "Witness unique glass formation",
                "Interactive demonstration"
            ],
            educational_value: {
                description: "Edutainment at its best",
                elements: [
                    "Expert presentation",
                    "Volcanic science explanation",
                    "Cultural significance",
                    "Interactive Q&A sessions",
                    "Real-world geology demonstration"
                ]
            }
        },
        reviews: {
            platforms: {
                google: {
                    reykjavik: "Google reviews for Reykjavik experience",
                    vik: "Google reviews for Vík experience"
                },
                tripadvisor: {
                    reykjavik: "Tripadvisor reviews for Reykjavik experience",
                    vik: "Tripadvisor reviews for Vík location"
                }
            },
            key_highlights: [
                "World-class immersive experience",
                "Educational value",
                "Professional presentation",
                "Unique attraction",
                "Family-friendly entertainment"
            ]
        }
    },

    safety_protocols: {
        operational_safety: {
            temperature_control: {
                monitoring: "Constant temperature monitoring",
                maximum: "1100°C (2000°F)",
                safety_margins: "Carefully calculated viewing distances"
            },
            protective_equipment: {
                viewers: "Safety goggles provided",
                staff: "Specialized heat-resistant equipment",
                facility: "Purpose-built demonstration areas"
            },
            air_quality: {
                measures: [
                    "Regular air quality testing",
                    "Advanced ventilation systems",
                    "Heat extraction technology",
                    "Steam management"
                ],
                monitoring: "Continuous environmental assessment"
            }
        },
        emergency_procedures: {
            staff_training: {
                requirements: "All staff trained in safety protocols",
                competencies: [
                    "Emergency response",
                    "Crowd management",
                    "First aid",
                    "Equipment operation"
                ]
            },
            evacuation: {
                reykjavik: {
                    protocol: "Coordinated with Civil Defence",
                    options: ["Land", "Sea", "Air evacuation routes"]
                },
                vik: {
                    protocol: "Integrated with Katla evacuation plans",
                    monitoring: "Coordinated with Icelandic Meteorological Office"
                }
            }
        },
        visitor_safety: {
            guidelines: [
                "Follow staff instructions",
                "Remain in designated viewing areas",
                "Wear provided safety equipment",
                "Maintain safe distance from demonstration area"
            ],
            children_policy: {
                age_restrictions: {
                    minimum: "No strict minimum for Classic Experience",
                    premium: "13+ years for Premium Experience"
                },
                supervision: "Parents responsible for child behavior",
                note: "May need to leave if children cannot remain seated"
            }
        },
        facility_safety: {
            design_features: [
                "Purpose-built viewing areas",
                "Heat-resistant materials",
                "Emergency exits",
                "Ventilation systems"
            ],
            maintenance: {
                schedule: "Regular safety inspections",
                equipment: "Continuous monitoring of all safety systems",
                documentation: "Detailed safety records maintained"
            }
        }
    },
    operational_details: {
        show_preparation: {
            lava_heating: {
                first_show: {
                    duration: "5 hours to reach 1100°C",
                    process: "Complete heating from room temperature",
                    timing: "Early morning preparation"
                },
                subsequent_shows: {
                    duration: "1.5-2 hours between shows",
                    efficiency: "Faster due to maintained furnace temperature",
                    process: "Reheating previously used lava"
                }
            },
            maintenance: {
                cleanup: {
                    process: [
                        "Break up cooled lava",
                        "Collection using steel tools",
                        "Return to furnace for reuse",
                        "Preparation for next show"
                    ],
                    timing: "Immediate post-show cleanup",
                    equipment: {
                        tools: ["Steel pitchfork", "Steel bucket"],
                        features: "Heat-resistant materials",
                        efficiency: "Quick cleanup due to lava properties"
                    }
                }
            }
        },
        sustainability_practices: {
            material_use: {
                lava_recycling: {
                    method: "Continuous reuse of lava material",
                    benefits: [
                        "Resource efficient",
                        "Consistent quality",
                        "Minimal waste"
                    ]
                },
                energy_sources: {
                    reykjavik: {
                        type: "Methane from municipal waste",
                        sustainability: "Utilizing local food waste",
                        environmental_impact: "Reduced carbon footprint"
                    },
                    vik: {
                        type: "Propane system",
                        efficiency: "Optimized for smaller venue"
                    }
                }
            }
        },
        visitor_flow: {
            classic_experience: {
                arrival: {
                    timing: "20 minutes before show",
                    process: [
                        "Check-in at reception",
                        "Explore facility",
                        "Visit gift shop",
                        "Optional drink purchase",
                        "Safety briefing"
                    ]
                },
                show_sequence: [
                    "Educational introduction",
                    "Volcanic history film",
                    "Live lava demonstration",
                    "Interactive Q&A session"
                ]
            },
            premium_experience: {
                arrival: {
                    timing: "30 minutes before show",
                    process: [
                        "Ground floor check-in",
                        "Premium lounge access",
                        "Welcome drink service",
                        "Exhibition viewing",
                        "Premium seating selection"
                    ]
                },
                additional_features: [
                    "Balcony viewing position",
                    "Enhanced heat experience",
                    "Backstage tour",
                    "Lava gift package"
                ]
            }
        }
    },
    
    extended_visitor_info: {
        accessibility: {
            wheelchair_access: {
                reykjavik: {
                    classic: "Full wheelchair accessibility",
                    premium: "Not wheelchair accessible",
                    note: "Advance notice requested"
                },
                vik: {
                    access: "Wheelchair accessible venue",
                    requirements: "Contact in advance for assistance"
                }
            },
            languages: {
                current: "Shows conducted in English",
                future: "Real-time translation planned for late 2025"
            }
        },
        local_area: {
            reykjavik: {
                district: "Grandi Harbour District",
                nearby_attractions: [
                    {
                        name: "Whales of Iceland Exhibition",
                        type: "Natural history"
                    },
                    {
                        name: "Reykjavík Maritime Museum",
                        type: "Cultural"
                    },
                    {
                        name: "Marshall House",
                        type: "Art galleries"
                    },
                    {
                        name: "Valdís Ice Cream",
                        type: "Local favorite"
                    },
                    {
                        name: "Omnom Chocolate Factory",
                        type: "Food tourism"
                    }
                ],
                activities: [
                    "Whale watching tours",
                    "Harbor walks",
                    "Cultural exploration",
                    "Local dining"
                ]
            },
            vik: {
                location: "South Coast of Iceland",
                features: [
                    "Next to Black Beach",
                    "Katla UNESCO Global Geopark",
                    "Surrounded by volcanoes and glaciers"
                ],
                distance: "190km from Reykjavík"
            }
        }
    },
    future_developments: {
        facility_expansions: {
            reykjavik: {
                second_showroom: {
                    planned_date: "2026",
                    features: [
                        "Shows every hour",
                        "Increased capacity",
                        "Enhanced visitor flow"
                    ],
                    reason: "Meeting growing year-round demand"
                },
                current_status: "Operating at high capacity with 6 shows daily",
                current_updates: {
                    schedule: "Adding 21:00 showtime during highest summer season",
                    capacity: "Operating at high capacity with 6 shows daily"
                }
            },
            vik: {
                capacity_increase: {
                    current: "50-55 seats",
                    planned: "65 seats",
                    implementation: "End of January 2025"
                }
            },
            language_services: {
                planned: "Real-time translation system",
                implementation: "Late 2025",
                goal: "Enhanced accessibility for international visitors"
            }
        }
    },

    special_events: {
        private_shows: {
            premium_lounge: {
                capacity: {
                    optimal: "15-25 people",
                    maximum: "32 people"
                },
                included_features: [
                    "Exclusive lounge access",
                    "Welcome aperitif",
                    "Lava show souvenir",
                    "Premium balcony seating",
                    "Backstage tour"
                ],
                customization_options: {
                    duration: "Extended hours until 23:00",
                    entertainment: [
                        "Karaoke equipment rental",
                        "Founder presentations",
                        "Custom entertainment"
                    ],
                    catering: {
                        food_options: [
                            "Light refreshments",
                            "Full tasting menus",
                            "Gourmet finger food",
                            "Custom menus"
                        ],
                        beverage_service: {
                            alcoholic: [
                                "Beer selection",
                                "Wine options",
                                "Champagne",
                                "Custom cocktails"
                            ],
                            non_alcoholic: [
                                "Soft drinks",
                                "Specialty beverages",
                                "Hot drinks"
                            ]
                        }
                    },
                    staffing: "Dedicated bar service staff"
                }
            },
            full_facility: {
                capacity: "Up to 118 people",
                spaces_included: [
                    "Ground floor welcome area",
                    "Premium lounge",
                    "Main showroom",
                    "All facility amenities"
                ],
                suitable_for: [
                    "Corporate events",
                    "Large private groups",
                    "Special celebrations",
                    "VIP experiences",
                    "Luxury tour groups"
                ],
                customization_options: {
                    presentations: "Founder meet-and-greet",
                    timing: "Flexible scheduling",
                    catering: "Full-service options",
                    entertainment: "Custom programming"
                }
            }
        },
        popup_shows: {
            description: "Mobile lava demonstration using traveling furnace",
            unique_features: [
                "Portable setup",
                "Location flexibility",
                "Customizable experience"
            ],
            past_locations: [
                {
                    type: "Natural settings",
                    examples: [
                        "Glacier tops",
                        "Eruption sites",
                        "Dormant volcanoes"
                    ]
                },
                {
                    type: "International venues",
                    examples: [
                        "Downtown London",
                        "Boston"
                    ]
                }
            ],
            considerations: {
                lava_volume: "Smaller than showroom demonstrations",
                pricing: "Premium pricing based on complexity",
                target_market: "High-end private clients",
                logistics: "Requires special setup and safety measures"
            }
        }
    },
    technical_specifications: {
        lava_science: {
            material_properties: {
                composition: {
                    origin: "1918 Katla eruption basaltic tephra",
                    elements: {
                        silica: "47%",
                        iron: "14%",
                        calcium: "9%",
                        aluminum: "13%",
                        titanium: "4%",
                        magnesium: "5%",
                        sodium: "3%"
                    },
                    classification: {
                        type: "Tachylite (volcanic glass)",
                        comparison: "Different from obsidian (70%+ silica)"
                    }
                },
                behavior: {
                    melting_requirements: {
                        minimum: "900°C for initial melting",
                        optimal: "1100°C for proper flow viscosity",
                        reason: "Matches natural volcanic flow conditions"
                    },
                    cooling_process: {
                        show_setting: {
                            method: "Active breaking and collection",
                            timing: "Immediate post-show processing",
                            result: "Rapid cooling for reuse"
                        },
                        natural_process: {
                            thick_sections: "Up to 2 days to room temperature",
                            factors: [
                                "Volume dependent",
                                "Insulation effects",
                                "Environmental conditions"
                            ]
                        }
                    }
                },
                gas_properties: {
                    common_gases: [
                        "Sulfur dioxide",
                        "Hydrogen sulfide", 
                        "Carbon dioxide",
                        "Carbon monoxide",
                        "Hydrogen fluoride"
                    ],
                    safety: {
                        status: "No gas risk present",
                        explanation: "Historic material has lost all gases over time",
                        verification: "Regular air quality testing performed"
                    }
                },
                crystallization: {
                    show_process: "Rapid cooling produces volcanic glass",
                    natural_process: "Slower cooling in nature leads to rock formation",
                    comparison: "Demonstrates different cooling effects on lava"
                }
            },
            equipment_specifications: {
                furnace_systems: {
                    reykjavik: {
                        fuel: "Methane from municipal waste",
                        sustainability: "Environmentally conscious design",
                        capacity: "Larger volume for main facility"
                    },
                    vik: {
                        fuel: "Propane system",
                        design: "Optimized for smaller show volume"
                    },
                    heating_times: {
                        initial: "5 hours from cold",
                        between_shows: "1.5-2 hours"
                    }
                },
                handling_equipment: {
                    materials: "High-grade steel",
                    temperature_resistance: "Above 1500°C",
                    components: [
                        "Lava slide",
                        "Collection tools",
                        "Manipulation rods"
                    ]
                }
            }
        },
        safety_systems: {
            environmental_controls: {
                air_management: {
                    features: [
                        "Advanced ventilation",
                        "Heat extraction",
                        "Steam control",
                        "Air quality monitoring"
                    ],
                    testing: "Regular air quality assessments"
                },
                viewing_area_design: {
                    safety_features: [
                        "Calculated viewing distances",
                        "Heat-resistant barriers",
                        "Protected observation zones"
                    ],
                    protective_equipment: {
                        audience: "Safety goggles provided",
                        staff: "Full heat-protection gear"
                    }
                }
            }
        }
    },
    
    educational_materials: {
        volcanic_science: {
            basic_concepts: {
                lava_formation: {
                    natural_process: "Molten rock reaching Earth's surface",
                    show_recreation: "Controlled melting of basaltic material",
                    temperature_comparison: {
                        natural: "700-1200°C typical range",
                        show: "1100°C controlled environment"
                    }
                },
                glass_formation: {
                    process: "Rapid cooling prevents crystallization",
                    result: "Formation of volcanic glass",
                    types: {
                        show_production: "Tachylite (basaltic glass)",
                        natural_comparison: "Obsidian (rhyolitic glass)"
                    }
                }
            },
            iceland_specific: {
                geological_context: {
                    location: "Mid-Atlantic Ridge",
                    significance: "Active volcanic zone",
                    historical_events: {
                        katla_1918: {
                            duration: "24 days",
                            impact: "Coastline extension by 5km",
                            legacy: "Source material for show"
                        }
                    }
                }
            }
        }
    },
    customer_service_protocols: {
        contact_channels: {
            main_contacts: {
                phone: {
                    main: "+354 553 0005",
                    reykjavik: "+354 868 6005",
                    vik: "+354 835 6777",
                    extra: "+354 857 6005"
                },
                email: "info@lavashow.com",
                response_times: {
                    email: "Within 24 hours",
                    phone: "During operating hours"
                }
            },
            specialized_inquiries: {
                sales: {
                    contact: "jon@lavashow.com",
                    for: "Sales and marketing queries"
                },
                complaints: {
                    contact: "Madison@lavashow.com",
                    for: "Escalated issues requiring special attention"
                }
            }
        },
        booking_management: {
            individual_bookings: {
                preferred_method: "Direct booking through www.lavashow.com",
                advantages: [
                    "Real-time availability",
                    "Immediate confirmation",
                    "Secure payment processing"
                ]
            },
            group_handling: {
                process: "Direct email to info@lavashow.com",
                required_info: [
                    "Group size",
                    "Preferred date",
                    "Preferred time",
                    "Special requirements"
                ]
            },
            modification_procedures: {
                rescheduling: {
                    timing: "Subject to availability",
                    process: "Contact via email or phone",
                    requirements: "Original booking reference"
                },
                cancellations: {
                    policy: "Full refund if cancelled within 24 hours",
                    process: "Written request to info@lavashow.com"
                }
            }
        }
    },

    booking_systems: {
        online_platform: {
            website: "www.lavashow.com/tickets",
            features: {
                real_time: {
                    availability: "Live seat availability",
                    pricing: "Current rates displayed",
                    show_times: "Up-to-date schedule"
                },
                capacity_management: {
                    display: {
                        single_spot: "Shows exact number available",
                        sold_out: "Clearly marked when full"
                    },
                    walk_in_policy: "Only possible if website shows availability"
                }
            }
        },
        partner_systems: {
            bokun_marketplace: {
                commission: "20%",
                features: [
                    "Direct availability checking",
                    "Immediate booking confirmation",
                    "Automated process"
                ]
            },
            agent_platform: {
                commission: "20%",
                setup_time: "Few weeks implementation",
                requirements: "Regular booking volume"
            },
            manual_bookings: {
                commission: "15%",
                note: "Lower rate due to manual processing"
            }
        },
        payment_processing: {
            terms: {
                invoicing: {
                    timing: "Sent on travel date",
                    due_date: "15 days after travel date",
                    overdue: "30 days after travel date"
                },
                example: {
                    travel_date: "January 1",
                    payment_due: "January 15",
                    overdue_date: "January 30"
                }
            }
        }
    },
    staff_training: {
        safety_requirements: {
            core_competencies: [
                "Lava handling procedures",
                "Emergency protocols",
                "Safety equipment operation",
                "Air quality monitoring",
                "Evacuation procedures"
            ],
            show_operations: {
                demonstration: "Safe lava pouring techniques",
                audience_management: "Crowd control and positioning",
                equipment_handling: "Proper use of safety gear"
            }
        },
        customer_service: {
            communication_standards: {
                languages: "English proficiency required",
                presentation: "Educational content delivery",
                interaction: "Audience engagement protocols"
            },
            knowledge_requirements: {
                geological: "Basic volcanic science",
                historical: "Icelandic volcanic history",
                local: {
                    reykjavik: "Capital region volcanic impact",
                    vik: "Katla volcano information"
                }
            }
        }
    },

    seasonal_operations: {
        peak_season_management: {
            periods: [
                "July and August",
                "October",
                "Christmas & New Years (Dec 23-Jan 5)",
                "February",
                "Easter week"
            ],
            adjustments: {
                scheduling: "Maximum 6 shows daily",
                staffing: "Increased personnel",
                capacity: "Optional additional seating"
            }
        },
        low_season_operations: {
            periods: [
                "November",
                "December 1-22",
                "January 6-31"
            ],
            modifications: {
                scheduling: "3-4 shows daily",
                resource_optimization: "Adjusted staff levels",
                maintenance: "Enhanced facility upkeep period"
            }
        }
    },
    marketing_strategies: {
        brand_positioning: {
            unique_features: [
                "World's only live lava show",
                "Award-winning experience",
                "Educational entertainment",
                "Authentic Icelandic geology"
            ],
            target_audiences: {
                tourists: "Must-visit Icelandic attraction",
                educational_groups: "Ultimate geology class",
                corporate: "Unique event venue",
                luxury_market: "Premium volcanic experience"
            },
            promotional_messaging: {
                taglines: [
                    "Feel the Heat of Red-Hot Lava",
                    "Where the sea meets the sky",
                    "A world-class immersive experience"
                ]
            }
        },
        travel_sector_engagement: {
            benefits: {
                complimentary_visits: {
                    eligibility: "Travel sector professionals",
                    process: "Work email verification",
                    advance_notice: "1-2 business days"
                },
                discounts: {
                    rate: "20% for family and friends",
                    application: "Must be requested in advance"
                },
                tour_guides: "Free entrance subject to availability"
            },
            partnerships: {
                commissions: {
                    standard: "15-18%",
                    automated: "20% for Bókun marketplace users",
                    platform: "20% for agent platform users"
                }
            }
        },
        gift_promotions: {
            cards: {
                discount_code: "LAVAGJOF",
                savings: "10% on gift cards",
                validity: "Until December 31, 2024"
            }
        }
    },

    quality_control: {
        experience_monitoring: {
            show_quality: {
                checkpoints: [
                    "Lava temperature maintenance",
                    "Demonstration clarity",
                    "Educational content delivery",
                    "Safety protocol adherence",
                    "Timing precision"
                ],
                feedback_collection: {
                    methods: [
                        "Direct customer feedback",
                        "Online reviews monitoring",
                        "Post-visit surveys"
                    ]
                }
            },
            facility_maintenance: {
                daily_checks: [
                    "Equipment functionality",
                    "Safety systems",
                    "Viewing areas",
                    "Climate control",
                    "Cleanliness standards"
                ],
                technical_maintenance: {
                    furnace: "Regular performance monitoring",
                    ventilation: "Air quality testing",
                    safety_equipment: "Daily inspection"
                }
            }
        },
        service_standards: {
            customer_interaction: {
                arrival: {
                    greeting: "Consistent welcome procedure",
                    information: "Clear direction provision",
                    timing: "Punctual show commencement"
                },
                during_show: {
                    engagement: "Interactive presentation",
                    safety: "Continuous monitoring",
                    comfort: "Temperature management"
                }
            },
            special_requirements: {
                accessibility: "Advance arrangement support",
                group_handling: "Coordinated entrance and seating",
                premium_service: "VIP protocol adherence"
            }
        }
    },

    emergency_procedures: {
        volcanic_activity: {
            reykjavik_protocol: {
                monitoring: "Coordination with Civil Defence",
                evacuation_options: [
                    "Land routes",
                    "Maritime evacuation",
                    "Aerial transport if needed"
                ],
                communication: "Clear visitor guidance"
            },
            vik_protocol: {
                katla_monitoring: "Coordination with Met Office",
                evacuation_routes: "Pre-planned escape paths",
                staff_training: "Regular evacuation drills"
            }
        },
        facility_emergencies: {
            response_protocols: {
                equipment_failure: "Backup systems activation",
                medical_emergencies: "First aid procedures",
                facility_issues: "Immediate response plans"
            },
            communication_chain: {
                internal: "Staff alert system",
                external: "Emergency services contact",
                visitor: "Clear announcement protocols"
            }
        }
    }
};

// Enhanced getRelevantKnowledge function
export const getRelevantKnowledge = (userMessage, context = null) => {
    const message = userMessage.toLowerCase();
    
    // Expand the message with synonyms
    const expandedMessage = expandTerms(message);
    console.log('\n🔎 Expanded Message:', expandedMessage);
    
    // Classify the query type
    const queryClassification = classifyQuery(expandedMessage);
    console.log('\n🔍 Query Classification:', queryClassification);
    
    let relevantInfo = [];

    // General information and overview
    if (expandedMessage.includes('what is') || 
        expandedMessage.includes('tell me about') || 
        expandedMessage.includes('overview') ||
        expandedMessage.includes('lava show') ||
        expandedMessage.includes('explain') ||
        expandedMessage.includes('description')) {
        relevantInfo.push({
            type: 'general_info',
            content: knowledgeBase.general_info,
            priority: 5
        });

        // If asking about awards or recognition
        if (expandedMessage.includes('award') || 
            expandedMessage.includes('review') || 
            expandedMessage.includes('rating') ||
            expandedMessage.includes('tripadvisor')) {
            relevantInfo.push({
                type: 'marketing_highlights',
                content: knowledgeBase.marketing_highlights,
                priority: 6
            });
        }
    }

    // Location and getting there
    if (expandedMessage.includes('where') || 
        expandedMessage.includes('location') ||
        expandedMessage.includes('address') ||
        expandedMessage.includes('reykjavik') ||
        expandedMessage.includes('vik') ||
        expandedMessage.includes('direction') ||
        expandedMessage.includes('how to get') ||
        expandedMessage.includes('getting there') ||
        expandedMessage.includes('find you')) {
        
        // Use the original reference to maintain type safety
        relevantInfo.push({
            type: 'general_info',
            content: knowledgeBase.general_info.locations,
            priority: 8
        });
        
        // Add location-specific map links as a separate item
        if (expandedMessage.includes('reykjavik') || expandedMessage.includes('reykjavík')) {
            relevantInfo.push({
                type: 'location_link_reykjavik',
                content: "[View Reykjavík Location on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+Fiskisl%C3%B3%C3%B0+73+101+Reykjav%C3%ADk/@64.1569653,-21.9430121,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48d6757d1ade5e2d:0x69b61da06072064f!2m2!1d-21.9429663!2d64.1569391)",
                priority: 9
            });
            
            relevantInfo.push({
                type: 'booking_link_reykjavik',
                content: "[Book Reykjavík Experience](https://www.lavashow.com/reykjavik)",
                priority: 9
            });
        } 
        else if (expandedMessage.includes('vik') || expandedMessage.includes('vík')) {
            relevantInfo.push({
                type: 'location_link_vik',
                content: "[View Vík Location on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+in+V%C3%ADk+V%C3%ADkurbraut+5+870+870+Vik/@63.4183709,-19.0101997,14z/data=!4m5!4m4!1m0!1m2!1s0x48d74b1db5e98aa1:0xa197ddd0bfc5ebf1)",
                priority: 9
            });
            
            relevantInfo.push({
                type: 'booking_link_vik',
                content: "[Book Vík Experience](https://www.lavashow.com/vik)",
                priority: 9
            });
        }
        else {
            // For general location queries, add both map links
            relevantInfo.push({
                type: 'location_links',
                content: {
                    reykjavik: "[View Reykjavík Location on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+Fiskisl%C3%B3%C3%B0+73+101+Reykjav%C3%ADk/@64.1569653,-21.9430121,13z/data=!4m8!4m7!1m0!1m5!1m1!1s0x48d6757d1ade5e2d:0x69b61da06072064f!2m2!1d-21.9429663!2d64.1569391)",
                    vik: "[View Vík Location on Google Maps 📍](https://www.google.com/maps/dir//Lava+Show+in+V%C3%ADk+V%C3%ADkurbraut+5+870+870+Vik/@63.4183709,-19.0101997,14z/data=!4m5!4m4!1m0!1m2!1s0x48d74b1db5e98aa1:0xa197ddd0bfc5ebf1)"
                },
                priority: 8
            });
        }

        // If asking about nearby attractions
        if (expandedMessage.includes('area') || 
            expandedMessage.includes('nearby') || 
            expandedMessage.includes('around') ||
            expandedMessage.includes('close to')) {
            relevantInfo.push({
                type: 'extended_visitor_info',
                content: knowledgeBase.extended_visitor_info.local_area,
                priority: 7
            });
        }
    }

    // Technical and educational content
    if (expandedMessage.includes('how') || 
        expandedMessage.includes('work') ||
        expandedMessage.includes('temperature') ||
        expandedMessage.includes('heat') ||
        expandedMessage.includes('lava') ||
        expandedMessage.includes('melt') ||
        expandedMessage.includes('science') ||
        expandedMessage.includes('learn') ||
        expandedMessage.includes('explain')) {
        relevantInfo.push({
            type: 'educational_content',
            content: knowledgeBase.educational_content,
            priority: 7
        });
        
        relevantInfo.push({
            type: 'show_technical_details',
            content: knowledgeBase.show_technical_details,
            priority: 6
        });

        // If asking about the furnace or equipment
        if (expandedMessage.includes('furnace') || 
            expandedMessage.includes('equipment') || 
            expandedMessage.includes('clean') ||
            expandedMessage.includes('slide') ||
            expandedMessage.includes('tool')) {
            relevantInfo.push({
                type: 'technical_specifications',
                content: knowledgeBase.technical_specifications,
                priority: 8
            });
        }
    }

    // Safety and protocols
    if (expandedMessage.includes('safe') || 
        expandedMessage.includes('security') ||
        expandedMessage.includes('danger') ||
        expandedMessage.includes('risk') ||
        expandedMessage.includes('protect') ||
        expandedMessage.includes('emergency') ||
        expandedMessage.includes('evacuation')) {
        relevantInfo.push({
            type: 'safety_protocols',
            content: knowledgeBase.safety_protocols,
            priority: 9  // High priority for safety information
        });

        // If asking about emergency procedures
        if (expandedMessage.includes('emergency') || 
            expandedMessage.includes('evacuation') || 
            expandedMessage.includes('procedure')) {
            relevantInfo.push({
                type: 'emergency_procedures',
                content: knowledgeBase.emergency_procedures,
                priority: 10  // Highest priority for emergencies
            });
        }
    }

    // Experiences and packages
    if (expandedMessage.includes('experience') || 
        expandedMessage.includes('package') ||
        expandedMessage.includes('classic') ||
        expandedMessage.includes('premium') ||
        expandedMessage.includes('saman') ||
        expandedMessage.includes('ser') ||
        expandedMessage.includes('sér') ||
        expandedMessage.includes('ticket') ||
        expandedMessage.includes('admission')) {
        
        // Use the original reference to maintain type safety
        relevantInfo.push({
            type: 'experiences',
            content: knowledgeBase.experiences,
            priority: 8
        });
        
        // Add booking links as separate items
        relevantInfo.push({
            type: 'experience_links',
            content: {
                classic: "[Book Classic Experience](https://www.lavashow.com/tickets)",
                premium: "[Book Premium Experience](https://www.lavashow.com/tickets)"
            },
            priority: 8
        });

        // If asking about pricing or booking
        if (expandedMessage.includes('price') || 
            expandedMessage.includes('cost') || 
            expandedMessage.includes('book') ||
            expandedMessage.includes('reserve')) {
            
            // Add original booking policies
            relevantInfo.push({
                type: 'booking_policies',
                content: knowledgeBase.booking_policies,
                priority: 7
            });
            
            // Add a direct booking link as a high priority item
            relevantInfo.push({
                type: 'booking_link',
                content: "Ready to experience the world's only live lava show? [Book Now](https://www.lavashow.com/tickets)",
                priority: 9
            });
        }
    }

    // Group bookings and private events
    if (expandedMessage.includes('group') || 
        expandedMessage.includes('private') ||
        expandedMessage.includes('corporate') ||
        expandedMessage.includes('company') ||
        expandedMessage.includes('team') ||
        expandedMessage.includes('school') ||
        expandedMessage.includes('event')) {
        relevantInfo.push({
            type: 'group_bookings',
            content: knowledgeBase.group_bookings,
            priority: 8
        });

        // If asking about catering or special services
        if (expandedMessage.includes('food') || 
            expandedMessage.includes('drink') || 
            expandedMessage.includes('cater') ||
            expandedMessage.includes('menu')) {
            relevantInfo.push({
                type: 'special_services',
                content: knowledgeBase.special_services.catering,
                priority: 7
            });
        }
    }

    // Gift shop and souvenirs
    if (expandedMessage.includes('gift') || 
        expandedMessage.includes('souvenir') ||
        expandedMessage.includes('shop') ||
        expandedMessage.includes('buy') ||
        expandedMessage.includes('merchandise') ||
        expandedMessage.includes('lava shard')) {
        relevantInfo.push({
            type: 'gift_shop',
            content: knowledgeBase.gift_shop,
            priority: 8
        });
    }

    // Gift cards (ADD THIS NEW SECTION HERE)
    if (expandedMessage.includes('gift card') || 
        expandedMessage.includes('gift certificate') ||
        expandedMessage.includes('gift ticket') ||
        expandedMessage.includes('present card') ||
        expandedMessage.includes('give as gift') ||
        expandedMessage.includes('buy gift') ||
        expandedMessage.includes('purchase gift')) {
        
        // Add gift card information if available in gift_shop
        if (knowledgeBase.gift_shop && knowledgeBase.gift_shop.gift_cards) {
            relevantInfo.push({
                type: 'gift_cards',
                content: knowledgeBase.gift_shop.gift_cards,
                priority: 8
            });
        }
        
        // Add gift card purchase link
        relevantInfo.push({
            type: 'gift_card_link',
            content: "Give the gift of an unforgettable volcanic experience. [Purchase Gift Cards](https://www.lavashow.com/giftcard)",
            priority: 9
        });
    }    

    // Opening hours and timing
    if (expandedMessage.includes('open') || 
        expandedMessage.includes('hour') || 
        expandedMessage.includes('time') ||
        expandedMessage.includes('close') ||
        expandedMessage.includes('slot') ||
        expandedMessage.includes('when') ||
        expandedMessage.includes('schedule') ||
        expandedMessage.includes('weekend') ||
        expandedMessage.includes('weekday') ||
        expandedMessage.includes('today') ||
        expandedMessage.includes('tomorrow') ||
        expandedMessage.includes('morning') ||
        expandedMessage.includes('evening') ||
        expandedMessage.includes('afternoon') ||
        // Month specific
        expandedMessage.includes('january') ||
        expandedMessage.includes('february') ||
        expandedMessage.includes('march') ||
        expandedMessage.includes('april') ||
        expandedMessage.includes('may') ||
        expandedMessage.includes('june') ||
        expandedMessage.includes('july') ||
        expandedMessage.includes('august') ||
        expandedMessage.includes('september') ||
        expandedMessage.includes('october') ||
        expandedMessage.includes('november') ||
        expandedMessage.includes('december') ||
        // Holiday specific
        expandedMessage.includes('holiday') ||
        expandedMessage.includes('christmas') ||
        expandedMessage.includes('new year')) {
        
        relevantInfo.push({
            type: 'show_scheduling',
            content: knowledgeBase.show_scheduling,
            priority: 8
        });

        relevantInfo.push({
            type: 'seasonal_info',
            content: knowledgeBase.seasonal_info,
            priority: 7
        });

        // If asking about specific seasons
        if (expandedMessage.includes('season') || 
            expandedMessage.includes('summer') || 
            expandedMessage.includes('winter')) {
            relevantInfo.push({
                type: 'seasonal_operations',
                content: knowledgeBase.seasonal_operations,
                priority: 8
            });
        }
    }

    // Booking modifications and late arrivals
    if (expandedMessage.includes('late') || 
        expandedMessage.includes('delay') ||
        expandedMessage.includes('miss') ||
        expandedMessage.includes('change') ||
        expandedMessage.includes('modify') ||
        expandedMessage.includes('cancel') ||
        expandedMessage.includes('refund') ||
        expandedMessage.includes('reschedule') ||
        expandedMessage.includes('another time')) {
        
        relevantInfo.push({
            type: 'booking_management',
            content: knowledgeBase.customer_service_protocols.booking_management,
            priority: 8
        });

        relevantInfo.push({
            type: 'arrival',
            content: knowledgeBase.booking_policies.arrival,
            priority: 7
        });
    }

    // Travel sector and agent relationships
    if (expandedMessage.includes('agent') || 
        expandedMessage.includes('guide') ||
        expandedMessage.includes('tour operator') ||
        expandedMessage.includes('partner') ||
        expandedMessage.includes('commission') ||
        expandedMessage.includes('resell') ||
        expandedMessage.includes('bokun') ||
        expandedMessage.includes('trade') ||
        expandedMessage.includes('industry')) {
        
        relevantInfo.push({
            type: 'travel_sector',
            content: knowledgeBase.travel_sector,
            priority: 8
        });

        if (expandedMessage.includes('commission') || 
            expandedMessage.includes('payment') || 
            expandedMessage.includes('invoice')) {
            relevantInfo.push({
                type: 'payment_terms',
                content: knowledgeBase.travel_sector.partner_policies.payment_terms,
                priority: 9
            });
        }
    }

    // Accessibility and languages
    if (expandedMessage.includes('wheelchair') || 
        expandedMessage.includes('accessible') ||
        expandedMessage.includes('disability') ||
        expandedMessage.includes('handicap') ||
        expandedMessage.includes('special need') ||
        expandedMessage.includes('language') ||
        expandedMessage.includes('english') ||
        expandedMessage.includes('translation') ||
        expandedMessage.includes('understand')) {
        
        relevantInfo.push({
            type: 'accessibility',
            content: knowledgeBase.extended_visitor_info.accessibility,
            priority: 8
        });
    }

    // Children and age restrictions
    if (expandedMessage.includes('child') || 
        expandedMessage.includes('kid') ||
        expandedMessage.includes('age') ||
        expandedMessage.includes('young') ||
        expandedMessage.includes('family') ||
        expandedMessage.includes('baby') ||
        expandedMessage.includes('minimum') ||
        expandedMessage.includes('restriction') ||
        expandedMessage.includes('allowed')) {
        
        relevantInfo.push({
            type: 'children_policy',
            content: knowledgeBase.safety_protocols.visitor_safety.children_policy,
            priority: 8
        });

        relevantInfo.push({
            type: 'family_info',
            content: knowledgeBase.educational_program.target_audiences.families,
            priority: 7
        });
    }

    // Pop-up shows and special events
    if (expandedMessage.includes('popup') || 
        expandedMessage.includes('pop-up') ||
        expandedMessage.includes('pop up') ||
        expandedMessage.includes('mobile') ||
        expandedMessage.includes('travel') ||
        expandedMessage.includes('outside') ||
        expandedMessage.includes('special event') ||
        expandedMessage.includes('custom')) {
        
        relevantInfo.push({
            type: 'popup_shows',
            content: knowledgeBase.special_services.popup_shows,
            priority: 8
        });

        if (expandedMessage.includes('private') || expandedMessage.includes('exclusive')) {
            relevantInfo.push({
                type: 'special_events',
                content: knowledgeBase.special_events,
                priority: 7
            });
        }
    }

    // Quality and maintenance
    if (expandedMessage.includes('quality') || 
        expandedMessage.includes('maintenance') ||
        expandedMessage.includes('clean') ||
        expandedMessage.includes('safety') ||
        expandedMessage.includes('check') ||
        expandedMessage.includes('standard') ||
        expandedMessage.includes('monitor')) {
        
        relevantInfo.push({
            type: 'quality_control',
            content: knowledgeBase.quality_control,
            priority: 6
        });

        relevantInfo.push({
            type: 'operational_details',
            content: knowledgeBase.operational_details,
            priority: 5
        });
    }

    // FAQ handling
    if (relevantInfo.length === 0) {
        // Check FAQs for matching questions
        Object.entries(knowledgeBase.faq).forEach(([category, questions]) => {
            Object.values(questions).forEach(qa => {
                if (qa.question && expandedMessage.includes(qa.question.toLowerCase())) {
                    relevantInfo.push({
                        type: 'faq',
                        content: { [category]: { [qa.question]: qa.answer } },
                        priority: 8
                    });
                }
            });
        });

        // Check extended FAQs
        Object.entries(knowledgeBase.extended_faq).forEach(([category, subcategories]) => {
            Object.values(subcategories).forEach(qa => {
                if (qa.question && expandedMessage.includes(qa.question.toLowerCase())) {
                    relevantInfo.push({
                        type: 'extended_faq',
                        content: { [category]: { [qa.question]: qa.answer } },
                        priority: 8
                    });
                }
            });
        });
    }

    // Use context to enhance results if available
    if (context) {
        // Prioritize information based on conversation history
        if (context.conversation?.lastQueryType) {
            // Boost priority of content related to previous query
            relevantInfo.forEach(info => {
                if (info.type === context.conversation.lastQueryType) {
                    info.priority += 2;
                }
            });
        }
        
        // Add booking information if we have partial booking details
        if (context.bookingInfo && (context.bookingInfo.groupSize || 
                                     context.bookingInfo.preferredDate || 
                                     context.bookingInfo.packageType)) {
            const hasPricing = relevantInfo.some(info => 
                info.type === 'experiences' || info.type === 'booking_policies');
                
            if (!hasPricing) {
                relevantInfo.push({
                    type: 'experiences',
                    content: knowledgeBase.experiences,
                    priority: 6,
                    context: 'Based on your previous questions about booking'
                });
            }
        }
        
        // Add information based on user interests
        if (context.userPreferences?.interests?.length > 0) {
            context.userPreferences.interests.forEach(interest => {
                if (interest === 'science' && !relevantInfo.some(info => info.type === 'educational_content')) {
                    relevantInfo.push({
                        type: 'educational_content',
                        content: knowledgeBase.educational_content,
                        priority: 5,
                        context: 'Based on your interest in volcanic science'
                    });
                }
                
                if (interest === 'safety' && !relevantInfo.some(info => info.type === 'safety_protocols')) {
                    relevantInfo.push({
                        type: 'safety_protocols',
                        content: knowledgeBase.safety_protocols,
                        priority: 5,
                        context: 'Based on your interest in safety measures'
                    });
                }
                
                // Add more interest-based information as needed
            });
        }
    }

    // Sort by priority if we have priority values
    if (relevantInfo.length > 0 && relevantInfo[0].priority !== undefined) {
        relevantInfo.sort((a, b) => b.priority - a.priority);
    }

    return {
        relevantInfo: relevantInfo,
        queryType: queryClassification.type
    };
};