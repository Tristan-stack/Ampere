"use client"

import React from 'react';
import { useUser } from '@clerk/nextjs';

const Dashboard = () => {
    const { user } = useUser();
    return (
        <div>
            <div>Compte : {user?.firstName}</div>
        </div>
    );
};

export default Dashboard;