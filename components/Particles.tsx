// @ts-nocheck
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { gameStateRef } from '../state/gameState';
import { Particle } from '../types';

const Particles: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        // Update particle physics
        if (gs.particles.length > 0) {
            gs.particles.forEach(p => {
                p.x += p.vx * delta;
                p.y += p.vy * delta;
                p.z += p.vz * delta;
                p.vy -= 15 * delta; // Gravity
                p.life -= delta * 2; // Fade out
            });

            // Remove dead particles
            gs.particles = gs.particles.filter(p => p.life > 0);

            // Update react state
            setParticles([...gs.particles]);
        } else if (particles.length > 0) {
            setParticles([]);
        }
    });

    return (
        <group>
            {particles.map(p => (
                <Sphere
                    key={p.id}
                    args={[p.size, 6, 6]}
                    position={[p.x, p.y, p.z]}
                >
                    <meshBasicMaterial
                        color={p.color}
                        transparent
                        opacity={p.life / p.maxLife}
                        toneMapped={false}
                    />
                </Sphere>
            ))}
        </group>
    );
};

export default Particles;
