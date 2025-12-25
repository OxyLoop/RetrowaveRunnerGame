// @ts-nocheck
import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, getCurrentWeapon } from '../state/gameState';
import { GamePhase } from '../types';
import { addFloatingText } from './FloatingText';

interface PowerUp {
    id: number;
    type: string;
    x: number;
    y: number;
    z: number;
    collected: boolean;
    color: string;
    label: string;
    spawnDistance: number; // gs.distance when spawned
}

const TYPES = [
    { type: 'CAN', color: '#ff0066', label: '+40 CAN' },
    { type: 'MERMI', color: '#00ccff', label: '+50 MERMİ' },
    { type: 'HIZ', color: '#ffff00', label: '10sn HIZ!' },
    { type: 'HASAR', color: '#ff6600', label: '2X HASAR!' },
    { type: 'KALKAN', color: '#00ffcc', label: '+60 KALKAN' },
];

let idCounter = 0;

const PowerUps: React.FC = () => {
    const [items, setItems] = useState<PowerUp[]>([]);
    const powerUpsRef = useRef<PowerUp[]>([]);
    const lastSpawnDistance = useRef(0);

    useFrame(() => {
        const gs = gameStateRef.current;
        if (gs.phase !== GamePhase.RUNNING) return;

        // No power-ups in HYPER_CASUAL mode
        if (gs.gameMode === 'HYPER_CASUAL') return;

        // Spawn based on distance traveled - VERY RARE
        // Every 50 units of travel, 20% chance to spawn
        if (Math.abs(gs.distance - lastSpawnDistance.current) > 50) {
            lastSpawnDistance.current = gs.distance;

            if (Math.random() < 0.20) {
                const typeConfig = TYPES[Math.floor(Math.random() * TYPES.length)];
                const x = (Math.random() - 0.5) * 8;
                // Spawn 50 units AHEAD of current player position
                const z = gs.distance - 50;

                const newPowerUp: PowerUp = {
                    id: ++idCounter,
                    type: typeConfig.type,
                    x,
                    y: 1.5,
                    z,
                    collected: false,
                    color: typeConfig.color,
                    label: typeConfig.label,
                    spawnDistance: gs.distance,
                };

                powerUpsRef.current.push(newPowerUp);
            }
        }

        // Check collision with player
        powerUpsRef.current.forEach((p) => {
            if (p.collected) return;

            const dx = p.x - gs.player.x;
            const dz = p.z - gs.distance;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 2.8) {
                p.collected = true;
                addFloatingText(p.label, gs.player.x, 5, gs.distance, p.color);

                // Apply effect
                switch (p.type) {
                    case 'CAN':
                        gs.player.health = Math.min(gs.player.maxHealth, gs.player.health + 25);
                        break;
                    case 'MERMI':
                        // Find weapon with LOWEST ammo (that isn't infinite)
                        const finitWeapons = gs.player.weapons.filter(w => w.unlocked && w.maxAmmo !== Infinity);
                        if (finitWeapons.length > 0) {
                            const lowestAmmoWeapon = finitWeapons.reduce((lowest, w) =>
                                (w.ammo / w.maxAmmo) < (lowest.ammo / lowest.maxAmmo) ? w : lowest
                            );
                            lowestAmmoWeapon.ammo = Math.min(lowestAmmoWeapon.maxAmmo, lowestAmmoWeapon.ammo + 30);
                        }
                        break;
                    case 'HIZ':
                        gs.player.speedBoostUntil = Date.now() + 6000;
                        break;
                    case 'HASAR':
                        gs.player.damageBoostUntil = Date.now() + 8000;
                        break;
                    case 'KALKAN':
                        gs.player.shield = Math.min(gs.player.maxShield, gs.player.shield + 30);
                        break;
                }
            }
        });

        // Cleanup - only remove items that are FAR BEHIND the player
        // gs.distance decreases (goes more negative), so items behind have z > gs.distance
        powerUpsRef.current = powerUpsRef.current.filter((p) => {
            if (p.collected) return false;
            // Keep if item is still ahead or just slightly behind
            // p.z - gs.distance: negative = ahead, positive = behind
            const relZ = p.z - gs.distance;
            return relZ < 15; // Remove only when 15 units behind player
        });

        // Render items near player
        const visible = powerUpsRef.current.filter((p) => {
            const relZ = p.z - gs.distance;
            return relZ > -60 && relZ < 10;
        });

        setItems([...visible]);
    });

    return (
        <group>
            {items.map((p) => {
                const time = Date.now() * 0.003;
                const bobY = p.y + Math.sin(time + p.id) * 0.3;

                return (
                    <group key={p.id} position={[p.x, bobY, p.z]} rotation={[0, time * 2, 0]}>
                        {/* Bright white center */}
                        <Sphere args={[0.7, 12, 12]}>
                            <meshBasicMaterial color="#ffffff" />
                        </Sphere>

                        {/* Colored middle */}
                        <Sphere args={[0.9, 10, 10]}>
                            <meshBasicMaterial color={p.color} />
                        </Sphere>

                        {/* Outer glow */}
                        <Sphere args={[1.3, 8, 8]}>
                            <meshBasicMaterial color={p.color} transparent opacity={0.35} />
                        </Sphere>

                        {/* Light beam */}
                        <Cylinder args={[0.08, 0.08, 5, 6]} position={[0, 2.5, 0]}>
                            <meshBasicMaterial color={p.color} transparent opacity={0.6} />
                        </Cylinder>

                        {/* Base */}
                        <Cylinder args={[0.35, 0.5, 0.4, 8]} position={[0, -1.1, 0]}>
                            <meshBasicMaterial color={p.color} />
                        </Cylinder>
                    </group>
                );
            })}
        </group>
    );
};

export default PowerUps;
