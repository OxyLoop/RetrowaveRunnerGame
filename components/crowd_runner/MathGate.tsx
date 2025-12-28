// @ts-nocheck
/**
 * MathGate.tsx - Gates that add/multiply soldiers (+5, x2)
 * Located on LEFT lane
 */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Cylinder } from '@react-three/drei';
import { crowdState, modifySoldiers, multiplySoldiers, LEFT_LANE_X } from './crowdState';

interface MathGateProps {
    z: number;
    value: number;
    operation: 'add' | 'multiply';
    onCollected?: () => void;
}

const MathGate = ({ z, value, operation, onCollected }: MathGateProps) => {
    const [collected, setCollected] = useState(false);

    useFrame(() => {
        if (collected || crowdState.status !== 'RUNNING') return;

        const playerZ = crowdState.distance;
        const playerX = crowdState.laneX;

        // Check if player passed through gate
        if (Math.abs(z - playerZ) < 1.5 && Math.abs(LEFT_LANE_X - playerX) < 3) {
            if (operation === 'add') {
                modifySoldiers(value);
            } else {
                multiplySoldiers(value);
            }
            onCollected?.();
            setCollected(true);
        }
    });

    if (collected) return null;

    const isMultiply = operation === 'multiply';
    const color = isMultiply ? '#00BCD4' : '#4CAF50';
    const text = isMultiply ? `x${value}` : `+${value}`;

    return (
        <group position={[LEFT_LANE_X, 0, z]}>
            {/* Gate panel */}
            <Box args={[5, 4.5, 0.3]} position={[0, 2.25, 0]}>
                <meshStandardMaterial color={color} transparent opacity={0.6} />
            </Box>

            {/* Outer frame */}
            <Box args={[5.3, 4.8, 0.2]} position={[0, 2.25, 0]}>
                <meshBasicMaterial color={color} wireframe />
            </Box>

            {/* Left pillar */}
            <Cylinder args={[0.2, 0.2, 4.5]} position={[-2.5, 2.25, 0]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>

            {/* Right pillar */}
            <Cylinder args={[0.2, 0.2, 4.5]} position={[2.5, 2.25, 0]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>

            {/* Gate text */}
            <Text
                position={[0, 2.5, 0.2]}
                rotation={[0, Math.PI, 0]}
                fontSize={2}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.1}
                outlineColor={color}
                font={undefined}
            >
                {text}
            </Text>
        </group>
    );
};

export default MathGate;
export { MathGate };
