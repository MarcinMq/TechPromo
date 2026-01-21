import React, { useState, useEffect } from 'react';
import { Smartphone, Laptop, Headphones, Watch, Gamepad2, Monitor, Cpu, HardDrive } from 'lucide-react';

// Komponent spadających ikonek elektroniki
const FallingIcons: React.FC = () => {
    const icons = [Smartphone, Laptop, Headphones, Watch, Gamepad2, Monitor, Cpu, HardDrive];
    const [particles, setParticles] = useState<Array<{
        id: number;
        Icon: any;
        left: number;
        animationDuration: number;
        size: number;
        delay: number;
        opacity: number;
    }>>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            Icon: icons[Math.floor(Math.random() * icons.length)],
            left: Math.random() * 100,
            animationDuration: 15 + Math.random() * 15, // 15-30s
            size: 20 + Math.random() * 30, // 20-50px
            delay: Math.random() * 10, // 0-10s opóźnienia
            opacity: 0.1 + Math.random() * 0.15, // 0.1-0.25 opacity
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute animate-fall"
                    style={{
                        left: `${particle.left}%`,
                        animationDuration: `${particle.animationDuration}s`,
                        animationDelay: `${particle.delay}s`,
                        top: '-100px',
                    }}
                >
                    <particle.Icon
                        size={particle.size}
                        className="text-blue-500 dark:text-blue-400"
                        style={{ opacity: particle.opacity }}
                    />
                </div>
            ))}
            <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
        </div>
    );
};

export default FallingIcons;
