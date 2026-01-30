import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

// GET /api/vehicles/[id] - Get a single vehicle
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const vehicle = await prisma.vehicle.findFirst({
            where: { id, userId },
        });

        if (!vehicle) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Error fetching vehicle:", error);
        return NextResponse.json({ error: "Failed to fetch vehicle" }, { status: 500 });
    }
}

// PATCH /api/vehicles/[id] - Update a vehicle (including health)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Verify ownership
        const existing = await prisma.vehicle.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        // Build update data
        const updateData: Record<string, unknown> = {};
        if (body.make !== undefined) updateData.make = body.make;
        if (body.model !== undefined) updateData.model = body.model;
        if (body.year !== undefined) updateData.year = parseInt(body.year);
        if (body.mileage !== undefined) updateData.mileage = body.mileage ? parseInt(body.mileage) : null;
        if (body.vin !== undefined) updateData.vin = body.vin || null;
        if (body.color !== undefined) updateData.color = body.color || null;
        if (body.healthScore !== undefined) updateData.healthScore = parseInt(body.healthScore);
        if (body.healthNote !== undefined) updateData.healthNote = body.healthNote || null;
        if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error("Error updating vehicle:", error);
        return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 });
    }
}

// DELETE /api/vehicles/[id] - Delete a vehicle
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existing = await prisma.vehicle.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
        }

        await prisma.vehicle.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 });
    }
}
