import { db } from "@/server/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const SyncUser = async () => {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error('Utilisateur non authentifié');
        }

        const user = await currentUser();
        if (!user || !user.emailAddresses[0]?.emailAddress) {
            throw new Error('Adresse email non trouvée');
        }

        const emailAddress = user.emailAddresses[0].emailAddress;

        await db.user.upsert({
            where: {
                emailAddress: emailAddress
            },
            update: {
                imageUrl: user.imageUrl,
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
            },
            create: {
                emailAddress: emailAddress,
                imageUrl: user.imageUrl,
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                credits: 350, // Valeur par défaut
                role: "étudiant" // Valeur par défaut
            },
        });

        return redirect("/batiment");
    } catch (error) {
        console.error("Erreur lors de la synchronisation de l'utilisateur:", error);
        throw error;
    }
};

export default SyncUser;