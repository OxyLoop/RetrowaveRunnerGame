// @ts-nocheck
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, Octahedron, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, damagePlayer, addProjectile } from '../state/gameState';
import { GamePhase, Projectile } from '../types';
import { ENEMY_PROJECTILE_SPEED, ENEMY_PROJECTILE_DAMAGE, COLORS } from '../constants';

const EndermanBoss: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const ringsRef = useRef<THREE.Group>(null);
    const [lastAttack, setLastAttack] = useState(0);

    // Floating shards for "Cybernetic Entity" look
    const shards = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            offset: [
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 2
            ],
            scale: Math.random() * 0.5 + 0.5,
            speed: Math.random() * 0.5 + 0.2
        }));
    }, []);

    useFrame((state) => {
        const gs = gameStateRef.current;

        if (!gs.boss.isActive || gs.phase !== GamePhase.BOSS_FIGHT) return;

        const time = state.clock.getElapsedTime();
        const boss = gs.boss;
        const hpPercent = boss.currentHp / boss.maxHp;

        // Position Logic
        if (groupRef.current) {
            groupRef.current.position.z = boss.z;

            // Hover animation
            groupRef.current.position.y = 3 + Math.sin(time) * 0.5;

            // Phase Behaviors
            if (hpPercent < 0.25) { // Phase 3: RAGE
                // Violent shake
                groupRef.current.position.x = (Math.random() - 0.5) * 1.5;
                groupRef.current.position.y += (Math.random() - 0.5) * 0.5;
                // Red glowing color shift happening in render below
            } else if (hpPercent < 0.5) { // Phase 2: Teleporting
                // Teleport logic handled in game loop, but visual glitch here:
                if (Math.random() < 0.05) {
                    groupRef.current.position.x = (Math.random() - 0.5) * 8;
                } else {
                    // Smooth lerp back to center-ish
                    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
                }
            } else { // Phase 1: Idle sway
                groupRef.current.position.x = Math.sin(time * 0.5) * 3;
            }
        }

        // Ring Rotation
        if (ringsRef.current) {
            ringsRef.current.rotation.x = time * 0.5;
            ringsRef.current.rotation.y = time * 0.3;

            // Spin faster in rage mode
            if (hpPercent < 0.25) {
                ringsRef.current.rotation.z += 0.1;
                ringsRef.current.rotation.x += 0.05;
            }
        }

        // Core Pulse
        if (coreRef.current) {
            const scale = 1 + Math.sin(time * 3) * 0.2;
            coreRef.current.scale.set(scale, scale, scale);
        }

        // ATTACK LOGIC
        const now = Date.now();
        let attackCooldown = 1500;
        if (hpPercent < 0.5) attackCooldown = 1000;
        if (hpPercent < 0.25) attackCooldown = 600;

        if (now - lastAttack > attackCooldown) {
            setLastAttack(now);

            // Shoot projectile at player
            const projectileParams: Projectile = {
                id: Math.random(), // Temporary ID logic
                x: groupRef.current!.position.x,
                y: groupRef.current!.position.y,
                z: groupRef.current!.position.z + 2,
                vx: (gs.player.x - groupRef.current!.position.x) * 0.5,
                vy: (gs.player.y - groupRef.current!.position.y) * 0.5,
                vz: ENEMY_PROJECTILE_SPEED + (hpPercent < 0.5 ? 10 : 0),
                damage: 15 + (hpPercent < 0.25 ? 10 : 0),
                color: hpPercent < 0.25 ? '#ff0000' : '#ff00ff',
                size: 0.8,
                piercing: false,
                explosive: hpPercent < 0.25,
                fromEnemy: true,
            };
            addProjectile(projectileParams);
        }
    });

    const getBossColor = () => {
        const hp = gameStateRef.current.boss.currentHp / gameStateRef.current.boss.maxHp;
        if (hp < 0.25) return '#ff0000'; // Rage red
        if (hp < 0.5) return '#ff8800'; // Warning orange
        return '#a020f0'; // Default purple
    };

    const mainColor = getBossColor();

    return (
        <group ref={groupRef}>
            {/* CENTRAL CORE */}
            <Sphere ref={coreRef} args={[1.5, 16, 16]}>
                <meshStandardMaterial
                    color="#000000"
                    emissive={mainColor}
                    emissiveIntensity={2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>

            {/* ROTATING RINGS */}
            <group ref={ringsRef}>
                <Torus args={[2.5, 0.1, 16, 100]} rotation={[1, 0, 0]}>
                    <meshBasicMaterial color={mainColor} wireframe />
                </Torus>
                <Torus args={[2, 0.1, 16, 100]} rotation={[0, 1, 0]}>
                    <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.5} />
                </Torus>
                <Torus args={[3, 0.1, 16, 100]} rotation={[0, 0, 1]}>
                    <meshBasicMaterial color={mainColor} wireframe />
                </Torus>
            </group>

            {/* FLOATING SHARDS */}
            {shards.map((shard, i) => (
                <FloatingShard
                    key={i}
                    offset={shard.offset}
                    color={mainColor}
                    baseScale={shard.scale}
                />
            ))}

            {/* BOSS HP BAR (Visual above head) */}
            <group position={[0, 4.5, 0]}>
                <Box args={[6, 0.3, 0.3]}>
                    <meshBasicMaterial color="#330000" />
                </Box>
                <group position={[-3 + (gameStateRef.current.boss.currentHp / gameStateRef.current.boss.maxHp) * 3, 0, 0.1]}>
                    <Box args={[6 * (gameStateRef.current.boss.currentHp / gameStateRef.current.boss.maxHp), 0.25, 0.1]}>
                        <meshBasicMaterial color={mainColor} toneMapped={false} />
                    </Box>
                </group>
                <Text
                    position={[0, 0.8, 0]}
                    fontSize={0.8}
                    color={mainColor}
                    outlineWidth={0.05}
                    outlineColor="#000000"
                >
                    {gameStateRef.current.boss.name || "ENTITY_NULL"}
                </Text>
            </group>

            {/* POINT LIGHT */}
            <pointLight distance={20} intensity={5} color={mainColor} />
        </group>
    );
};

// Sub-component for shards
const FloatingShard = ({ offset, color, baseScale }: { offset: number[], color: string, baseScale: number }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const [randomOffset] = useState(Math.random() * 100);

    useFrame((state) => {
        if (mesh.current) {
            const t = state.clock.getElapsedTime();
            mesh.current.position.y = offset[1] + Math.sin(t * 2 + randomOffset) * 0.5;
            mesh.current.rotation.x = t + randomOffset;
            mesh.current.rotation.y = t * 0.5 + randomOffset;
        }
    });

    return (
        <Octahedron
            ref={mesh}
            args={[baseScale]}
            position={[offset[0], offset[1], offset[2]]}
        >
            <meshStandardMaterial
                color={color}
                roughness={0.1}
                metalness={0.9}
                emissive={color}
                emissiveIntensity={0.5}
            />
        </Octahedron>
    );
};

export default EndermanBoss;
