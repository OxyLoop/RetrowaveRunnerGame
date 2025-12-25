// @ts-nocheck
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, addProjectile, damagePlayer } from '../state/gameState';
import { GamePhase, Projectile } from '../types';
import { COLORS, TRACK_WIDTH } from '../constants';

let bossProjectileId = 50000;

// Boss attack patterns
const BOSS_ATTACKS = {
    SPREAD: 'SPREAD',        // Multiple projectiles in arc
    LASER: 'LASER',          // Continuous beam
    BARRAGE: 'BARRAGE',      // Rapid fire
    MISSILE: 'MISSILE',      // Slow tracking projectiles
};

const BossFight: React.FC = () => {
    const bossRef = useRef<THREE.Group>(null);
    const [currentAttack, setCurrentAttack] = useState<string>(BOSS_ATTACKS.SPREAD);
    const lastAttackTime = useRef(0);
    const attackPhaseTime = useRef(0);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        if (!gs.boss.isActive || gs.phase !== GamePhase.BOSS_FIGHT) return;

        const time = state.clock.getElapsedTime();
        const boss = gs.boss;

        // Boss position and animation
        if (bossRef.current) {
            bossRef.current.position.z = boss.z;
            bossRef.current.position.y = 3 + Math.sin(time * 1.5) * 0.8;
            bossRef.current.rotation.y += delta * 0.5;

            // HYPER_CASUAL: Boss doesn't move side to side, just shakes when hit
            if (gs.gameMode === 'HYPER_CASUAL') {
                bossRef.current.position.x = Math.sin(time * 8) * 0.2;
                // Shake more when taking damage
                if (boss.currentHp < boss.maxHp) {
                    bossRef.current.position.x += Math.sin(time * 30) * 0.1;
                }
                return; // No attacks in hyper casual
            }

            // Angry shake when low health
            if (boss.currentHp < boss.maxHp * 0.3) {
                bossRef.current.position.x = Math.sin(time * 20) * 0.3;
            } else {
                bossRef.current.position.x = Math.sin(time * 0.8) * 4;
            }
        }

        // Attack patterns based on health
        const healthPercent = boss.currentHp / boss.maxHp;
        const attackCooldown = healthPercent > 0.5 ? 1.5 : healthPercent > 0.25 ? 1.0 : 0.6;

        if (time - lastAttackTime.current > attackCooldown) {
            lastAttackTime.current = time;

            // Choose attack based on phase
            if (healthPercent > 0.7) {
                executeSpreadAttack(bossRef.current?.position.x || 0, boss.z);
            } else if (healthPercent > 0.4) {
                if (Math.random() > 0.5) {
                    executeSpreadAttack(bossRef.current?.position.x || 0, boss.z);
                } else {
                    executeBarrageAttack(bossRef.current?.position.x || 0, boss.z);
                }
            } else {
                // Enraged phase - more attacks
                executeSpreadAttack(bossRef.current?.position.x || 0, boss.z);
                setTimeout(() => {
                    executeBarrageAttack(bossRef.current?.position.x || 0, boss.z);
                }, 300);
            }
        }
    });

    const executeSpreadAttack = (bossX: number, bossZ: number) => {
        const gs = gameStateRef.current;
        const projectileCount = 5;
        const spreadAngle = Math.PI / 3;

        for (let i = 0; i < projectileCount; i++) {
            const angle = -spreadAngle / 2 + (spreadAngle / (projectileCount - 1)) * i;

            const projectile: Projectile = {
                id: ++bossProjectileId,
                x: bossX,
                y: 3,
                z: bossZ,
                vx: Math.sin(angle) * 20,
                vy: 0,
                vz: 30,
                damage: 15,
                color: COLORS.NEON_MAGENTA,
                size: 0.25,
                piercing: false,
                explosive: false,
                fromEnemy: true,
            };
            addProjectile(projectile);
        }
    };

    const executeBarrageAttack = (bossX: number, bossZ: number) => {
        const gs = gameStateRef.current;

        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const targetX = gs.player.x + (Math.random() - 0.5) * 2;
                const dx = targetX - bossX;
                const dz = gs.distance - bossZ;
                const dist = Math.sqrt(dx * dx + dz * dz);

                const projectile: Projectile = {
                    id: ++bossProjectileId,
                    x: bossX + (Math.random() - 0.5) * 2,
                    y: 3,
                    z: bossZ,
                    vx: (dx / dist) * 35,
                    vy: 0,
                    vz: (dz / dist) * 35,
                    damage: 10,
                    color: COLORS.NEON_RED,
                    size: 0.2,
                    piercing: false,
                    explosive: false,
                    fromEnemy: true,
                };
                addProjectile(projectile);
            }, i * 150);
        }
    };

    const gs = gameStateRef.current;
    if (!gs.boss.isActive && gs.phase !== GamePhase.BOSS_FIGHT) return null;

    const boss = gs.boss;
    const healthPercent = boss.currentHp / boss.maxHp;
    const isEnraged = healthPercent < 0.3;

    return (
        <group ref={bossRef} position={[0, 3, boss.z]}>
            {/* Main core */}
            <Box args={[5, 5, 5]}>
                <meshStandardMaterial
                    color={isEnraged ? "#330000" : "#220022"}
                    roughness={0.1}
                    metalness={0.9}
                />
            </Box>

            {/* Wireframe cage - pulses when enraged */}
            <Box args={[5.5, 5.5, 5.5]}>
                <meshStandardMaterial
                    color={isEnraged ? "#ff0000" : "#ff00ff"}
                    emissive={isEnraged ? "#ff0000" : "#ff00ff"}
                    emissiveIntensity={isEnraged ? 3 : 2}
                    wireframe
                    toneMapped={false}
                />
            </Box>

            {/* Inner energy core */}
            <Sphere args={[1.5, 16, 16]}>
                <meshBasicMaterial
                    color={isEnraged ? COLORS.NEON_RED : COLORS.NEON_MAGENTA}
                    toneMapped={false}
                />
            </Sphere>

            {/* Glowing eyes */}
            <Box args={[1.2, 0.3, 0.3]} position={[-1, 0.8, 2.6]}>
                <meshBasicMaterial color="#ff0000" toneMapped={false} />
            </Box>
            <Box args={[1.2, 0.3, 0.3]} position={[1, 0.8, 2.6]}>
                <meshBasicMaterial color="#ff0000" toneMapped={false} />
            </Box>

            {/* Weapon mounts */}
            <Box args={[0.5, 0.5, 2]} position={[-2.5, 0, 1]}>
                <meshStandardMaterial
                    color="#111111"
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </Box>
            <Box args={[0.5, 0.5, 2]} position={[2.5, 0, 1]}>
                <meshStandardMaterial
                    color="#111111"
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </Box>

            {/* Floating name */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
                <Text
                    position={[0, 5.5, 0]}
                    fontSize={1.5}
                    color={isEnraged ? "#ff0000" : "#ff00ff"}
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.05}
                    outlineColor="#000000"
                >
                    {boss.name}
                    <meshBasicMaterial color={isEnraged ? "#ff0000" : "#ff00ff"} toneMapped={false} />
                </Text>
            </Float>

            {/* Danger aura when enraged */}
            {isEnraged && (
                <Sphere args={[8, 16, 16]}>
                    <meshBasicMaterial
                        color="#ff0000"
                        transparent
                        opacity={0.1}
                        toneMapped={false}
                        side={THREE.BackSide}
                    />
                </Sphere>
            )}

            {/* Boss lights */}
            <pointLight
                color={isEnraged ? "#ff0000" : "#ff00ff"}
                intensity={isEnraged ? 5 : 3}
                distance={20}
            />
        </group>
    );
};

export default BossFight;
