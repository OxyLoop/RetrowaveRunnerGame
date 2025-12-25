// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, Octahedron } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, addProjectile, damagePlayer } from '../state/gameState';
import { GamePhase, Enemy, EnemyType, Projectile } from '../types';
import { createEnemy } from '../types/enemies';
import { getLevelConfig } from '../types/levels';
import { ENEMY_SPAWN_DISTANCE, ENEMY_DESPAWN_DISTANCE, ENEMY_PROJECTILE_SPEED, ENEMY_PROJECTILE_DAMAGE, COLORS, TRACK_WIDTH } from '../constants';

let projectileIdCounter = 10000;
let lastSpawnTime = 0;

const Enemies: React.FC = () => {
    const [visibleEnemies, setVisibleEnemies] = useState<Enemy[]>([]);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        // Only spawn/update enemies in SHOOTER mode
        if (gs.gameMode === 'HYPER_CASUAL') {
            if (visibleEnemies.length > 0) setVisibleEnemies([]);
            return;
        }

        if (gs.phase !== GamePhase.RUNNING && gs.phase !== GamePhase.BOSS_FIGHT) return;

        const now = Date.now();
        const level = getLevelConfig(gs.currentLevel);
        const spawnInterval = 800 / level.spawnRate; // Faster spawning

        // Spawn enemies
        if (now - lastSpawnTime > spawnInterval) {
            lastSpawnTime = now;

            const enemyType = level.enemyTypes[Math.floor(Math.random() * level.enemyTypes.length)];
            const x = (Math.random() - 0.5) * (TRACK_WIDTH - 3);
            const z = gs.distance - ENEMY_SPAWN_DISTANCE;
            const levelMultiplier = 1 + (gs.currentLevel - 1) * 0.1; // Reduced scaling

            const enemy = createEnemy(enemyType, x, z, levelMultiplier);
            gs.enemies.push(enemy);
        }

        // Update enemies
        gs.enemies.forEach((enemy) => {
            if (!enemy.isActive) return;

            // Move towards player
            enemy.z += enemy.speed * delta;

            // Glitch enemies teleport
            if (enemy.type === EnemyType.GLITCH && Math.random() < 0.008) {
                enemy.x = (Math.random() - 0.5) * (TRACK_WIDTH - 2);
            }

            // Enemy shooting - MORE FREQUENT
            if (enemy.canShoot && now - enemy.lastShot > enemy.shootCooldown) {
                const dist = Math.abs(enemy.z - gs.distance);
                if (dist < 100 && dist > 8) {
                    enemy.lastShot = now;

                    const projectile: Projectile = {
                        id: ++projectileIdCounter,
                        x: enemy.x,
                        y: enemy.y,
                        z: enemy.z,
                        vx: (gs.player.x - enemy.x) * 0.3, // Aim at player
                        vy: 0,
                        vz: ENEMY_PROJECTILE_SPEED,
                        damage: ENEMY_PROJECTILE_DAMAGE,
                        color: COLORS.NEON_RED,
                        size: 0.3,
                        piercing: false,
                        explosive: false,
                        fromEnemy: true,
                    };
                    addProjectile(projectile);
                }
            }

            // Collision with player
            const dx = enemy.x - gs.player.x;
            const dz = enemy.z - gs.distance;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 2) {
                damagePlayer(enemy.damage);
                enemy.isActive = false;
            }
        });

        // Remove dead or passed enemies
        gs.enemies = gs.enemies.filter((e) =>
            e.isActive && e.z < gs.distance + ENEMY_DESPAWN_DISTANCE
        );

        // Update visual state
        setVisibleEnemies([...gs.enemies.filter(e => e.isActive)]);
    });

    return (
        <group>
            {visibleEnemies.map((enemy) => (
                <EnemyMesh key={enemy.id} enemy={enemy} />
            ))}
        </group>
    );
};

const EnemyMesh: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const time = state.clock.getElapsedTime();
        groupRef.current.position.set(enemy.x, enemy.y, enemy.z);

        if (enemy.type === EnemyType.DRONE) {
            groupRef.current.position.y = 2 + Math.sin(time * 4 + enemy.animOffset) * 0.3;
            groupRef.current.rotation.z = Math.sin(time * 2) * 0.1;
        } else if (enemy.type === EnemyType.GLITCH) {
            if (Math.random() < 0.05) {
                groupRef.current.position.x += (Math.random() - 0.5) * 0.2;
            }
        } else if (enemy.type === EnemyType.ASTEROID) {
            groupRef.current.rotation.x += delta * 0.5;
            groupRef.current.rotation.y += delta * 0.3;
        }
    });

    const getEnemyColor = () => {
        switch (enemy.type) {
            case EnemyType.DRONE: return COLORS.NEON_RED;
            case EnemyType.TANK: return COLORS.NEON_ORANGE;
            case EnemyType.GLITCH: return COLORS.NEON_GREEN;
            case EnemyType.ELITE: return COLORS.NEON_MAGENTA;
            case EnemyType.ASTEROID: return '#666666';
            default: return COLORS.NEON_RED;
        }
    };

    const healthPercent = enemy.health / enemy.maxHealth;
    const color = getEnemyColor();
    const damaged = enemy.health < enemy.maxHealth;

    if (enemy.type === EnemyType.ASTEROID) {
        return (
            <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
                <Octahedron args={[2]}>
                    <meshStandardMaterial
                        color="#444444"
                        emissive="#222222"
                        roughness={0.9}
                        metalness={0.1}
                    />
                </Octahedron>
                {damaged && (
                    <Octahedron args={[2.2]}>
                        <meshBasicMaterial color="#ff0000" wireframe toneMapped={false} />
                    </Octahedron>
                )}
                {/* Health bar */}
                <Box args={[2, 0.15, 0.1]} position={[0, 2.5, 0]}>
                    <meshBasicMaterial color="#330000" />
                </Box>
                <Box args={[2 * healthPercent, 0.15, 0.12]} position={[(healthPercent - 1), 2.5, 0]}>
                    <meshBasicMaterial color="#ff0000" toneMapped={false} />
                </Box>
            </group>
        );
    }

    return (
        <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
            {/* Main body */}
            <Box args={[1.2, 0.8, 1.2]}>
                <meshStandardMaterial
                    color="#111111"
                    emissive={color}
                    emissiveIntensity={damaged ? 1.5 : 0.8}
                    metalness={0.7}
                    roughness={0.3}
                    toneMapped={false}
                />
            </Box>

            {/* Glowing core */}
            <Sphere args={[0.4, 8, 8]}>
                <meshBasicMaterial color={color} toneMapped={false} />
            </Sphere>

            {/* Wireframe when damaged */}
            {damaged && (
                <Box args={[1.4, 1, 1.4]}>
                    <meshBasicMaterial color="#ff0000" wireframe toneMapped={false} />
                </Box>
            )}

            {/* Health bar */}
            <Box args={[1.5, 0.12, 0.08]} position={[0, 1.2, 0]}>
                <meshBasicMaterial color="#330000" />
            </Box>
            <Box args={[1.5 * healthPercent, 0.12, 0.1]} position={[(healthPercent - 1) * 0.75, 1.2, 0]}>
                <meshBasicMaterial color={color} toneMapped={false} />
            </Box>
        </group>
    );
};

export default Enemies;
