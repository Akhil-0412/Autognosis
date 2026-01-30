import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });

        if (!profile) {
            return NextResponse.json({ queryCount: 0, isPro: false });
        }

        const isPro = profile.subscription?.status === 'active';

        // Check if count needs reset (for display purposes, though API handles it)
        const now = new Date();
        const lastDate = profile.lastQueryDate ? new Date(profile.lastQueryDate) : new Date(0);
        let queryCount = profile.queryCount;

        if (now.toDateString() !== lastDate.toDateString()) {
            queryCount = 0;
        }

        return NextResponse.json({
            firstName: profile.firstName,
            queryCount,
            isPro,
            subscription: profile.subscription
        });

    } catch (error) {
        console.error("[PROFILE_GET_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
