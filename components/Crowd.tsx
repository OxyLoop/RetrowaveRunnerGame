// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Text } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';
import { GamePhase } from '../types';
import { COLORS } from '../constants';

// Visual crowd that shows the player's coin count as running figures
const Crowd: React.FC = () => {
    const crowdRef = useRef<THREE.Group>(null);
    const targetCount = useRef(10);
    const displayCount = useRef(10);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        if (gs.phase !== GamePhase.RUNNING && gs.phase !== GamePhase.BOSS_FIGHT) return;

        // Calculate crowd count based on currency (more coins = bigger crowd)
        const baseCount = 5;
        const coinBonus = Math.floor(gs.player.currency / 10);
        targetCount.current = Math.min(50, Math.max(5, baseCount + coinBonus));

        // Smoothly animate count changes
        displayCount.current = THREE.MathUtils.lerp(displayCount.current, targetCount.current, delta * 3);

        if (!crowdRef.current) return;

        // Position crowd behind player
        crowdRef.current.position.z = gs.distance;
        crowdRef.current.position.x = gs.player.x;

        // Animate crowd bobbing
        const time = state.clock.getElapsedTime();
        crowdRef.current.children.forEach((child, idx) => {
            if (child.type === 'Group' || child.type === 'Mesh') {
                const row = Math.floor(idx / 5);
                const col = idx % 5;
                child.position.y = 0.8 + Math.sin(time * 8 + idx * 0.5) * 0.15;
            }
        });
    });

    // Generate crowd positions
    const crowdPositions = useMemo(() => {
        const positions: { x: number, z: number, color: string }[] = [];
        const count = 30; // max crowd

        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5 - 2;
            positions.push({
                x: col * 0.8 + (row % 2) * 0.4,
                z: row * 0.7 + 1,
                color: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff6600'][i % 5]
            });
        }
        return positions;
    }, []);

    return (
        <group ref={crowdRef}>
            {crowdPositions.map((pos, idx) => (
                <group
                    key={idx}
                    position={[pos.x, 0.8, pos.z]}
                    visible={idx < Math.round(displayCount.current)}
                >
                    {/* Body */}
                    <Box args={[0.4, 0.6, 0.3]}>
                        <meshStandardMaterial
                            color={pos.color}
                            emissive={pos.color}
                            emissiveIntensity={0.5}
                            toneMapped={false}
                        />
                    </Box>
                    {/* Head */}
                    <Sphere args={[0.2, 6, 6]} position={[0, 0.45, 0]}>
                        <meshStandardMaterial
                            color="#ffffff"
                            emissive={pos.color}
                            emissiveIntensity={0.3}
                            toneMapped={false}
                        />
                    </Sphere>
                    {/* Legs animation hint */}
                    <Box args={[0.12, 0.25, 0.12]} position={[-0.1, -0.4, 0]}>
                        <meshStandardMaterial color="#333333" />
                    </Box>
                    <Box args={[0.12, 0.25, 0.12]} position={[0.1, -0.4, 0]}>
                        <meshStandardMaterial color="#333333" />
                    </Box>
                </group>
            ))}

            {/* Crowd count display */}
            <Text
                position={[0, 2.5, 0]}
                fontSize={0.8}
                color="#00ffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.03}
                outlineColor="#000000"
            >
                {Math.round(displayCount.current)}
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </Text>
        </group>
    );
};

export default Crowd;
