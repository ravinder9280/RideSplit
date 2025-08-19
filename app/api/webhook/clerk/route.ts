import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Your instantiated Prisma client

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Handle only specific event types
        if (type !== "user.created") {
            return NextResponse.json({ message: `Ignored event type: ${type}` }, { status: 200 });
        }

        const { first_name, last_name, email_addresses, profile_image_url, id: clerkId } = data;

        const email = Array.isArray(email_addresses) && email_addresses.length > 0
            ? email_addresses[0]?.email_address
            : null;

        if (!email) {
            return NextResponse.json({ error: "Missing or invalid email address" }, { status: 400 });
        }

        // Create or update the user, including clerkId
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                firstName: first_name || null,
                lastName: last_name || null,
                name: [first_name, last_name].filter(Boolean).join(" ") || email,
                imageUrl: profile_image_url || null,
                clerkId: clerkId, // <-- ensure it's updated
            },
            create: {
                email,
                firstName: first_name || null,
                lastName: last_name || null,
                name: [first_name, last_name].filter(Boolean).join(" ") || email,
                imageUrl: profile_image_url || null,
                clerkId: clerkId, // <-- ensure it's created
            },
        });

        console.log("User synced:", user);
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Webhook error:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}