// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';
import { GamePhase } from '../types';
import { addFloatingText } from './FloatingText';
import { TRACK_WIDTH } from '../constants';

interface Obstacle {
    id: number;
    type: 'SAW' | 'RAMP';
    x: number;
    z: number;
    passed: boolean;
}

let obsId = 0;

const Obstacles: React.FC = () => {
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const lastSpawnRef = useRef(0);
    const groupRef = useRef<THREE.Group>(null);
    const [time, setTime] = useState(0);

    useFrame((state) => {
        const gs = gameStateRef.current;
        setTime(state.clock.getElapsedTime());

        // Hide if not Hyper Casual or if Boss Fight
        if (gs.gameMode !== 'HYPER_CASUAL' || gs.phase === GamePhase.BOSS_FIGHT) {
            if (groupRef.current) groupRef.current.visible = false;
            if (gs.phase === GamePhase.BOSS_FIGHT && obstaclesRef.current.length > 0) {
                obstaclesRef.current = []; // Cleanup on boss
                setObstacles([]);
            }
            return;
        }

        if (groupRef.current) groupRef.current.visible = true;
        if (gs.phase !== GamePhase.RUNNING) return;

        // ===== SPAWN OBSTACLES =====
        // Spawn less frequently than gates
        const spawnDistance = 60;
        if (Math.abs(gs.distance - lastSpawnRef.current) > spawnDistance) {
            lastSpawnRef.current = gs.distance;

            // 50% chance for Ramp, 50% for Saw
            const isRamp = Math.random() < 0.5;
            const type = isRamp ? 'RAMP' : 'SAW';

            // Random lane position
            // Lanes are roughly -4, 0, 4
            const lanes = [-TRACK_WIDTH / 3, 0, TRACK_WIDTH / 3];
            const x = lanes[Math.floor(Math.random() * lanes.length)];

            const newObs: Obstacle = {
                id: ++obsId,
                type,
                x,
                z: gs.distance - 60, // Spawn ahead
                passed: false
            };

            obstaclesRef.current.push(newObs);
            // Don't clutter state too much, but need to render
            setObstacles([...obstaclesRef.current]);
        }

        // ===== LOGIC & COLLISION =====
        const playerX = gs.player.x;
        const playerZ = gs.distance;

        // Handle Ramps affecting player height globally? 
        // Or just let visual effect happen?
        // Let's modify gs.player.y if on ramp.
        let onRamp = false;

        obstaclesRef.current.forEach(obs => {
            const dz = obs.z - playerZ;
            const dx = Math.abs(obs.x - playerX);

            // SAW COLLISION
            if (obs.type === 'SAW') {
                // Saws hurt if you touch them
                // Hitbox: 2 units wide, 1 unit deep
                if (Math.abs(dz) < 1 && dx < 2.5) {
                    if (!obs.passed) { // Continuous damage? Or once? Let's do continuous frame damage heavily
                        // Just damage
                        if (Math.random() < 0.2) { // Throttle damage
                            const damage = 5;
                            gs.hyperCasual.soldierCount = Math.max(0, gs.hyperCasual.soldierCount - damage);
                            addFloatingText(`-${damage} 🩸`, playerX, 2, playerZ + 5, '#ff0000');
                            gs.screenShake = 0.2;
                        }
                    }
                }
            }

            // RAMP LOGIC
            // If on ramp, fly!
            if (obs.type === 'RAMP') {
                if (Math.abs(dz) < 6 && dx < 4) { // Widen hitbox (was 5/3)
                    onRamp = true;
                    // Calculate height based on progress on ramp
                    // Simple jump arc
                    if (!gs.player.isJumping) {
                        console.log('[Obstacles] RAMP HIT! Launching player!');
                        gs.player.velocity.y = 15; // Launch Higher (was 10)
                        gs.player.isJumping = true;
                        addFloatingText("FLY! 🦅", playerX, 4, playerZ + 10, '#00ffff');
                    }
                }
            }

            // Cleanup far behind
            if (dz > 20) {
                obs.passed = true;
            }
        });

        // Cleanup array
        const activeCount = obstaclesRef.current.length;
        obstaclesRef.current = obstaclesRef.current.filter(o => (o.z - playerZ) < 50); // Remove if too far passed

        if (obstaclesRef.current.length !== activeCount) {
            setObstacles([...obstaclesRef.current]);
        }
    });

    return (
        <group ref={groupRef}>
            {obstacles.map(obs => (
                <group key={obs.id} position={[obs.x, 0, obs.z]}>
                    {obs.type === 'SAW' && (
                        <group>
                            {/* Spinning Saw Blade */}
                            <group rotation={[time * 5, 0, 0]} position={[0, 1, 0]}>
                                <Cylinder args={[1.5, 1.5, 0.2, 16]} rotation={[0, 0, Math.PI / 2]}>
                                    <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
                                </Cylinder>
                                {/* Teeth visual */}
                                <Box args={[3.2, 0.4, 0.1]} rotation={[0, 0, Math.PI / 4]}>
                                    <meshStandardMaterial color="#aa0000" />
                                </Box>
                                <Box args={[3.2, 0.4, 0.1]} rotation={[0, 0, -Math.PI / 4]}>
                                    <meshStandardMaterial color="#aa0000" />
                                </Box>
                            </group>
                            {/* Base */}
                            <Box args={[3, 0.2, 1]} position={[0, 0.1, 0]}>
                                <meshStandardMaterial color="#444" />
                            </Box>
                        </group>
                    )}

                    {obs.type === 'RAMP' && (
                        <group>
                            {/* Ramp Shape: Triangle Wedge */}
                            {/* Using Box rotated is easiest for simple shape */}
                            <group rotation={[-0.2, 0, 0]} position={[0, 0.5, 0]}>
                                <Box args={[3.5, 0.5, 8]}>
                                    <meshStandardMaterial color="#ffff00" emissive="#aa7700" />
                                </Box>
                                {/* Boost arrows texture simulated with boxes */}
                                <Box args={[2, 0.1, 1]} position={[0, 0.26, -2]} rotation={[0, 0, 0]}>
                                    <meshBasicMaterial color="#000" />
                                </Box>
                                <Box args={[2, 0.1, 1]} position={[0, 0.26, 0]} rotation={[0, 0, 0]}>
                                    <meshBasicMaterial color="#000" />
                                </Box>
                                <Box args={[2, 0.1, 1]} position={[0, 0.26, 2]} rotation={[0, 0, 0]}>
                                    <meshBasicMaterial color="#000" />
                                </Box>
                            </group>
                        </group>
                    )}
                </group>
            ))}
        </group>
    );
};

export default Obstacles;
