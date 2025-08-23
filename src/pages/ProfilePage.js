import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AchievementsList from '../Components/Gamification/AchievementsList';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <p>Cargando perfil...</p>;
    }

    return (
        <div className="w-full space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-500/20 rounded-full">
                    <User className="h-10 w-10 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                    <p className="text-lg text-gray-400">{user.email}</p>
                </div>
            </div>
            
            <AchievementsList />
        </div>
    );
};

export default ProfilePage;