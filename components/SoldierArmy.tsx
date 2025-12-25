// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';
import { GamePhase } from '../types';

const SoldierArmy: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const [renderCount, setRenderCount] = useState(10);
    const [time, setTime] = useState(0); // STATE for animation (Fixes "not running")
    const gs = gameStateRef.current; // Define gs here for render usage

    useFrame((state) => {
        const gs = gameStateRef.current;
        setTime(state.clock.getElapsedTime()); // Trigger render every frame

        // Hide in SHOOTER mode
        if (gs.gameMode !== 'HYPER_CASUAL') {
            if (groupRef.current) groupRef.current.visible = false;
            return;
        }

        // Show and position in HYPER_CASUAL
        if (groupRef.current) {
            groupRef.current.visible = true;
            groupRef.current.position.x = gs.player.x;
            // Position slightly behind player
            groupRef.current.position.z = gs.distance + 4;
        }

        // Update count
        const count = gs.hyperCasual?.soldierCount || 10;
        if (count !== renderCount) {
            setRenderCount(count);
        }
    });

    // User said "Render sayısını 100 e sabitleyelim"
    const displayCount = Math.min(renderCount, 100);

    // Animation calculations
    const bounce = Math.sin(time * 12) * 0.1;

    // Check if in boss fight for attack visuals
    const isBossFight = gameStateRef.current?.phase === GamePhase.BOSS_FIGHT;
    const bossZ = gameStateRef.current?.boss?.z || -1000;

    return (
        <group ref={groupRef}>
            {/* ===== LEADER CHARACTER (CENTER) ===== */}
            <group position={[0, 0.8 + bounce, 0]}>
                <Box args={[1, 1.4, 0.6]}>
                    <meshBasicMaterial color="#00ffff" />
                </Box>
                <Sphere args={[0.4, 12, 12]} position={[0, 0.9, 0]}>
                    <meshBasicMaterial color="#ffddaa" />
                </Sphere>
                {/* Eyes */}
                <Sphere args={[0.08, 8, 8]} position={[-0.15, 0.95, 0.35]}>
                    <meshBasicMaterial color="#000000" />
                </Sphere>
                <Sphere args={[0.08, 8, 8]} position={[0.15, 0.95, 0.35]}>
                    <meshBasicMaterial color="#000000" />
                </Sphere>
                {/* Weapon */}
                <Box args={[0.2, 0.2, 0.8]} position={[0.6, 0.1, 0.2]}>
                    <meshBasicMaterial color="#333333" />
                </Box>
            </group>

            {/* ===== ARMY OF SOLDIERS ===== */}
            {Array.from({ length: displayCount }).map((_, i) => {
                // Determine row/col - Wider wedge formation
                const row = Math.floor(i / 10); // 10 columns wide
                const col = i % 10;

                // Spread out
                const zOffset = 2 + row * 0.6;
                const xOffset = (col - 4.5) * 0.6 + (Math.sin(i * 132) * 0.1);

                // STADIUM EFFECT: Rear soldiers are higher up!
                const yStadium = row * 0.1; // Each row 0.1 higher

                // JUMP / Y-OFFSET from Player Physics
                const jumpY = (gs.player.y || 0.5) - 0.5;

                // Animation offset
                const offset = i * 0.1;
                const sBounce = Math.sin(time * 15 + offset) * 0.08;
                const sLeg = Math.sin(time * 20 + offset) * 0.4;

                // Shoots laser if boss fight
                const shootsLaser = isBossFight && Math.random() < 0.1;

                return (
                    <group key={i} position={[xOffset, 0.4 + sBounce + yStadium + jumpY, zOffset]}>
                        {/* Body */}
                        <Cylinder args={[0.15, 0.2, 0.6, 8]} position={[0, 0, 0]}>
                            <meshBasicMaterial color="#00aaff" />
                        </Cylinder>
                        {/* Head */}
                        <Sphere args={[0.18, 8, 8]} position={[0, 0.45, 0]}>
                            <meshBasicMaterial color="#ffcc99" />
                        </Sphere>
                        {/* Running Legs */}
                        <Cylinder
                            args={[0.05, 0.05, 0.3, 4]}
                            position={[-0.1, -0.4, sLeg * 0.1]}
                            rotation={[sLeg, 0, 0]}
                        >
                            <meshBasicMaterial color="#0000cc" />
                        </Cylinder>
                        <Cylinder
                            args={[0.05, 0.05, 0.3, 4]}
                            position={[0.1, -0.4, -sLeg * 0.1]}
                            rotation={[-sLeg, 0, 0]}
                        >
                            <meshBasicMaterial color="#0000cc" />
                        </Cylinder>

                        {/* LASER BEAM TO BOSS */}
                        {shootsLaser && (
                            <mesh position={[0, 0.5, (bossZ - (gameStateRef.current.distance + 4 + zOffset)) / 2]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.02, 0.02, Math.abs(bossZ - (gameStateRef.current.distance + 4 + zOffset)), 4]} />
                                <meshBasicMaterial color="#ffff00" transparent opacity={0.6} />
                            </mesh>
                        )}
                    </group>
                );
            })}

            {/* COUNT DISPLAY */}
            <Text
                position={[0, 4, 0]}
                fontSize={renderCount > 100 ? 3 : 2}
                color={renderCount >= 50 ? '#00ff00' : '#ffffff'}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.2}
                outlineColor="#000000"
            >
                {renderCount} ASKER
            </Text>
        </group>
    );
};

export default SoldierArmy;
