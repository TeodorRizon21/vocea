import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function upsertPlan(
	name: "Basic" | "Bronze" | "Premium" | "Gold",
	price: number,
	currency: string,
	features: string[]
) {
	return prisma.plan.upsert({
		where: { name },
		update: { price, currency, features },
		create: { name, price, currency, features },
	});
}

async function main(): Promise<void> {
	console.log("Seeding planuri...");

	await upsertPlan("Basic", 0, "RON", [
		"Acces gratuit",
		"Fără proiecte active",
	]);

	await upsertPlan("Bronze", 3.8, "RON", [
		"Până la 2 proiecte active",
		"Suport standard",
	]);

	await upsertPlan("Premium", 8, "RON", [
		"Până la 4 proiecte active",
		"Suport prioritar",
	]);

	await upsertPlan("Gold", 28, "RON", [
		"Proiecte nelimitate",
		"Suport prioritar",
		"Funcționalități avansate",
	]);

	console.log("Planurile au fost create/actualizate.");
}

main()
	.catch((err) => {
		console.error("Eroare la seed planuri:", err);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


