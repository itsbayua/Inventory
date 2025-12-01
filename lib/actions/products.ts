"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../auth";
import prisma from "../prisma";
import z from "zod";

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.coerce.number().nonnegative("Price must be greater than 0"),
    quantity: z.coerce.number().int().min(0, "Quantity must be non-negative"),
    sku: z.string().optional(),
    lowStockAt: z.union([z.coerce.number().int().min(0), z.null()]).optional(),
});

export async function deleteProduct(formData: FormData) {
    const user = await getCurrentUser();
    const id = String(formData.get("id") || "");

    await prisma.product.deleteMany({
        where: {
            id,
            userId: user.id,
        },
    });
}

export async function createProduct(formData: FormData) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const parsed = productSchema.safeParse({
        name: formData.get("name"),
        price: formData.get("price"),
        quantity: formData.get("quantity"),
        sku: formData.get("sku") || undefined,
        lowStockAt:
            formData.get("lowStockAt") === ""
                ? null
                : formData.get("lowStockAt"),
    });

    if (!parsed.success) {
        console.error(parsed.error);
        throw new Error("Validation failed");
    }

    try {
        await prisma.product.create({
            data: {
                ...parsed.data,
                userId: user.id,
            },
        });

        redirect("/inventory");
    } catch (error) {
        console.error("🔥 Prisma Error Detail:", error);
        throw error;
    }
}
