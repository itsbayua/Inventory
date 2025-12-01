import ProductsChart from "@/components/products-chart";
import Sidebar from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TrendingUp } from "lucide-react";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    const userId = user.id;

    const [totalProducts, lowStock, allProducts] = await Promise.all([
        prisma.product.count({ where: { userId } }),
        prisma.product.count({
            where: {
                userId,
                lowStockAt: { not: null },
                quantity: { lte: 5 },
            },
        }),
        prisma.product.findMany({
            where: {
                userId,
            },
            select: {
                price: true,
                quantity: true,
                createdAt: true,
            },
        }),
    ]);

    const totalValue = allProducts.reduce(
        (sum, product) =>
            sum + Number(product.price) * Number(product.quantity),
        0
    );

    const now = new Date();

    const weeklyProductsData = [];

    for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999); // <- ini yang benar!

        const weekLabel = `${String(weekStart.getMonth() + 1).padStart(
            2,
            "0"
        )}/${String(weekStart.getDate()).padStart(2, "0")}`;

        const weekProducts = allProducts.filter((product) => {
            const productDate = new Date(product.createdAt);
            return productDate >= weekStart && productDate <= weekEnd;
        });

        weeklyProductsData.push({
            week: weekLabel,
            products: weekProducts.length,
        });
    }

    const recent = await prisma.product.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 5,
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar currentPath="/dashboard" />

            <main className="ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Dashboard
                            </h1>
                            <p className="text-sm text-gray-500">
                                Welcome back! Here is an overview of your
                                inventory.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            Key Metrics
                        </h2>
                        <div className="grid grid-cols-3 gap-6">
                            {/* Total Products */}
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {totalProducts}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Products
                                </div>
                                <div className="flex items-center justify-center mt-1">
                                    <span className="text-xs text-green-600">
                                        +{totalProducts}
                                    </span>
                                    <TrendingUp className="size-3 text-green-600 ml-1" />
                                </div>
                            </div>
                            {/* Total Value */}
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    ${Number(totalValue).toFixed(0)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Value
                                </div>
                                <div className="flex items-center justify-center mt-1">
                                    <span className="text-xs text-green-600">
                                        +{Number(totalValue).toFixed(0)}
                                    </span>
                                    <TrendingUp className="size-3 text-green-600 ml-1" />
                                </div>
                            </div>
                            {/* Low Stock */}
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {lowStock}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Low Stock
                                </div>
                                <div className="flex items-center justify-center mt-1">
                                    <span className="text-xs text-green-600">
                                        +{lowStock}
                                    </span>
                                    <TrendingUp className="size-3 text-green-600 ml-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Inventory Over Time */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2>New products per week</h2>
                        </div>

                        <div className="h-48">
                            <ProductsChart data={weeklyProductsData} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Stock Levels */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Stock Level
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {recent.map((product, key) => {
                                const stockLevel =
                                    product.quantity === 0
                                        ? 0
                                        : product.quantity <=
                                          (product.lowStockAt || 5)
                                        ? 1
                                        : 2;
                                const bgColors = [
                                    "bg-red-600",
                                    "bg-yellow-600",
                                    "bg-green-600",
                                ];
                                const textColors = [
                                    "text-red-600",
                                    "text-yellow-600",
                                    "text-green-600",
                                ];

                                return (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                    >
                                        <div className="flex items-center gap-x-3">
                                            <div
                                                className={`size-3 rounded-full ${bgColors[stockLevel]}`}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                                {product.name}
                                            </span>
                                        </div>

                                        <div
                                            className={`text-sm font-medium ${textColors[stockLevel]}`}
                                        >
                                            {product.quantity} units
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
