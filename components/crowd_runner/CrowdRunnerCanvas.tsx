// @ts-nocheck
/**
 * CrowdRunnerCanvas.tsx - COUNT MASTERS + SHOOTER
 * 
 * Start with 5 soldiers, gain from LEFT pickups
 * Weapon upgrades from LEFT
 * Enemies from RIGHT
 * Muzzle flash when shooting
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Box, Cylinder, Sphere, Stars, MeshReflectorMaterial, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import {
    crowdState,
    resetCrowdGame,
    startCrowdGame,
    damagePlayer,
    reloadAmmo,
    addSoldiers,
    upgradeWeapon,
    addScore,
    addXp,
    triggerBoss,
    damageBoss,
    FIRE_RATE,
    WEAPON_NAMES,
    WEAPON_COLORS
} from './crowdState';

// Constants
const LEFT_LANE = -3.5;  // Pickups & Weapons
const RIGHT_LANE = 3.5;  // Enemies
const RUN_SPEED = 16;
const SPAWN_DISTANCE = 70;

// ============================================
// TYPES
// ============================================
interface Enemy {
    id: number;
    x: number;
    z: number;
    hp: number;
    maxHp: number;
    type: 'standard' | 'kamikaze' | 'tank';
}

interface Trap {
    id: number;
    x: number;
    z: number;
    type: 'spike';
}

interface Pickup {
    id: number;
    x: number;
    z: number;
    type: 'soldier' | 'weapon' | 'ammo';
    value: number; // Can be negative for soldiers
}


// ============================================
// GAME CAMERA
// ============================================
const GameCamera = () => {
    const { camera } = useThree();

    useFrame((state, delta) => {
        // Simple smooth follow
        const targetZ = crowdState.distance - 12;
        const targetX = crowdState.playerX * 0.3;

        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 3);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 8, delta * 2);

        // When in BOSS mode, look at boss (ahead), otherwise normal
        const lookAtZ = crowdState.status === 'BOSS' ? crowdState.distance + 25 : crowdState.distance + 8;
        camera.lookAt(0, 4, lookAtZ);
    });

    return null;
};

// ============================================
// GROUND
// ============================================
// ============================================
// GROUND (Space Road)
// ============================================
const Ground = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const leftRef = useRef<THREE.Mesh>(null);
    const rightRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        const z = crowdState.distance + 100;
        if (meshRef.current) meshRef.current.position.z = z;
        if (leftRef.current) leftRef.current.position.z = z;
        if (rightRef.current) rightRef.current.position.z = z;
    });

    return (
        <group>
            {/* Main Road - Matte Dark Surface (No Reflections) */}
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 100]} receiveShadow>
                <planeGeometry args={[14, 400]} />
                <meshStandardMaterial
                    color="#151515"
                    roughness={0.9}
                    metalness={0.1}
                />
            </mesh>

            {/* Side Rails - Cyan Glow */}
            <mesh ref={leftRef} position={[-7.5, 0, 100]}>
                <boxGeometry args={[0.2, 0.5, 400]} />
                <meshStandardMaterial color="#00ffff" emissive="#06b6d4" emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
            <mesh ref={rightRef} position={[7.5, 0, 100]}>
                <boxGeometry args={[0.2, 0.5, 400]} />
                <meshStandardMaterial color="#00ffff" emissive="#06b6d4" emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
        </group>
    );
};

// ============================================
// PLAYER ARMY (Blue soldiers)
// ============================================
// ============================================
// PLAYER ARMY (Blue soldiers)
// ============================================
const Soldier = ({ index }: { index: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        // Dynamic visibility check each frame
        const isVisible = index < crowdState.soldierCount;
        meshRef.current.visible = isVisible;

        if (!isVisible) return;

        const time = clock.getElapsedTime();
        const angle = index * 2.39996;
        const radius = Math.sqrt(index) * 0.55;

        meshRef.current.position.set(
            crowdState.playerX + Math.cos(angle) * radius,
            0.6 + Math.sin(time * 10 + index * 0.5) * 0.08,
            crowdState.distance + Math.sin(angle) * radius - 2
        );
    });

    // Always render the mesh, control visibility via ref
    return (
        <mesh ref={meshRef} castShadow visible={false}>
            <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
            <meshStandardMaterial
                color="#0099ff"
                emissive="#0044aa"
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    );
};

const PlayerArmy = () => {
    // Generate static array of max soldiers indices
    const soldiers = useMemo(() => Array.from({ length: 150 }, (_, i) => i), []);

    return (
        <group>
            {soldiers.map(i => (
                <Soldier key={i} index={i} />
            ))}
            <SoldierCount />
            <WeaponModel />
        </group>
    );
};

const SoldierCount = () => {
    const textRef = useRef<any>(null);

    useFrame(() => {
        if (textRef.current) {
            textRef.current.position.set(crowdState.playerX, 4, crowdState.distance - 2);
            // Update text content dynamically
            if (textRef.current.text !== crowdState.soldierCount.toString()) {
                textRef.current.text = crowdState.soldierCount.toString();
            }
        }
    });

    return (
        <Text ref={textRef} rotation={[0, Math.PI, 0]} fontSize={1.5} color="#2196F3" outlineWidth={0.08} outlineColor="#000">
            {crowdState.soldierCount.toString()}
        </Text>
    );
};

// ============================================
// WEAPON MODEL (changes per level)
// ============================================
const WeaponModel = () => {
    const groupRef = useRef<any>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.set(crowdState.playerX, 0.9, crowdState.distance + 0.8);
        }
    });

    const level = crowdState.weaponLevel;
    const color = WEAPON_COLORS[level - 1] || '#666';
    const scale = 0.8 + level * 0.15;

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Gun body */}
            <Box args={[0.15, 0.15, 0.8]} position={[0, 0, 0.4]}>
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </Box>

            {/* Visuals change by level */}
            {level < 3 && (
                <Cylinder args={[0.05, 0.06, 0.5]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.9]}>
                    <meshStandardMaterial color="#222" metalness={0.9} />
                </Cylinder>
            )}

            {/* Level 3+: Double Barrel (Shotgun/SMG) */}
            {level >= 3 && level < 5 && (
                <group position={[0, 0, 0.9]}>
                    <Cylinder args={[0.04, 0.05, 0.5]} rotation={[Math.PI / 2, 0, 0]} position={[-0.08, 0, 0]}>
                        <meshStandardMaterial color="#222" metalness={0.9} />
                    </Cylinder>
                    <Cylinder args={[0.04, 0.05, 0.5]} rotation={[Math.PI / 2, 0, 0]} position={[0.08, 0, 0]}>
                        <meshStandardMaterial color="#222" metalness={0.9} />
                    </Cylinder>
                </group>
            )}

            {/* Level 5: Minigun (Rotary) */}
            {level >= 5 && (
                <group position={[0, 0, 0.9]}>
                    <Cylinder args={[0.12, 0.12, 0.6]} rotation={[Math.PI / 2, 0, 0]} >
                        <meshStandardMaterial color="#111" metalness={0.8} />
                    </Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.65]} rotation={[Math.PI / 2, 0, 0]} position={[0.06, 0.06, 0]}>
                        <meshStandardMaterial color="#444" />
                    </Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.65]} rotation={[Math.PI / 2, 0, 0]} position={[-0.06, -0.06, 0]}>
                        <meshStandardMaterial color="#444" />
                    </Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.65]} rotation={[Math.PI / 2, 0, 0]} position={[0.06, -0.06, 0]}>
                        <meshStandardMaterial color="#444" />
                    </Cylinder>
                    <Cylinder args={[0.03, 0.03, 0.65]} rotation={[Math.PI / 2, 0, 0]} position={[-0.06, 0.06, 0]}>
                        <meshStandardMaterial color="#444" />
                    </Cylinder>
                </group>
            )}

            {level >= 3 && (
                <Box args={[0.25, 0.08, 0.3]} position={[0, -0.1, 0.3]}>
                    <meshStandardMaterial color="#333" />
                </Box>
            )}
        </group>
    );
};

// ============================================
// MUZZLE FLASH
// ============================================
const MuzzleFlash = ({ active }: { active: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current && active) {
            meshRef.current.position.set(crowdState.playerX, 0.9, crowdState.distance + 1.8);
            meshRef.current.scale.setScalar(0.3 + Math.random() * 0.3);
        }
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
        </mesh>
    );
};

// ============================================
// ENEMY
// ============================================
// ============================================
// AUDIO SYSTEM (Web Audio API)
// ============================================
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playSound = (type: 'shoot' | 'hit' | 'hit_flesh' | 'hit_metal' | 'explode' | 'pickup' | 'gameOver') => {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        // Fallback generic hit
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit_flesh') {
        // Thud / Squish for Humans
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'hit_metal') {
        // Metallic Clank for Aliens/Tanks
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
};

// UPBEAT SYNTHWAVE MUSIC
const SpaceMusic = ({ active }: { active: boolean }) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const nodesRef = useRef<AudioNode[]>([]);

    useEffect(() => {
        if (!active || !audioCtx) return;

        const masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.15;
        masterGain.connect(audioCtx.destination);
        nodesRef.current.push(masterGain);

        const BPM = 128;
        const beatTime = 60 / BPM;
        let beatCount = 0;

        // Bass pattern frequencies (Am pentatonic)
        const bassNotes = [55, 55, 73.4, 55, 82.4, 55, 73.4, 55]; // A1, D2, E2

        // Arp pattern (higher octave)
        const arpNotes = [440, 523, 659, 880, 659, 523]; // A4, C5, E5, A5

        const playKick = () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        };

        const playSnare = () => {
            // Noise-like snare
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        };

        const playHiHat = () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = 8000;
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        };

        const playBass = (freq: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + beatTime * 0.8);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + beatTime * 0.9);
        };

        const playArp = (freq: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + beatTime * 0.4);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start();
            osc.stop(audioCtx.currentTime + beatTime * 0.5);
        };

        // Main beat loop
        intervalRef.current = setInterval(() => {
            const step = beatCount % 8;

            // Kick on 1, 3, 5, 7
            if (step % 2 === 0) playKick();

            // Snare on 2, 6
            if (step === 2 || step === 6) playSnare();

            // Hi-hat on every step
            playHiHat();

            // Bass follows pattern
            playBass(bassNotes[step]);

            // Arp every other step
            if (step % 2 === 0) {
                playArp(arpNotes[(step / 2) % arpNotes.length]);
            }

            beatCount++;
        }, beatTime * 500); // 8th notes

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            nodesRef.current.forEach(node => {
                try { node.disconnect(); } catch { }
            });
            nodesRef.current = [];
        };
    }, [active]);

    return null;
};


// ============================================
// ENEMY (ALIEN MODELS + BOSS)
// ============================================
const EnemyVisual = ({ enemy }: { enemy: Enemy }) => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);
    const prevHp = useRef(enemy.hp);
    const flashTime = useRef(0);

    // Type helpers
    const isKamikaze = enemy.type === 'kamikaze';
    const isTank = enemy.type === 'tank';
    const isAlien = isKamikaze || isTank;

    useFrame((state, delta) => {
        // Hit Flash Logic
        if (enemy.hp < prevHp.current) {
            flashTime.current = 0.15;
            prevHp.current = enemy.hp;
        }
        if (flashTime.current > 0) flashTime.current -= delta;

        if (groupRef.current) {
            // Smooth position
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, enemy.x, delta * 15);
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, enemy.z, delta * 15);

            // Animation
            if (isAlien) {
                // Hover for aliens
                const floatSpeed = isKamikaze ? 25 : 4;
                groupRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * floatSpeed + enemy.id) * 0.2;
            } else {
                // Bobbing for soldiers
                groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10 + enemy.id)) * 0.2;
            }
        }

        // Body Animation
        if (bodyRef.current) {
            const spinSpeed = isKamikaze ? 10 : (isTank ? 1 : 0);
            if (isAlien) {
                bodyRef.current.rotation.x += delta * spinSpeed;
                bodyRef.current.rotation.y += delta * spinSpeed * 0.5;
            }

            // Flash color logic
            const material = bodyRef.current.material as THREE.MeshStandardMaterial;
            if (flashTime.current > 0) {
                material.emissive.setHex(0xffffff);
                material.emissiveIntensity = 2;
            } else {
                const baseEmissive = isKamikaze ? 0xffaa00 : (isTank ? 0x550055 : 0x000000);
                material.emissive.setHex(baseEmissive);
                material.emissiveIntensity = isKamikaze ? 0.8 : 0.0;
            }
        }
    });

    // Palette
    const isHuman = !isAlien;
    const color = isKamikaze ? '#ff3300' : (isTank ? '#2a0033' : '#1a237e');
    const emissive = isKamikaze ? '#ffaa00' : (isTank ? '#550055' : '#000000');
    const scale = isTank ? 1.5 : (isKamikaze ? 0.9 : 1.0);

    return (
        <group ref={groupRef} position={[enemy.x, 0, enemy.z]} scale={[scale, scale, scale]}>
            {/* Enemy Body */}
            <mesh ref={bodyRef} position={[0, isAlien ? 0 : 0.75, 0]} castShadow>
                {isKamikaze ? <icosahedronGeometry args={[0.5, 0]} /> :
                    (isTank ? <dodecahedronGeometry args={[0.7, 0]} /> :
                        <capsuleGeometry args={[0.35, 0.7, 4, 8]} />)}
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={isKamikaze ? 0.8 : 0}
                    roughness={isAlien ? 0.2 : 0.8}
                    metalness={isAlien ? 0.8 : 0.0}
                />
            </mesh>

            {/* Standard Soldier Details (Human Head) */}
            {isHuman && (
                <group>
                    <mesh position={[0, 1.4, 0]}>
                        <sphereGeometry args={[0.25, 8, 8]} />
                        <meshStandardMaterial color="#ffccaa" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[0.45, 0.5, 0.25]} />
                        <meshStandardMaterial color="#1a1a1a" />
                    </mesh>
                </group>
            )}

            {/* Glowing Core / Eyes (For ALIENS ONLY) */}
            {isAlien && (
                <mesh position={[0, 0, 0.4]}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshBasicMaterial color={isKamikaze ? "white" : "red"} />
                </mesh>
            )}

            <Text position={[0, 2.0, 0]} fontSize={0.6} color="white" outlineWidth={0.05} outlineColor="black">
                {enemy.hp}
            </Text>
        </group>
    );
};

// ============================================
// TRAP (Spinning Spike)
// ============================================
const TrapVisual = ({ trap }: { trap: Trap }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 5;
        }
    });

    return (
        <group position={[trap.x, 0, trap.z]}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.2, 1.4, 0.2, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Spike */}
            <mesh ref={meshRef} position={[0, 0.8, 0]}>
                <coneGeometry args={[1, 1.5, 4]} />
                <meshStandardMaterial color="#D32F2F" metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    );
};

// ============================================
// PICKUP (Left/Right lanes: Soldiers, Weapons, Ammo)
// ============================================
const PickupVisual = ({ pickup }: { pickup: Pickup }) => {
    const groupRef = useRef<THREE.Group>(null);
    const isNegative = pickup.value < 0;

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.position.y = 0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
            groupRef.current.rotation.y += 0.02;
        }
    });

    // Soldier: Green if positive, Red if negative
    const soldierColor = isNegative ? '#D32F2F' : '#4CAF50';

    const colors = { soldier: soldierColor, weapon: '#E91E63', ammo: '#FFC107' };
    const icons = {
        soldier: `${pickup.value > 0 ? '+' : ''}${pickup.value} 👤`,
        weapon: 'WEAPON ⬆',
        ammo: `+${pickup.value} 🔫`
    };

    return (
        <group position={[pickup.x, 0, pickup.z]}>
            <group ref={groupRef}>
                <Cylinder args={[1.2, 1.2, 0.3, 16]}>
                    <meshStandardMaterial color={colors[pickup.type]} emissive={colors[pickup.type]} emissiveIntensity={0.5} />
                </Cylinder>
                {pickup.type === 'soldier' && (
                    <mesh position={[0, 0.5, 0]}>
                        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
                        <meshStandardMaterial color={isNegative ? '#B71C1C' : '#2196F3'} />
                    </mesh>
                )}
                {pickup.type === 'weapon' && (
                    <Box args={[0.3, 0.15, 0.6]} position={[0, 0.4, 0]}>
                        <meshStandardMaterial color="#E91E63" metalness={0.8} />
                    </Box>
                )}
            </group>
            <Text position={[0, 2.5, 0]} rotation={[0, Math.PI, 0]} fontSize={0.7} color={colors[pickup.type]} outlineWidth={0.04} outlineColor="#000">
                {icons[pickup.type]}
            </Text>
        </group>
    );
};

// ============================================
// PARTICLE SYSTEM (Explosions)
// ============================================
const particleSystem = {
    spawn: (x: number, z: number, color: string) => { }, // Placeholder
};

const ExplosionSystem = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const particles = useRef<any[]>([]);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        // Expose spawn function globally (hacky but effective for this file structure)
        particleSystem.spawn = (x, z, color) => {
            if (particles.current.length > 500) return; // Limit caps

            for (let i = 0; i < 8; i++) { // 8 particles per explosion
                particles.current.push({
                    x, y: 1, z,
                    vx: (Math.random() - 0.5) * 15,
                    vy: Math.random() * 10,
                    vz: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    color: new THREE.Color(color),
                    scale: 0.5 + Math.random() * 0.5
                });
            }
        };
    }, []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Update physics
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.life -= delta * 1.5; // Fade speed
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.z += p.vz * delta;
            p.vy -= 20 * delta; // Gravity

            if (p.life <= 0 || p.y < 0) {
                particles.current.splice(i, 1);
            }
        }

        // Render instances
        meshRef.current.count = particles.current.length;
        particles.current.forEach((p, i) => {
            dummy.position.set(p.x, p.y, p.z);
            dummy.scale.setScalar(p.scale * p.life);
            dummy.rotation.x += delta * 5;
            dummy.rotation.z += delta * 5;
            dummy.updateMatrix();
            meshRef.current?.setMatrixAt(i, dummy.matrix);
            meshRef.current?.setColorAt(i, p.color);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, 1000]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
    );
};

// ============================================
// BULLETS
// ============================================
const Bullet = ({ data }: { data: { id: number, x: number, z: number } }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.set(data.x, 1, data.z);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffff00" />
        </mesh>
    );
};

const Bullets = ({ enemies, onHit, setFlash }: { enemies: Enemy[], onHit: (id: number, dmg: number, type?: string) => void, setFlash: (v: boolean) => void }) => {
    const [bullets, setBullets] = useState<{ id: number, x: number, z: number }[]>([]);
    const bulletsRef = useRef<{ id: number, x: number, z: number }[]>([]); // Physics state
    const lastShot = useRef(0);
    const bulletId = useRef(0);

    useFrame(({ clock }, delta) => {
        if (crowdState.status !== 'RUNNING') return;

        const now = clock.getElapsedTime();

        // Fire
        if (now - lastShot.current > 1 / FIRE_RATE && crowdState.ammo > 0) {
            crowdState.ammo--;
            lastShot.current = now;
            setFlash(true);
            setTimeout(() => setFlash(false), 50);

            // Fire bullets for EACH soldier (up to a limit to save visual clutter/perf)
            const count = Math.min(20, crowdState.soldierCount);
            const radius = Math.min(2.5, Math.sqrt(crowdState.soldierCount) * 0.4);

            // Always fire at least one center shot
            const newBullets = [];
            newBullets.push({ id: bulletId.current++, x: crowdState.playerX, z: crowdState.distance + 2.5 });

            // Fire extra shots for other soldiers
            if (count > 1) {
                const extraShots = count - 1;
                for (let i = 0; i < extraShots; i++) {
                    const offsetX = (Math.random() - 0.5) * 2 * radius;
                    newBullets.push({ id: bulletId.current++, x: crowdState.playerX + offsetX, z: crowdState.distance + 2.5 });
                }
            }

            bulletsRef.current.push(...newBullets);
        }

        // Move bullets & Check Collisions
        const keptBullets: { id: number, x: number, z: number }[] = [];

        for (const b of bulletsRef.current) {
            const newZ = b.z + 50 * delta;
            let hit = false;

            // Simple collision check
            for (const e of enemies) {
                if (Math.abs(e.x - b.x) < 1.5 && Math.abs(e.z - newZ) < 1.5) {
                    onHit(e.id, crowdState.weaponDamage, e.type); // Pass type for sound
                    hit = true;
                    break;
                }
            }

            if (!hit && newZ < crowdState.distance + SPAWN_DISTANCE + 15) {
                b.z = newZ;
                keptBullets.push(b);
            }
        }

        bulletsRef.current = keptBullets;
        setBullets([...bulletsRef.current]); // Sync for render
    });

    return (
        <group>
            {bullets.map(b => <Bullet key={b.id} data={b} />)}
        </group>
    );
};

// ============================================
// BOSS ARENA (Renders on top of game when status is BOSS)
// ============================================
interface BossBullet {
    id: number;
    x: number;
    y: number;
    z: number;
    vz: number;
}

interface BossProjectile {
    id: number;
    x: number;
    y: number;
    z: number;
    vx: number;
    vz: number;
}

interface BossAmmo {
    id: number;
    x: number;
    z: number;
}

let bossBulletId = 0;
let bossProjectileId = 0;
let bossAmmoId = 0;

const BossArena = () => {
    const bossRef = useRef<THREE.Group>(null);
    const [bullets, setBullets] = useState<BossBullet[]>([]);
    const [projectiles, setProjectiles] = useState<BossProjectile[]>([]);
    const [ammoPickups, setAmmoPickups] = useState<BossAmmo[]>([]);
    const [, forceUpdate] = useState(0);
    const lastShot = useRef(0);
    const lastBossAttack = useRef(0);
    const lastAmmoSpawn = useRef(0);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        const bossZ = crowdState.distance + 25;

        // Position boss ahead of player
        if (bossRef.current) {
            bossRef.current.position.z = bossZ;
            bossRef.current.position.y = 5 + Math.sin(time * 1.5) * 1.2;
            bossRef.current.rotation.y += delta * 0.3;

            // Angry shake when low HP
            if (crowdState.bossHp < crowdState.bossMaxHp * 0.3) {
                bossRef.current.position.x = Math.sin(time * 25) * 0.8;
                bossRef.current.position.y += Math.sin(time * 15) * 0.5;
            } else {
                bossRef.current.position.x = 0;
            }
        }

        // PLAYER SHOOTING - every 0.25s
        if (time - lastShot.current > 0.25 && crowdState.ammo > 0 && crowdState.soldierCount > 0) {
            lastShot.current = time;
            crowdState.ammo--;
            playSound('shoot');

            // Create visible bullet with velocity
            setBullets(prev => [...prev, {
                id: ++bossBulletId,
                x: crowdState.playerX,
                y: 1.5,
                z: crowdState.distance,
                vz: 80 // Forward velocity
            }]);
        }

        // UPDATE PLAYER BULLETS
        setBullets(prev => prev.map(b => ({
            ...b,
            z: b.z + 80 * delta // Fast bullets toward boss
        })).filter(b => {
            // Check if bullet hit boss
            if (b.z >= bossZ - 3) {
                damageBoss(crowdState.weaponDamage);
                playSound('hit');
                return false;
            }
            return b.z < bossZ + 10;
        }));

        // BOSS ATTACKS - every 2s
        if (time - lastBossAttack.current > 2) {
            lastBossAttack.current = time;

            // Spread attack - 5 projectiles
            for (let i = -2; i <= 2; i++) {
                setProjectiles(prev => [...prev, {
                    id: ++bossProjectileId,
                    x: i * 1.5,
                    y: 5,
                    z: bossZ,
                    vx: i * 3,
                    vz: -35
                }]);
            }
            playSound('explode');
        }

        // UPDATE BOSS PROJECTILES
        setProjectiles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.vx * delta,
            z: p.z + p.vz * delta
        })).filter(p => {
            // Check if projectile hit player
            if (p.z <= crowdState.distance + 2 && Math.abs(p.x - crowdState.playerX) < 2) {
                crowdState.soldierCount = Math.max(0, crowdState.soldierCount - 1);
                playSound('hit_flesh');
                if (crowdState.soldierCount <= 0) {
                    crowdState.status = 'GAMEOVER';
                }
                return false;
            }
            return p.z > crowdState.distance - 20;
        }));

        // AMMO SPAWNS - every 4s, spawns near player
        if (time - lastAmmoSpawn.current > 4) {
            lastAmmoSpawn.current = time;
            setAmmoPickups(prev => [...prev, {
                id: ++bossAmmoId,
                x: crowdState.playerX + (Math.random() - 0.5) * 4,
                z: crowdState.distance + 15
            }]);
        }

        // UPDATE AMMO PICKUPS - Move toward player
        setAmmoPickups(prev => prev.map(a => ({
            ...a,
            z: a.z - 8 * delta // Move toward player
        })).filter(a => {
            const dist = Math.abs(a.x - crowdState.playerX) + Math.abs(a.z - crowdState.distance);
            if (dist < 2.5) {
                crowdState.ammo += 30;
                playSound('pickup');
                return false;
            }
            return a.z > crowdState.distance - 10; // Remove if passed player
        }));

        forceUpdate(n => n + 1);
    });

    const isEnraged = crowdState.bossHp < crowdState.bossMaxHp * 0.3;
    const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.05;
    const time = Date.now() * 0.001;

    return (
        <>
            {/* Dark space atmosphere */}
            <color attach="background" args={['#000a05']} />
            <fog attach="fog" args={['#000a05', 20, 80]} />

            {/* Eerie green lighting */}
            <ambientLight intensity={0.3} color="#00ff00" />
            <pointLight position={[0, 15, crowdState.distance + 25]} intensity={8} color={isEnraged ? "#ff0000" : "#00ff88"} distance={60} />
            <pointLight position={[-10, 5, crowdState.distance + 30]} intensity={3} color="#00ffaa" distance={30} />
            <pointLight position={[10, 5, crowdState.distance + 30]} intensity={3} color="#88ff00" distance={30} />

            {/* PLAYER BULLETS */}
            {bullets.map(b => (
                <mesh key={b.id} position={[b.x, b.y, b.z]}>
                    <sphereGeometry args={[0.2, 8, 8]} />
                    <meshBasicMaterial color="#ffff00" />
                </mesh>
            ))}

            {/* BOSS PROJECTILES */}
            {projectiles.map(p => (
                <mesh key={p.id} position={[p.x, p.y, p.z]}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshBasicMaterial color="#ff0000" />
                </mesh>
            ))}

            {/* AMMO PICKUPS */}
            {ammoPickups.map(a => (
                <group key={a.id} position={[a.x, 1, a.z]}>
                    <Box args={[1, 1, 1]}>
                        <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={1} />
                    </Box>
                    <Text position={[0, 1.5, 0]} fontSize={0.5} color="#ffffff">+30</Text>
                </group>
            ))}

            {/* ALIEN BOSS */}
            <group ref={bossRef} position={[0, 5, crowdState.distance + 25]} scale={[pulseScale, pulseScale, pulseScale]}>

                {/* ALIEN HEAD - Large oval */}
                <Sphere args={[3, 32, 32]} scale={[1, 1.3, 1]}>
                    <meshStandardMaterial
                        color={isEnraged ? "#004400" : "#00aa44"}
                        emissive={isEnraged ? "#ff0000" : "#00ff44"}
                        emissiveIntensity={isEnraged ? 1.5 : 0.5}
                        metalness={0.3}
                        roughness={0.7}
                    />
                </Sphere>

                {/* LEFT EYE - Big black alien eye */}
                <Sphere args={[1.2, 24, 24]} position={[-1.2, 0.5, 2]} scale={[1, 1.3, 0.6]}>
                    <meshBasicMaterial color="#000000" />
                </Sphere>
                <Sphere args={[0.3, 16, 16]} position={[-0.8, 0.8, 2.3]}>
                    <meshBasicMaterial color="#ffffff" />
                </Sphere>

                {/* RIGHT EYE */}
                <Sphere args={[1.2, 24, 24]} position={[1.2, 0.5, 2]} scale={[1, 1.3, 0.6]}>
                    <meshBasicMaterial color="#000000" />
                </Sphere>
                <Sphere args={[0.3, 16, 16]} position={[1.6, 0.8, 2.3]}>
                    <meshBasicMaterial color="#ffffff" />
                </Sphere>

                {/* Small mouth slit */}
                <Box args={[1.5, 0.15, 0.3]} position={[0, -1.5, 2.5]}>
                    <meshBasicMaterial color="#002211" />
                </Box>

                {/* BODY - Thin torso */}
                <Cylinder args={[1.5, 1, 4, 16]} position={[0, -5, 0]}>
                    <meshStandardMaterial
                        color={isEnraged ? "#003300" : "#00aa44"}
                        emissive={isEnraged ? "#ff0000" : "#00ff44"}
                        emissiveIntensity={0.3}
                    />
                </Cylinder>

                {/* LEFT ARM */}
                <Cylinder args={[0.2, 0.3, 5, 8]} position={[-2.5, -4, 0]} rotation={[0, 0, 0.5 + Math.sin(time * 2) * 0.2]}>
                    <meshStandardMaterial color="#00aa44" emissive="#00ff00" emissiveIntensity={0.2} />
                </Cylinder>
                <Sphere args={[0.4, 8, 8]} position={[-4.5 + Math.sin(time * 2) * 0.5, -6, 0]}>
                    <meshStandardMaterial color="#00cc55" />
                </Sphere>

                {/* RIGHT ARM */}
                <Cylinder args={[0.2, 0.3, 5, 8]} position={[2.5, -4, 0]} rotation={[0, 0, -0.5 - Math.sin(time * 2) * 0.2]}>
                    <meshStandardMaterial color="#00aa44" emissive="#00ff00" emissiveIntensity={0.2} />
                </Cylinder>
                <Sphere args={[0.4, 8, 8]} position={[4.5 - Math.sin(time * 2) * 0.5, -6, 0]}>
                    <meshStandardMaterial color="#00cc55" />
                </Sphere>

                {/* ANTENNA */}
                <Cylinder args={[0.08, 0.08, 2, 8]} position={[-0.8, 4, 0]} rotation={[0, 0, 0.2]}>
                    <meshBasicMaterial color="#00ff88" />
                </Cylinder>
                <Sphere args={[0.2, 8, 8]} position={[-1.2, 5, 0]}>
                    <meshBasicMaterial color={isEnraged ? "#ff0000" : "#00ffff"} />
                </Sphere>

                <Cylinder args={[0.08, 0.08, 2, 8]} position={[0.8, 4, 0]} rotation={[0, 0, -0.2]}>
                    <meshBasicMaterial color="#00ff88" />
                </Cylinder>
                <Sphere args={[0.2, 8, 8]} position={[1.2, 5, 0]}>
                    <meshBasicMaterial color={isEnraged ? "#ff0000" : "#00ffff"} />
                </Sphere>

                {/* Floating energy orbs */}
                {[...Array(3)].map((_, i) => (
                    <Sphere
                        key={`orb-${i}`}
                        args={[0.4, 8, 8]}
                        position={[
                            Math.sin(time + i * 2.1) * 5,
                            Math.cos(time * 1.3 + i) * 2,
                            Math.cos(time + i * 2.1) * 5
                        ]}
                    >
                        <meshBasicMaterial color={isEnraged ? "#ff0000" : "#00ff88"} />
                    </Sphere>
                ))}

                {/* HP Text */}
                <Text position={[0, 8, 0]} fontSize={1.5} color={isEnraged ? "#ff0000" : "#00ff00"} outlineWidth={0.1} outlineColor="black">
                    👽 {crowdState.bossHp} HP 👽
                </Text>
            </group>
        </>
    );
};

// ============================================
// GAME MANAGER
// ============================================
const GameManager = () => {
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [pickups, setPickups] = useState<Pickup[]>([]);
    const [traps, setTraps] = useState<Trap[]>([]);
    const [muzzleFlash, setMuzzleFlash] = useState(false);

    // Unified Spawn Logic
    const lastSpawnTime = useRef(0);
    const nextSpawnDelay = useRef(2);
    const ids = useRef({ enemy: 0, pickup: 0, trap: 0 });

    // NO-INSTANT-DEATH LOGIC
    const lastDamageTime = useRef(0); // Invulnerability timer

    const isDragging = useRef(false);
    const lastX = useRef(0);

    // ... (Mouse handlers skip)

    // ... (Listeners skip)

    const movementRef = useRef({ left: false, right: false });

    useEffect(() => {
        // KEYBOARD CONTROLS (A/D & ARROW KEYS)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') movementRef.current.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') movementRef.current.right = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') movementRef.current.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') movementRef.current.right = false;
        };

        const handleDown = (e: MouseEvent | TouchEvent) => {
            isDragging.current = true;
            lastX.current = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        };
        const handleUp = () => isDragging.current = false;
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
            const delta = clientX - lastX.current;
            lastX.current = clientX;
            crowdState.playerX = Math.max(-5, Math.min(5, crowdState.playerX + delta * 0.035));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchstart', handleDown);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);

    useFrame(({ clock }, delta) => {
        if (crowdState.status !== 'RUNNING') return;

        // Apply Keyboard Movement
        if (movementRef.current.left) crowdState.playerX = Math.max(-5, crowdState.playerX - 15 * delta);
        if (movementRef.current.right) crowdState.playerX = Math.min(5, crowdState.playerX + 15 * delta);

        crowdState.distance += RUN_SPEED * delta;

        const now = clock.getElapsedTime();

        // ==========================================
        // BOSS ARENA TRIGGER AT 700m
        // ==========================================
        if (crowdState.distance >= 700 && crowdState.status !== 'BOSS') {
            // CLEAR THE ARENA - Only Boss remains!
            setEnemies([]);
            setTraps([]);
            setPickups([]);
            triggerBoss(); // Switch to Boss Arena scene
            return; // Stop normal game loop
        }

        // When in BOSS mode, don't run spawn/update logic
        if (crowdState.status === 'BOSS') {
            return;
        }

        // UNIFIED SPAWN SYSTEM
        // Spawns one type of event at a time to prevent overlapping
        if (now - lastSpawnTime.current > nextSpawnDelay.current) {
            lastSpawnTime.current = now;
            // DYNAMIC DIFFICULTY: Spawns get slightly faster as you run, but capped at 1.2s
            const speedFactor = Math.min(0.6, crowdState.distance / 5000);
            nextSpawnDelay.current = 1.6 - speedFactor; // Starts at 1.6s, drops to 1.0s

            const spawnObject = (lane: number, type: 'HORDE' | 'PICKUP' | 'TRAP' | 'AMMO') => {
                const z = crowdState.distance + SPAWN_DISTANCE;

                // INTELLIGENT LANE LOGIC
                // If it's a Horde, prefer the wider lane or stick to one side to leave a path
                // For now, keep random but slightly biased to alternate if needed
                const finalLane = Math.random() > 0.5 ? LEFT_LANE : RIGHT_LANE;
                const useLane = lane === 0 ? finalLane : lane;

                if (type === 'HORDE') {
                    // Cap max enemies to prevent physics lag / clutter
                    const count = Math.min(8, 3 + Math.floor(Math.random() * 4) + Math.floor(crowdState.wave * 0.2));

                    const newEnemies = [];
                    // DEFINE ENEMY TYPE FOR THIS SQUAD
                    const enemyTypeRoll = Math.random();
                    let squadType: 'standard' | 'kamikaze' | 'tank' = 'standard';

                    if (enemyTypeRoll < 0.2) squadType = 'tank';
                    else if (enemyTypeRoll < 0.5) squadType = 'kamikaze';

                    for (let i = 0; i < count; i++) {
                        // BALANCED HP: 75% of weapon damage (Requested: "increase a bit")
                        let hp = Math.ceil(crowdState.weaponDamage * 0.75) + Math.floor(crowdState.wave * 0.5);
                        if (squadType === 'tank') hp *= 3;
                        if (squadType === 'kamikaze') hp = Math.max(1, Math.floor(hp * 0.6));

                        newEnemies.push({
                            id: ids.current.enemy++,
                            x: useLane + (Math.random() - 0.5) * 1.5, // Tighter Spread
                            z: z + (Math.random() * 6), // Longer column
                            hp, maxHp: hp,
                            type: squadType
                        });
                    }
                    setEnemies(prev => [...prev, ...newEnemies]);
                } else if (type === 'AMMO') {
                    setPickups(prev => [...prev, {
                        id: ids.current.pickup++,
                        x: useLane, z, type: 'ammo',
                        value: 50 + Math.floor(Math.random() * 50)
                    }]);
                } else if (type === 'PICKUP') {
                    // REBALANCED: Favor Soldiers (70%) over Weapons (30%)
                    const isWeapon = Math.random() > 0.7;
                    setPickups(prev => [...prev, {
                        id: ids.current.pickup++,
                        x: useLane, z,
                        type: isWeapon ? 'weapon' : 'soldier',
                        value: isWeapon ? 1 : (3 + Math.floor(Math.random() * 5))
                    }]);
                } else if (type === 'TRAP') {
                    setTraps(prev => [...prev, {
                        id: ids.current.trap++, x: useLane, z, type: 'spike'
                    }]);
                }
            };

            // DUAL CHOICE LOGIC - SERIOUS ACTION
            const roll = Math.random();
            if (roll < 0.30) {
                // REDUCED FREQUENCY: Enemies vs Ammo
                spawnObject(LEFT_LANE, 'HORDE');
                spawnObject(RIGHT_LANE, 'AMMO');
            } else if (roll < 0.80) {
                // HIGH FREQUENCY (50%): Trap vs Pickup (Soldiers!) (Randomized sides)
                if (Math.random() > 0.5) {
                    spawnObject(LEFT_LANE, 'TRAP');
                    spawnObject(RIGHT_LANE, 'PICKUP');
                } else {
                    spawnObject(RIGHT_LANE, 'TRAP');
                    spawnObject(LEFT_LANE, 'PICKUP');
                }
            } else {
                // REST (20%): Horde vs Horde
                spawnObject(LEFT_LANE, 'HORDE');
                spawnObject(RIGHT_LANE, 'HORDE');
            }
        }

        // Update enemies (KAMIKAZE RUSH LOGIC)
        setEnemies(prev => prev.map(e => {
            // MOVEMENT LOGIC
            let speedZ = 0;
            let speedX = 0;

            if (e.type === 'kamikaze') {
                speedZ = -8 * delta;
                speedX = (crowdState.playerX - e.x) * delta * 2;
            }

            const newZ = e.z + speedZ;
            const newX = e.x + speedX;

            // Collision with player
            if (newZ < crowdState.distance + 1 && Math.abs(newX - crowdState.playerX) < 1.8) {
                if (now - lastDamageTime.current > 0.5) {
                    lastDamageTime.current = now;
                    damagePlayer(5);
                    if (e.type === 'kamikaze') particleSystem.spawn(newX, newZ, '#ffaa00');
                    playSound('hit');
                }
                return null;
            }

            // Death check
            if (e.hp <= 0) {
                particleSystem.spawn(e.x, e.z, '#ff0044');
                addSoldiers(1);
                addScore(e.type === 'tank' ? 300 : 100);
                return null;
            }

            // Filter enemies behind player
            if (e.z < crowdState.distance - 8) return null;

            return { ...e, z: newZ, x: newX };
        }).filter(Boolean));

        // Update pickups (Handle negative soldiers)
        setPickups(prev => prev.map(p => {
            if (p.z < crowdState.distance + 1.5 && Math.abs(p.x - crowdState.playerX) < 2) {
                if (p.type === 'soldier') {
                    if (p.value > 0) addSoldiers(p.value);
                    else damagePlayer(Math.abs(p.value)); // Negative value damages player
                }
                else if (p.type === 'weapon') upgradeWeapon();
                else if (p.type === 'ammo') reloadAmmo(p.value);

                if (p.value > 0) addScore(20);
                return null;
            }
            if (p.z < crowdState.distance - 8) return null;
            return p;
        }).filter(Boolean));

        // Update traps
        setTraps(prev => prev.map(t => {
            if (t.z < crowdState.distance + 1.5 && Math.abs(t.x - crowdState.playerX) < 1.8) {
                damagePlayer(5); // Trap damage
                return null;
            }
            if (t.z < crowdState.distance - 8) return null;
            return t;
        }).filter(Boolean));


        // Wave
        if (enemies.length === 0 && now > 4) crowdState.wave++;
    });

    const handleHit = (id: number, dmg: number, type: string = 'standard') => {
        setEnemies(prev => prev.map(e => {
            if (e.id === id) {
                // Play specific sound
                if (e.type === 'standard') playSound('hit_flesh');
                else playSound('hit_metal');

                if (e.hp - dmg <= 0) {
                    addScore(e.maxHp * 2);

                    // XP REWARD (Fixed)
                    const leveledUp = addXp(20);
                    if (leveledUp) playSound('pickup');

                    // TRIGGER EXPLOSION
                    particleSystem.spawn(e.x, e.z, e.type === 'kamikaze' ? '#ffaa00' : '#ff0044');
                    if (e.type === 'kamikaze') playSound('explode'); // Boom only for kamikaze/big kills?
                    else playSound('hit_flesh'); // Final thud
                    return null;
                }
                return { ...e, hp: e.hp - dmg };
            }
            return e;
        }).filter(Boolean));
    };

    return (
        <>
            {traps.map(t => <TrapVisual key={t.id} trap={t} />)}
            {enemies.map(e => <EnemyVisual key={e.id} enemy={e} />)}
            {pickups.map(p => <PickupVisual key={p.id} pickup={p} />)}
            <Bullets enemies={enemies} onHit={handleHit} setFlash={setMuzzleFlash} />
            <MuzzleFlash active={muzzleFlash} />
        </>
    );
};

// ============================================
// HUD
// ============================================
const GameHUD = ({ onBack }: { onBack: () => void }) => {
    const [s, setS] = useState({
        soldiers: 5, ammo: 80, dmg: 3, weaponLvl: 1, score: 0, wave: 1,
        status: 'MENU' as 'MENU' | 'RUNNING' | 'BOSS' | 'VICTORY' | 'GAMEOVER',
        distance: 0, xp: 0, maxXp: 100, bossHp: 500, bossMaxHp: 500
    });

    useEffect(() => {
        const i = setInterval(() => setS({
            soldiers: crowdState.soldierCount,
            ammo: crowdState.ammo,
            dmg: crowdState.weaponDamage,
            weaponLvl: crowdState.weaponLevel,
            score: crowdState.score,
            wave: crowdState.wave,
            status: crowdState.status,
            distance: crowdState.distance,
            xp: crowdState.xp,
            maxXp: crowdState.maxXp,
            bossHp: crowdState.bossHp,
            bossMaxHp: crowdState.bossMaxHp
        }), 50);
        return () => clearInterval(i);
    }, []);

    // CLEAN / MODERN SPACE UI (Simplified based on feedback)
    const glassPanel = "bg-white/5 backdrop-blur-md border border-white/10 rounded-lg";

    if (s.status === 'MENU') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[100] pointer-events-auto">
                <div className="text-center p-8 bg-black/80 border border-cyan-500/30 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full mx-4">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
                        CROWD
                    </h1>
                    <h2 className="text-3xl font-bold text-white mb-6 tracking-[0.2em]">
                        RUNNER
                    </h2>

                    <button
                        onClick={() => {
                            console.log("Start button clicked");
                            startCrowdGame();
                            setS(prev => ({ ...prev, status: 'RUNNING' })); // Force immediate update
                        }}
                        className="w-full py-4 bg-white text-black font-bold text-xl rounded-xl hover:bg-cyan-50 transition-colors shadow-lg cursor-pointer transform active:scale-95"
                    >
                        START GAME
                    </button>

                    <button onClick={onBack} className="mt-6 text-white/40 text-sm hover:text-white cursor-pointer hover:underline">
                        BACK TO MENU
                    </button>

                    <div className="mt-4 text-xs text-white/20">
                        v2.0 - Space Edition
                    </div>
                </div>
            </div>
        );
    }

    if (s.status === 'GAMEOVER') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                <div className="text-center p-12 bg-black border border-white/10 rounded-2xl shadow-2xl">
                    <h1 className="text-4xl font-bold text-white mb-8 tracking-widest">GAME OVER</h1>

                    <div className="mb-8">
                        <div className="text-sm text-white/40 uppercase mb-1">Score</div>
                        <div className="text-5xl font-light text-cyan-400">{s.score}</div>
                    </div>

                    <button
                        onClick={startCrowdGame}
                        className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold text-lg rounded-full transition-transform hover:scale-105"
                    >
                        TRY AGAIN
                    </button>
                    <div className="mt-4">
                        <button onClick={onBack} className="text-white/30 text-xs hover:text-white">QUIT</button>
                    </div>
                </div>
            </div>
        );
    }

    if (s.status === 'VICTORY') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900/80 to-black/90 z-50">
                <div className="text-center p-12 bg-black/50 border-2 border-yellow-400/50 rounded-2xl shadow-2xl backdrop-blur-md">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">🏆 VICTORY! 🏆</h1>
                    <p className="text-xl text-white/60 mb-8">You defeated the Boss!</p>

                    <div className="mb-8">
                        <div className="text-sm text-white/40 uppercase mb-1">Final Score</div>
                        <div className="text-6xl font-light text-yellow-400">{s.score}</div>
                    </div>

                    <button
                        onClick={startCrowdGame}
                        className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold text-xl rounded-full transition-all hover:scale-105 shadow-lg"
                    >
                        PLAY AGAIN
                    </button>
                    <div className="mt-4">
                        <button onClick={onBack} className="text-white/30 text-sm hover:text-white">MAIN MENU</button>
                    </div>
                </div>
            </div>
        );
    }

    // Boss Arena HUD - Special overlay for boss fight
    if (s.status === 'BOSS') {
        const bossHpPercent = (s.bossHp / s.bossMaxHp) * 100;
        return (
            <div className="absolute inset-0 pointer-events-none z-10 p-6 font-sans">
                {/* BOSS FIGHT Banner */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-2xl font-bold text-red-500 tracking-widest animate-pulse">
                        ⚠ BOSS FIGHT ⚠
                    </div>
                </div>

                {/* Boss HP Bar */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2/3 max-w-lg">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>BOSS HP</span>
                        <span>{s.bossHp} / {s.bossMaxHp}</span>
                    </div>
                    <div className="w-full h-4 bg-black/50 border-2 border-red-600 rounded overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-100"
                            style={{ width: `${bossHpPercent}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-8 text-white">
                    <div className="text-center">
                        <div className="text-3xl font-light">{s.ammo}</div>
                        <div className="text-[10px] text-white/40 uppercase">AMMO</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-light">{s.soldiers}</div>
                        <div className="text-[10px] text-white/40 uppercase">SOLDIERS</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-light">{s.score}</div>
                        <div className="text-[10px] text-white/40 uppercase">SCORE</div>
                    </div>
                </div>

                {/* Exit Button */}
                <button
                    onClick={onBack}
                    className="pointer-events-auto absolute top-4 left-4 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs font-bold rounded-lg transition-colors"
                >
                    ✕ EXIT
                </button>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-10 p-6 font-sans">

            {/* Top Bar */}
            <div className="flex justify-between items-start">
                <button onClick={onBack} className="pointer-events-auto px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-xs font-bold rounded-lg transition-colors">
                    ✕ EXIT
                </button>

                {/* Score Board - Clean & Minimal */}
                <div className="flex flex-col items-center">
                    <div className="text-4xl font-light text-white drop-shadow-md">
                        {s.score}
                    </div>
                    <div className="text-[10px] text-white/40 tracking-widest uppercase mt-1">SCORE</div>
                </div>

                {/* Wave Indicator */}
                <div className="flex flex-col items-end">
                    <div className="bg-white/5 border border-white/10 px-3 py-1 rounded">
                        <div className="text-[10px] text-cyan-300 uppercase">WAVE {s.wave}</div>
                    </div>
                </div>
            </div>

            {/* Stats (Soldiers & Ammo) - Floating Minimal Cards */}
            <div className="absolute top-24 left-6 space-y-4">
                {/* Soldiers */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white leading-none">{s.soldiers}</div>
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">SOLDIERS</div>
                    </div>
                </div>

                {/* Weapon */}
                <div className="flex items-center gap-3 opacity-80">
                    <div>
                        <div className="text-lg font-bold text-pink-400">Lv.{s.weaponLvl}</div>
                        <div className="text-[10px] text-white/60 uppercase">WEAPON</div>
                    </div>
                </div>
            </div>

            {/* Ammo (Right Side) */}
            <div className="absolute top-24 right-6 text-right">
                <div className="flex flex-col items-end">
                    <div className="text-3xl font-bold text-yellow-400 leading-none">{s.ammo}</div>
                    <div className="text-[10px] text-yellow-200/60 font-bold uppercase tracking-wider">AMMO</div>
                </div>
            </div>

            {/* Distance (Bottom) */}
            <div className="absolute bottom-10 w-full text-center">
                <div className="inline-block px-4 py-1 rounded-full bg-black/40 backdrop-blur border border-white/5">
                    <span className="text-white/80 font-mono text-sm">{Math.floor(s.distance)}m</span>
                </div>
            </div>

            {/* XP BAR (Top Center) determines weapon upgrade */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1/3 max-w-sm">
                <div className="flex justify-between text-[10px] text-white/50 mb-1 font-bold uppercase tracking-widest">
                    <span>Weapon XP</span>
                    <span>Lvl {s.weaponLvl}</span>
                </div>
                <div className="w-full h-2 bg-black/50 border border-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                        style={{ width: `${(s.xp / s.maxXp) * 100}%` }}
                    />
                </div>
            </div>

            <div className="absolute bottom-24 w-full text-center">
                <p className="text-white/20 text-[10px] tracking-[0.3em] uppercase">DRAG TO MOVE</p>
            </div>
        </div>
    );
};

// ============================================
// MAIN CANVAS
// ============================================
// ============================================
// MAIN CANVAS
// ============================================
// ============================================
// MAIN CANVAS
// ============================================
// ============================================
// BIOME CONTROLLER (Must be inside Canvas)
// ============================================
const BiomeController = () => {
    const [biome, setBiome] = useState<'neon' | 'desert' | 'ice'>('neon');

    useFrame(() => {
        const dist = crowdState.distance;
        // Switch every 1000m
        if (dist > 2000) { if (biome !== 'ice') setBiome('ice'); }
        else if (dist > 1000) { if (biome !== 'desert') setBiome('desert'); }
        else { if (biome !== 'neon') setBiome('neon'); }
    });

    const colors = {
        neon: { sky: '#050510', fog: '#050510', light: '#d946ef', sun: '#ffaa00', grid: '#ff00ff' },
        desert: { sky: '#2a1a05', fog: '#2a1a05', light: '#ffaa00', sun: '#ffff00', grid: '#ff5500' },
        ice: { sky: '#001a1a', fog: '#001a1a', light: '#00ffff', sun: '#ffffff', grid: '#0088ff' }
    }[biome];

    return (
        <group>
            <color attach="background" args={[colors.sky]} />
            <fog attach="fog" args={[colors.fog, 60, 180]} />

            {/* Stars that follow the player */}
            <MovingStars />

            <ambientLight intensity={2.0} />
            <directionalLight position={[0, 10, -5]} intensity={3} color={colors.light} />
            <pointLight position={[12, 18, 8]} intensity={4} color="#00ffff" />
            <pointLight position={[-12, 8, -12]} intensity={4} color="#ff00ff" />
            <pointLight position={[0, 5, 10]} intensity={2} color="#ffffff" />

            {/* Environment Components taking biome props */}
            <RetroRoad width={14} length={500} gridColor={colors.grid} />
            <HorizonSun color={colors.sun} />
            <SpaceBackground />
        </group>
    );
};

// Stars that follow the player so they never disappear
const MovingStars = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.z = crowdState.distance;
        }
    });

    return (
        <group ref={groupRef}>
            <Stars radius={150} depth={80} count={8000} factor={5} saturation={1} fade speed={1} />
        </group>
    );
};

const CrowdRunnerCanvas = ({ onBack }: { onBack: () => void }) => {
    const [status, setStatus] = useState<'MENU' | 'RUNNING' | 'BOSS' | 'VICTORY' | 'GAMEOVER'>('MENU');

    // Sync status with crowdState
    useEffect(() => {
        const interval = setInterval(() => {
            if (status !== crowdState.status) {
                setStatus(crowdState.status);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="w-full h-screen relative overflow-hidden">
            {/* Space ambient music - plays when running or fighting boss */}
            <SpaceMusic active={status === 'RUNNING' || status === 'BOSS'} />
            <GameHUD onBack={onBack} />
            <Canvas shadows gl={{ antialias: true }} camera={{ fov: 60, position: [0, 8, -11] }}>
                {/* Always render both - let components handle visibility */}
                <BiomeController />
                <GameCamera />
                <PlayerArmy />
                <ExplosionSystem />
                <GameManager />
                {/* BossArena renders on top when status is BOSS */}
                {status === 'BOSS' && <BossArena />}
            </Canvas>
        </div>
    );
};

// ============================================
// THEME COMPONENTS
// ============================================

const RetroRoad = ({ width = 14, length = 500 }) => {
    const dashRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const dashCount = 40;

    useFrame(() => {
        if (groupRef.current) {
            // Move the entire road group with the player to avoid running out of road
            // The visual movement comes from the scrolling dashes
            groupRef.current.position.z = crowdState.distance;
        }

        if (dashRef.current) {
            for (let i = 0; i < dashCount; i++) {
                // Dashes scroll past and wrap around
                // The 'offset' moves them backwards relative to the group
                // Modulo length/dashCount ensures seamless looping
                const spacing = 12; // Distance between dashes
                const totalLength = dashCount * spacing;

                // Calculate z relative to player (who acts as 0 point for the group)
                // We want dashes to appear ahead and scroll behind
                const relativeZ = ((Date.now() * 0.016 * RUN_SPEED) + (i * spacing)) % totalLength;
                const finalZ = relativeZ - (totalLength / 2) + 50; // Shift to overlap view

                // Actually, simpler approach:
                // Just place them in a fixed grid relative to player
                // And shift them by (crowdState.distance % spacing)

                const lanePos = (i * spacing) - 100;
                // Scroll effect: move opposite to player movement direction relative to the road frame?
                // Wait, if road group moves WITH player, we need dashes to stay static in world?
                // No, standard runner: Ground moves with player, texture scrolls.
                // Here: We move dashes opposite to simulate speed if road is static relative to player.

                // CORRECTION:
                // Let the road group stay at z=0 (world). 
                // Actually, best "infinite" effect:
                // Move group with player, but offset children by -(distance % spacing).
            }
        }
    });

    // Better Logic: Simple Tiled Road
    // We just render the road centered at the player.
    // The "movement" is an illusion if it's a solid color.
    // But for grid/dashes, we need to scroll the texture or positions.

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.z = crowdState.distance;
        }
        if (dashRef.current) {
            const spacing = 15;
            const totalLen = dashCount * spacing;

            for (let i = 0; i < dashCount; i++) {
                // Static relative positions
                let z = (i * spacing) - 100; // Start from behind
                // Scroll: Decrease Z based on distance
                // Since group moves with player, we need dashes to "move back" relative to group? 
                // No, dashes are paint on the road. They should be fixed on the road.
                // If Road moves with Player, dashes move with Player. This looks like sliding on ice.
                // CORRECT: Road stays at (0,0,0) world, but we teleport it to player.
                // To simulate movement, we offset dashes by -(totalDistance % spacing).

                let offset = -(crowdState.distance % spacing);
                dummy.position.set(0, 0.12, z + offset + 50); // +50 to center ahead
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                dashRef.current.setMatrixAt(i, dummy.matrix);
            }
            dashRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Road Visuals - Always centered on player */}
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial color="#070711" roughness={0.9} metalness={0.1} />
            </mesh>
            {/* Neon Edges */}
            <mesh position={[-width / 2 + 0.25, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, length]} />
                <meshBasicMaterial color="#ff00ff" />
            </mesh>
            <mesh position={[+width / 2 - 0.25, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.22, length]} />
                <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* Dashes */}
            <instancedMesh ref={dashRef} args={[undefined, undefined, dashCount]}>
                <planeGeometry args={[0.22, 4]} />
                <meshBasicMaterial color="#ffe17a" />
            </instancedMesh>
        </group>
    );
};

const HorizonSun = () => {
    const sunRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (!sunRef.current) return;
        sunRef.current.position.set(0, 16, crowdState.distance + 250); // FAR AHEAD
    });
    return (
        <group ref={sunRef}>
            <mesh>
                <circleGeometry args={[40, 24]} />
                <meshBasicMaterial color="#ffaa00" fog={false} />
            </mesh>
            {[...Array(5)].map((_, i) => (
                <mesh key={i} position={[0, -10 + i * 5, 0.2]}>
                    <planeGeometry args={[80, 2.5]} />
                    <meshBasicMaterial color="#1a0b2e" fog={false} />
                </mesh>
            ))}
        </group>
    );
};

const SpaceBackground = () => {
    const groupRef = useRef<THREE.Group>(null);
    const planet1Ref = useRef<THREE.Mesh>(null);
    const planet2Ref = useRef<THREE.Mesh>(null);
    const planet3Ref = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (groupRef.current) groupRef.current.position.z = crowdState.distance;

        // Slow planet rotation
        if (planet1Ref.current) planet1Ref.current.rotation.y += delta * 0.02;
        if (planet2Ref.current) planet2Ref.current.rotation.y += delta * 0.015;
        if (planet3Ref.current) planet3Ref.current.rotation.y += delta * 0.03;
    });

    return (
        <group ref={groupRef}>
            {/* Gas Giant with Rings (Saturn-like) - Far left */}
            <group position={[-120, 50, 200]}>
                <mesh ref={planet1Ref}>
                    <sphereGeometry args={[30, 64, 64]} />
                    <meshStandardMaterial
                        color="#d4a574"
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>
                {/* Rings */}
                <mesh rotation={[1.2, 0.3, 0]}>
                    <ringGeometry args={[38, 55, 64]} />
                    <meshBasicMaterial color="#c4956a" side={THREE.DoubleSide} transparent opacity={0.6} />
                </mesh>
            </group>

            {/* Blue Neptune-like Planet - Right */}
            <group position={[150, 70, 250]}>
                <mesh ref={planet2Ref}>
                    <sphereGeometry args={[35, 64, 64]} />
                    <meshStandardMaterial
                        color="#4169e1"
                        roughness={0.5}
                        metalness={0.2}
                    />
                </mesh>
                {/* Atmosphere glow */}
                <mesh>
                    <sphereGeometry args={[37, 32, 32]} />
                    <meshBasicMaterial color="#6495ed" transparent opacity={0.15} />
                </mesh>
            </group>

            {/* Red Mars-like Planet - Closer */}
            <group position={[70, 35, 150]}>
                <mesh ref={planet3Ref}>
                    <sphereGeometry args={[12, 48, 48]} />
                    <meshStandardMaterial
                        color="#cd5c5c"
                        roughness={0.9}
                        metalness={0}
                    />
                </mesh>
            </group>

            {/* Distant small moons */}
            <mesh position={[-90, 60, 180]}>
                <sphereGeometry args={[4, 16, 16]} />
                <meshStandardMaterial color="#a0a0a0" roughness={1} />
            </mesh>
            <mesh position={[180, 45, 280]}>
                <sphereGeometry args={[6, 16, 16]} />
                <meshStandardMaterial color="#707070" roughness={1} />
            </mesh>
        </group>
    )
};

export default CrowdRunnerCanvas;
