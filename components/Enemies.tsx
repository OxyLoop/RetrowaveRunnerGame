// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, Octahedron, Cylinder } from '@react-three/drei';
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
        const spawnInterval = 550 / level.spawnRate; // Much Faster spawning (was 800)

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
                        color: "#ff3300", // Bright Orange-Red
                        size: 0.6, // Much bigger (was 0.3)
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
                // BOMBER explodes on contact causing extra damage
                if (enemy.type === EnemyType.BOMBER) {
                    damagePlayer(enemy.damage + 30); // Extra explosion damage
                } else {
                    damagePlayer(enemy.damage);
                }
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
        } else if (enemy.type === EnemyType.PHANTOM) {
            // Phantom floats and phases in/out
            groupRef.current.position.y = 1 + Math.sin(time * 3) * 0.5;
            // Random phase flicker
            if (Math.random() < 0.02) {
                groupRef.current.visible = !groupRef.current.visible;
            }
        } else if (enemy.type === EnemyType.BOMBER) {
            // Bomber wobbles menacingly
            groupRef.current.rotation.z = Math.sin(time * 8) * 0.15;
            groupRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.1;
        }
    });

    const getEnemyColor = () => {
        switch (enemy.type) {
            case EnemyType.DRONE: return COLORS.NEON_RED;
            case EnemyType.TANK: return COLORS.NEON_ORANGE;
            case EnemyType.GLITCH: return COLORS.NEON_GREEN;
            case EnemyType.ELITE: return COLORS.NEON_MAGENTA;
            case EnemyType.ASTEROID: return '#666666';
            case EnemyType.PHANTOM: return '#88ffff';
            case EnemyType.BOMBER: return '#ff6600';
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

    // PHANTOM - Ghost-like enemy
    if (enemy.type === EnemyType.PHANTOM) {
        const distToPlayer = Math.abs(enemy.z - gameStateRef.current.distance);
        const visibility = Math.max(0.2, 1 - distToPlayer / 50); // More visible when close

        return (
            <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
                {/* Main ghost body */}
                <Sphere args={[0.8, 12, 12]}>
                    <meshStandardMaterial
                        color="#88ffff"
                        emissive="#00ffff"
                        emissiveIntensity={0.8}
                        transparent
                        opacity={visibility}
                        metalness={0.2}
                        roughness={0.8}
                        toneMapped={false}
                    />
                </Sphere>
                {/* Inner core */}
                <Sphere args={[0.4, 8, 8]}>
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={visibility * 0.6}
                        toneMapped={false}
                    />
                </Sphere>
                {/* Ghost trails */}
                {[1, 2, 3].map((i) => (
                    <Sphere key={i} args={[0.3, 6, 6]} position={[0, -0.3 * i, 0.2 * i]}>
                        <meshBasicMaterial
                            color="#88ffff"
                            transparent
                            opacity={visibility * (0.4 - i * 0.1)}
                            toneMapped={false}
                        />
                    </Sphere>
                ))}
                {/* Health bar */}
                <Box args={[1.5, 0.12, 0.08]} position={[0, 1.5, 0]}>
                    <meshBasicMaterial color="#005555" />
                </Box>
                <Box args={[1.5 * healthPercent, 0.12, 0.1]} position={[(healthPercent - 1) * 0.75, 1.5, 0]}>
                    <meshBasicMaterial color="#88ffff" toneMapped={false} />
                </Box>
            </group>
        );
    }

    // BOMBER - Explosive enemy
    if (enemy.type === EnemyType.BOMBER) {
        return (
            <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
                {/* Main bomb body */}
                <Sphere args={[1, 12, 12]}>
                    <meshStandardMaterial
                        color="#111111"
                        emissive="#ff6600"
                        emissiveIntensity={damaged ? 2.5 : 1.2}
                        metalness={0.8}
                        roughness={0.2}
                        toneMapped={false}
                    />
                </Sphere>
                {/* Warning stripes effect */}
                <Box args={[0.6, 0.15, 1.2]} position={[0, 0.3, 0]}>
                    <meshBasicMaterial color="#ffff00" toneMapped={false} />
                </Box>
                <Box args={[0.6, 0.15, 1.2]} position={[0, -0.3, 0]}>
                    <meshBasicMaterial color="#ffff00" toneMapped={false} />
                </Box>
                {/* Fuse on top */}
                <Box args={[0.1, 0.5, 0.1]} position={[0, 1.2, 0]}>
                    <meshStandardMaterial color="#333333" />
                </Box>
                {/* Fuse spark */}
                <Sphere args={[0.15, 6, 6]} position={[0, 1.5, 0]}>
                    <meshBasicMaterial color="#ff3300" toneMapped={false} />
                </Sphere>
                {/* Point light for glow */}
                <pointLight position={[0, 0, 0]} color="#ff6600" intensity={2} distance={5} />
                {/* Health bar */}
                <Box args={[1.5, 0.12, 0.08]} position={[0, 2, 0]}>
                    <meshBasicMaterial color="#663300" />
                </Box>
                <Box args={[1.5 * healthPercent, 0.12, 0.1]} position={[(healthPercent - 1) * 0.75, 2, 0]}>
                    <meshBasicMaterial color="#ff6600" toneMapped={false} />
                </Box>
            </group>
        );
    }

    // DRONE - Quadcopter style
    if (enemy.type === EnemyType.DRONE) {
        return (
            <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
                {/* Center Core */}
                <Sphere args={[0.6, 8, 8]}>
                    <meshStandardMaterial color="#222" emissive={color} emissiveIntensity={0.5} />
                </Sphere>
                {/* Propeller Arms */}
                <Box args={[2.4, 0.2, 0.2]} rotation={[0, Math.PI / 4, 0]}>
                    <meshStandardMaterial color="#444" />
                </Box>
                <Box args={[2.4, 0.2, 0.2]} rotation={[0, -Math.PI / 4, 0]}>
                    <meshStandardMaterial color="#444" />
                </Box>
                {/* Rotors */}
                {[0, 1, 2, 3].map(i => {
                    const angle = (Math.PI / 2) * i + Math.PI / 4;
                    const r = 1.0;
                    return (
                        <Cylinder key={i} args={[0.4, 0.4, 0.1, 8]} position={[Math.cos(angle) * r, 0.2, Math.sin(angle) * r]}>
                            <meshBasicMaterial color="#666" />
                        </Cylinder>
                    );
                })}
                {/* Eye */}
                <Sphere args={[0.3, 8, 8]} position={[0, 0, 0.5]}>
                    <meshBasicMaterial color={COLORS.NEON_RED} toneMapped={false} />
                </Sphere>
                {/* Health bar */}
                <Box args={[2.4, 0.2, 0.2]} position={[0, 1.2, 0]}>
                    <meshBasicMaterial color="#330000" />
                </Box>
                <Box args={[2.4 * healthPercent, 0.2, 0.2]} position={[(healthPercent - 1) * 1.2, 1.2, 0]}>
                    <meshBasicMaterial color={color} toneMapped={false} />
                </Box>
            </group>
        );
    }

    // TANK - Tracked Vehicle
    if (enemy.type === EnemyType.TANK) {
        return (
            <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
                {/* Body */}
                <Box args={[1.2, 0.6, 1.4]} position={[0, 0.4, 0]}>
                    <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                </Box>
                {/* Turret */}
                <Box args={[0.7, 0.5, 0.8]} position={[0, 0.9, 0]}>
                    <meshStandardMaterial color="#333" />
                </Box>
                {/* Barrel */}
                <Cylinder args={[0.1, 0.1, 1.2, 8]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.9, 0.8]}>
                    <meshStandardMaterial color="#111" />
                </Cylinder>
                {/* Tracks */}
                <Box args={[0.3, 0.4, 1.6]} position={[-0.7, 0.2, 0]}>
                    <meshStandardMaterial color={color} />
                </Box>
                <Box args={[0.3, 0.4, 1.6]} position={[0.7, 0.2, 0]}>
                    <meshStandardMaterial color={color} />
                </Box>
                {/* Health bar */}
                <Box args={[1.5, 0.15, 0.1]} position={[0, 1.6, 0]}>
                    <meshBasicMaterial color="#330000" />
                </Box>
                <Box args={[1.5 * healthPercent, 0.15, 0.1]} position={[(healthPercent - 1) * 0.75, 1.6, 0]}>
                    <meshBasicMaterial color={color} toneMapped={false} />
                </Box>
            </group>
        );
    }

    // Default / GLITCH / ELITE (keep box for now or update later)
    return (
        <group ref={groupRef} position={[enemy.x, enemy.y, enemy.z]}>
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
