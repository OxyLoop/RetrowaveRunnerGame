// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';

const EndermanBoss: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const [time, setTime] = useState(0);

    useFrame((state) => {
        const gs = gameStateRef.current;
        const phase = gs.phase;

        // Visual logic based on health
        setTime(state.clock.getElapsedTime());

        const boss = gs.boss;
        if (!gameStateRef.current.boss.isActive) return;

        if (groupRef.current) {
            // Update Z position from game state!
            groupRef.current.position.z = boss.z;

            // "Teleport" glitch effect when hit
            const healthPercent = boss.currentHp / boss.maxHp;
            const glitch = healthPercent < 0.5 ? Math.random() < 0.1 : false;

            groupRef.current.position.x = glitch ? (Math.random() - 0.5) * 5 : 0;
            groupRef.current.position.y = 3 + Math.sin(time * 1.5) * 0.5;

            // Look angry (vibrate)
            if (healthPercent < 0.3) {
                groupRef.current.position.x += (Math.random() - 0.5) * 0.2;
            }
        }
    });

    // Animation constants
    const armAngle = Math.sin(time * 2) * 0.1;

    return (
        <group ref={groupRef}>
            {/* SCALE UP - It's a BOSS */}
            <group scale={[3, 3, 3]}>

                {/* HEAD */}
                <Box args={[0.8, 0.8, 0.8]} position={[0, 2.4, 0]}>
                    <meshStandardMaterial color="#1a1a1a" />
                </Box>

                {/* EYES - Glowing Purple/Pink */}
                <Box args={[0.2, 0.1, 0.05]} position={[-0.2, 2.3, 0.41]}>
                    <meshBasicMaterial color="#ff00ff" />
                </Box>
                <Box args={[0.2, 0.1, 0.05]} position={[0.2, 2.3, 0.41]}>
                    <meshBasicMaterial color="#ff00ff" />
                </Box>

                {/* TORSO */}
                <Box args={[0.6, 1.2, 0.4]} position={[0, 1.4, 0]}>
                    <meshStandardMaterial color="#1a1a1a" />
                </Box>

                {/* ARMS - Long and thin */}
                <group position={[-0.4, 1.8, 0]} rotation={[0, 0, armAngle + 0.1]}>
                    <Box args={[0.2, 1.8, 0.2]} position={[0, -0.8, 0]}>
                        <meshStandardMaterial color="#1a1a1a" />
                    </Box>
                </group>
                <group position={[0.4, 1.8, 0]} rotation={[0, 0, -armAngle - 0.1]}>
                    <Box args={[0.2, 1.8, 0.2]} position={[0, -0.8, 0]}>
                        <meshStandardMaterial color="#1a1a1a" />
                    </Box>
                </group>

                {/* LEGS - Long */}
                <Box args={[0.2, 1.6, 0.2]} position={[-0.15, 0, 0]}>
                    <meshStandardMaterial color="#1a1a1a" />
                </Box>
                <Box args={[0.2, 1.6, 0.2]} position={[0.15, 0, 0]}>
                    <meshStandardMaterial color="#1a1a1a" />
                </Box>

                {/* ENDER PARTICLES */}
                <pointLight position={[0, 2, 1]} color="#ff00ff" intensity={2} distance={5} />
            </group>

            {/* Boss Name Tag in 3D */}
            <Text
                position={[0, 9, 0]}
                fontSize={1}
                color="#ff00ff"
                outlineWidth={0.05}
                outlineColor="#000000"
            >
                ENDER BOSS
            </Text>
        </group>
    );
};

export default EndermanBoss;
