export const runtime = "nodejs"; // or 'edge' if you prefer

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { rideSearchTool } from "../ai/tools/rideSearch";

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

const SYSTEM = `You are RidePlus's AI assistant for ride sharing.

CRITICAL RULES:
1. When users ask for rides, transportation, or travel - ALWAYS search for rides first
2. ALWAYS include results in a RIDES_JSON code block, even if empty
3. Never provide ride suggestions without searching

SEARCH BEHAVIOR:
- Extract location names, dates, seats, and service preferences from user queries
- Use place names like "Noida", "Gurgaon", "airport" for location searches
- Convert time references: "tonight" → "evening", "tomorrow morning" → "morning"
- Default to 1 seat if not specified

EXAMPLES:

User: "rides near Noida tonight 2 seats"
→ Search with: toPlace="Noida", window="evening", seats=2
→ Return: "Found 3 rides near Noida tonight! Here are your options:

\`\`\`RIDES_JSON
[{"id":"123","fromText":"Gurgaon","toText":"Noida","when":"2024-01-15T20:00:00Z","service":"UBER","perSeat":150,"seatsLeft":2,"owner":"John"}]
\`\`\`"

User: "I need to go to airport tomorrow morning"
→ Search with: toPlace="airport", date="tomorrow", window="morning"
→ Always include RIDES_JSON block

User: "near me" without coordinates
→ Ask: "Please share your location or tell me which area you're in, then I'll find rides for you!"

User: "2 seats Uber"
→ Search with: seats=2, service="UBER"
→ Always include RIDES_JSON block

RESPONSE FORMAT:
- Always end with a RIDES_JSON code block containing the search results
- Be friendly and helpful
- If no rides found, still include empty RIDES_JSON: []
- Suggest filters or alternatives if needed`;

export async function POST(req: NextRequest) {
    const { messages } = await req.json(); // [{role,content}]

    // Check if the last message is asking for rides
    const lastMessage = messages[messages.length - 1];
    const isRideQuery = lastMessage &&
        typeof lastMessage.content === 'string' &&
        /ride|go to|from|to|near|seats|tomorrow|tonight|morning|evening|airport|uber|ola/i.test(lastMessage.content);

    let responseText = "";

    if (isRideQuery) {
        // Extract search parameters from the message
        const content = lastMessage.content.toLowerCase();
        const searchParams: {
            seats?: number;
            service?: string;
            window?: string;
            date?: string;
            toPlace?: string;
            fromPlace?: string;
        } = {};

        // Extract seats
        const seatsMatch = content.match(/(\d+)\s*seats?/);
        if (seatsMatch) searchParams.seats = parseInt(seatsMatch[1]);

        // Extract service
        if (content.includes('uber')) searchParams.service = 'UBER';
        if (content.includes('ola')) searchParams.service = 'OLA';

        // Extract time window
        if (content.includes('morning')) searchParams.window = 'morning';
        if (content.includes('afternoon')) searchParams.window = 'afternoon';
        if (content.includes('evening') || content.includes('tonight')) searchParams.window = 'evening';

        // Extract date
        if (content.includes('tomorrow')) searchParams.date = 'tomorrow';
        if (content.includes('today')) searchParams.date = 'today';

        // Extract location (simple keyword matching)
        const locationKeywords = ['noida', 'gurgaon', 'delhi', 'airport', 'office'];
        for (const keyword of locationKeywords) {
            if (content.includes(keyword)) {
                if (content.includes('to') || content.includes('go to')) {
                    searchParams.toPlace = keyword;
                } else {
                    searchParams.fromPlace = keyword;
                }
            }
        }

        try {
            const rides = await rideSearchTool(searchParams);

            if (rides.length > 0) {
                responseText = `Found ${rides.length} ride${rides.length > 1 ? 's' : ''} for your search! Check the results below:

\`\`\`RIDES_JSON
${JSON.stringify(rides, null, 2)}
\`\`\``;
            } else {
                responseText = `No rides found for your search criteria. Try adjusting your location, time, or seat requirements.

\`\`\`RIDES_JSON
[]
\`\`\``;
            }
        } catch {
            responseText = `I encountered an issue while searching for rides. Please try again with more specific details.

\`\`\`RIDES_JSON
[]
\`\`\``;
        }
    } else {
        // Use LLM for non-ride queries
        const result = await streamText({
            model: openrouter("openai/gpt-oss-20b:free"),
            system: SYSTEM,
            messages,
        });

        // Convert stream to text
        const chunks: string[] = [];
        for await (const chunk of result.textStream) {
            chunks.push(chunk);
        }
        responseText = chunks.join('');
    }

    return new Response(responseText, {
        headers: { "Content-Type": "text/plain" },
    });
}
