import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function main(): Promise<void> {
	console.log("Încep curățarea bazei de date (MongoDB) prin Prisma...");

	// Ștergem entitățile dependente mai întâi, apoi părinții
	const steps: Array<{
		label: string;
		fn: () => Promise<{ count: number }>;
	}> = [
		{ label: "ForumComment", fn: () => prisma.forumComment.deleteMany({}) },
		{ label: "ForumTopic", fn: () => prisma.forumTopic.deleteMany({}) },
		{ label: "Review", fn: () => prisma.review.deleteMany({}) },
		{ label: "Report", fn: () => prisma.report.deleteMany({}) },
		{ label: "ProjectApplication", fn: () => prisma.projectApplication.deleteMany({}) },
		{ label: "Notification", fn: () => prisma.notification.deleteMany({}) },
		{ label: "Subscription", fn: () => prisma.subscription.deleteMany({}) },
		{ label: "Order", fn: () => prisma.order.deleteMany({}) },
		{ label: "Project", fn: () => prisma.project.deleteMany({}) },
		{ label: "Plan", fn: () => prisma.plan.deleteMany({}) },
		{ label: "News", fn: () => prisma.news.deleteMany({}) },
		{ label: "User", fn: () => prisma.user.deleteMany({}) },
	];

	for (const step of steps) {
		try {
			const result = await step.fn();
			console.log(`Șters ${result.count} înregistrări din ${step.label}`);
		} catch (error) {
			console.error(`Eroare la ștergerea din ${step.label}:`, error);
		}
	}

	console.log("Curățare finalizată.");
}

main()
	.finally(async () => {
		await prisma.$disconnect();
	});



