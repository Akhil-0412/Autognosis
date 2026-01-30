import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check Usage Limit
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (profile) {
            const isPro = profile.subscription?.status === 'active';
            const now = new Date();
            const lastDate = profile.lastQueryDate ? new Date(profile.lastQueryDate) : new Date(0);

            // Reset count if it's a new day
            if (now.toDateString() !== lastDate.toDateString()) {
                await prisma.profile.update({
                    where: { id: userId },
                    data: { queryCount: 0, lastQueryDate: now }
                });
                profile.queryCount = 0;
            }

            // Enforce Limit (10 queries for free tier)
            if (!isPro && profile.queryCount >= 10) {
                return NextResponse.json({
                    error: "Daily limit reached",
                    limitReached: true,
                    message: "You have reached your daily limit of 10 diagnostics. Please upgrade to Pro for unlimited access."
                }, { status: 403 });
            }

            // Increment count
            await prisma.profile.update({
                where: { id: userId },
                data: {
                    queryCount: { increment: 1 },
                    lastQueryDate: now
                }
            });
        }

        const body = await req.json();
        const { query, make, model, year, mileage, history } = body;

        // Forward to Python Backend
        try {
            const aiServiceUrl = process.env.AI_BACKEND_URL || "http://localhost:8000";
            const pythonRes = await fetch(`${aiServiceUrl}/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    make,
                    model,
                    year,
                    mileage,
                    history: history || []
                }),
            });

            if (!pythonRes.ok) {
                const errorText = await pythonRes.text();
                console.error("[PYTHON_API_ERROR]", errorText);
                return new NextResponse(`AI Service Error: ${errorText}`, { status: pythonRes.status });
            }

            const data = await pythonRes.json();
            return NextResponse.json(data);

        } catch (fetchError) {
            console.error("[PYTHON_CONN_ERROR]", fetchError);
            return new NextResponse("Failed to connect to AI Service. Is it running on port 8000?", { status: 503 });
        }

    } catch (error) {
        console.error("[ADVISOR_PROXY_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
