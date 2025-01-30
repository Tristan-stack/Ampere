import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function withRoleCheck(WrappedComponent: React.ComponentType) {
    return function WithRoleCheck(props: any) {
        const { user } = useUser();
        const router = useRouter();
        const [hasAccess, setHasAccess] = useState(false);

        useEffect(() => {
            const checkRole = async () => {
                if (!user?.emailAddresses?.[0]?.emailAddress) return;

                try {
                    const response = await fetch(`/api/users/role?email=${encodeURIComponent(user.emailAddresses[0].emailAddress)}`);
                    const { role } = await response.json();

                    if (role !== 'admin' && role !== 'enseignant') {
                        router.push('/access-denied');
                    } else {
                        setHasAccess(true);
                    }
                } catch (error) {
                    router.push('/access-denied');
                }
            };

            checkRole();
        }, [user, router]);

        if (!hasAccess) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };
} 