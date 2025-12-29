// @ts-nocheck
import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, damageEnemy, damageBoss, damagePlayer } from '../state/gameState';
import { GamePhase, Projectile } from '../types';

const Projectiles: React.FC = () => {
    const [renderProjectiles, setRenderProjectiles] = useState<Projectile[]>([]);
    const lastUpdateRef = useRef(0);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        if (gs.phase !== GamePhase.RUNNING && gs.phase !== GamePhase.BOSS_FIGHT) return;

        // Update all projectile positions
        for (let i = gs.projectiles.length - 1; i >= 0; i--) {
            const p = gs.projectiles[i];

            // Move projectile
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.z += p.vz * delta;

            let shouldRemove = false;

            // Remove if too far
            if (Math.abs(p.z - gs.distance) > 200 || p.y < -1) {
                shouldRemove = true;
            }

            // PLAYER projectiles hit ENEMIES
            if (!p.fromEnemy && !shouldRemove) {
                for (let j = gs.enemies.length - 1; j >= 0; j--) {
                    const enemy = gs.enemies[j];
                    if (!enemy.isActive) continue;

                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    const dz = p.z - enemy.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < 2.5) {
                        damageEnemy(enemy.id, p.damage);
                        if (!p.piercing) {
                            shouldRemove = true;
                        }
                        break;
                    }
                }

                // Player projectiles hit BOSS
                if (gs.boss.isActive && !shouldRemove) {
                    const dx = p.x - 0;
                    const dy = p.y - 3;
                    const dz = p.z - gs.boss.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < 6) {
                        damageBoss(p.damage);
                        if (!p.piercing) {
                            shouldRemove = true;
                        }
                    }
                }
            }

            // ENEMY projectiles hit PLAYER
            if (p.fromEnemy && !shouldRemove) {
                const dx = p.x - gs.player.x;
                const dy = p.y - 1;
                const dz = p.z - gs.distance;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 2.5) {
                    damagePlayer(p.damage);
                    shouldRemove = true;
                }
            }

            if (shouldRemove) {
                gs.projectiles.splice(i, 1);
            }
        }

        // Update render state every frame for smooth animation
        const now = Date.now();
        if (now - lastUpdateRef.current > 16) {
            lastUpdateRef.current = now;
            setRenderProjectiles([...gs.projectiles]);
        }
    });

    return (
        <group>
            {renderProjectiles.map((p) => (
                <group key={p.id} position={[p.x, p.y, p.z]}>
                    {p.fromEnemy ? (
                        // === ENEMY PROJECTILE (LASER BOLT) ===
                        <group rotation={[Math.PI / 2, 0, 0]}>
                            {/* Core Bolt */}
                            <Cylinder args={[p.size * 0.4, p.size * 0.4, p.size * 5, 8]}>
                                <meshBasicMaterial color="#ffcc00" toneMapped={false} />
                            </Cylinder>
                            {/* Glowing Aura Outer */}
                            <Cylinder args={[p.size * 0.8, p.size * 0.8, p.size * 6, 8]}>
                                <meshBasicMaterial color={p.color} transparent opacity={0.6} toneMapped={false} />
                            </Cylinder>
                            {/* Front Glow */}
                            <Sphere args={[p.size, 8, 8]} position={[0, -p.size * 2, 0]}>
                                <meshBasicMaterial color="#ffffff" toneMapped={false} />
                            </Sphere>
                        </group>
                    ) : (
                        // === PLAYER PROJECTILE ===
                        <group>
                            {/* Main projectile - BIGGER */}
                            <Sphere args={[p.size * 1.5, 8, 8]}>
                                <meshBasicMaterial color={p.color} toneMapped={false} />
                            </Sphere>
                            {/* Glow */}
                            <Sphere args={[p.size * 3, 6, 6]}>
                                <meshBasicMaterial color={p.color} transparent opacity={0.4} toneMapped={false} />
                            </Sphere>
                            {/* Trail */}
                            <Cylinder
                                args={[p.size * 0.8, p.size * 0.4, 2, 4]}
                                position={[0, 0, 1]}
                                rotation={[Math.PI / 2, 0, 0]}
                            >
                                <meshBasicMaterial color={p.color} transparent opacity={0.6} toneMapped={false} />
                            </Cylinder>
                        </group>
                    )}
                </group>
            ))}
        </group>
    );
};

export default Projectiles;
