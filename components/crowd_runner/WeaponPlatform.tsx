// @ts-nocheck
/**
 * WeaponPlatform.tsx - Ammo pickups on RIGHT lane
 * Shows ammo value (489, 200) - picking up refills ammo
 */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Box } from '@react-three/drei';
import { crowdState, reloadAmmo, RIGHT_LANE_X } from './crowdState';

interface WeaponPlatformProps {
    z: number;
    ammoValue: number;
    onCollected?: () => void;
}

const WeaponPlatform = ({ z, ammoValue, onCollected }: WeaponPlatformProps) => {
    const [collected, setCollected] = useState(false);
    const platformRef = useRef<any>(null);

    useFrame(({ clock }) => {
        if (collected || crowdState.status !== 'RUNNING') return;

        // Spin and float animation
        if (platformRef.current) {
            platformRef.current.rotation.y += 0.02;
            platformRef.current.position.y = 1.2 + Math.sin(clock.getElapsedTime() * 2.5) * 0.3;
        }

        const playerZ = crowdState.distance;
        const playerX = crowdState.laneX;

        // Check collection
        if (Math.abs(z - playerZ) < 2 && Math.abs(RIGHT_LANE_X - playerX) < 2.5) {
            reloadAmmo(ammoValue);
            onCollected?.();
            setCollected(true);
        }
    });

    if (collected) return null;

    return (
        <group position={[RIGHT_LANE_X, 0, z]}>
            {/* Base platform - orange disc */}
            <Cylinder args={[2.5, 2.5, 0.3, 32]} position={[0, 0.15, 0]}>
                <meshStandardMaterial color="#FF9800" emissive="#E65100" emissiveIntensity={0.4} />
            </Cylinder>

            {/* Floating weapon group */}
            <group ref={platformRef} position={[0, 1.2, 0]}>
                {/* Simple gun model */}
                <Box args={[0.3, 0.3, 1.5]} position={[0, 0, 0]}>
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </Box>
                <Box args={[0.15, 0.4, 0.3]} position={[0, -0.2, -0.5]}>
                    <meshStandardMaterial color="#222" />
                </Box>
            </group>

            {/* Ammo value - big floating number */}
            <Text
                position={[0, 4, 0]}
                rotation={[0, Math.PI, 0]}
                fontSize={1.8}
                color="#FFEB3B"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.12}
                outlineColor="#000"
                font={undefined}
            >
                {ammoValue}
            </Text>

            {/* Glow effect */}
            <pointLight position={[0, 1.5, 0]} color="#FF9800" intensity={0.5} distance={5} />
        </group>
    );
};

export default WeaponPlatform;
export { WeaponPlatform };
