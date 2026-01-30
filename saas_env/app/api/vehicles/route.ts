import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

// GET /api/vehicles - List all vehicles for the current user
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const vehicles = await prisma.vehicle.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(vehicles);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
    }
}

// POST /api/vehicles - Create a new vehicle
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { make, model, year, mileage, vin, color, healthScore, healthNote, imageUrl } = body;

        if (!make || !model || !year) {
            return NextResponse.json(
                { error: "Make, model, and year are required" },
                { status: 400 }
            );
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                make,
                model,
                year: parseInt(year),
                mileage: mileage ? parseInt(mileage) : null,
                vin: vin || null,
                color: color || null,
                healthScore: healthScore ? parseInt(healthScore) : 100,
                healthNote: healthNote || null,
                imageUrl: imageUrl || null,
                userId,
            },
        });

        return NextResponse.json(vehicle, { status: 201 });
    } catch (error) {
        console.error("Error creating vehicle:", error);
        return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 });
    }
}
