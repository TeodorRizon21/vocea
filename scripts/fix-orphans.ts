import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function fixOrders(): Promise<void> {
	const orders = await prisma.order.findMany({
		select: {
			id: true,
			userId: true,
			planId: true,
		},
		take: 1000,
	});

	let deleted = 0;
	for (const o of orders) {
		// Atenție: Order.userId stochează clerkId-ul utilizatorului, nu ObjectId-ul User.id
		const user = await prisma.user.findFirst({ where: { clerkId: o.userId } });
		const plan = await prisma.plan.findFirst({ where: { id: o.planId } });
		if (!user || !plan) {
			await prisma.order.delete({ where: { id: o.id } });
			deleted++;
		}
	}
	console.log(`Orders verificate: ${orders.length}. Orfane șterse: ${deleted}.`);
}

async function fixSubscriptions(): Promise<void> {
	const subs = await prisma.subscription.findMany({
		select: { id: true, userId: true, planId: true, orderId: true },
		take: 1000,
	});
	let deleted = 0;
	for (const s of subs) {
		const user = await prisma.user.findFirst({ where: { id: s.userId } });
		if (!user) {
			await prisma.subscription.delete({ where: { id: s.id } });
			deleted++;
			continue;
		}
		if (s.planId) {
			const plan = await prisma.plan.findFirst({ where: { id: s.planId } });
			if (!plan) {
				await prisma.subscription.update({ where: { id: s.id }, data: { planId: null } });
			}
		}
		if (s.orderId) {
			const order = await prisma.order.findFirst({ where: { id: s.orderId } });
			if (!order) {
				await prisma.subscription.update({ where: { id: s.id }, data: { orderId: null } });
			}
		}
	}
	console.log(`Subscriptions verificate: ${subs.length}. Orfane șterse: ${deleted}.`);
}

async function main(): Promise<void> {
	console.log("Fix orphans: încep verificarea...");
	await fixOrders();
	await fixSubscriptions();
	console.log("Fix orphans: gata.");
}

main()
	.catch((err) => {
		console.error("Eroare fix-orphans:", err);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


