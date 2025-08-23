import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AchievementCard = ({ achievement }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-yellow-500/30">
        <div className="p-3 bg-yellow-500/10 rounded-full">
            <Award className="h-8 w-8 text-yellow-500" />
        </div>
        <div>
            <h3 className="font-bold text-white">{achievement.name}</h3>
            <p className="text-sm text-gray-400">{achievement.description}</p>
        </div>
    </div>
);

const AchievementsList = () => {
    const { token } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAchievements = async () => {
            if (!token) return;
            try {
                const response = await fetch('/api/gamification/achievements', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAchievements(data);
                }
            } catch (error) {
                console.error("No se pudieron cargar los logros:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAchievements();
    }, [token]);

    if (isLoading) return <p className="text-gray-400">Cargando logros...</p>;

    return (
        <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Mis Logros</h2>
            {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach, index) => <AchievementCard key={index} achievement={ach} />)}
                </div>
            ) : (
                <p className="text-gray-500">Aún no has ganado ningún logro. ¡Sigue practicando!</p>
            )}
        </div>
    );
};

export default AchievementsList;