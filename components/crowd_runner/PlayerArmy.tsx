// @ts-nocheck
/**
 * PlayerArmy.tsx - Blue soldier group on RIGHT side
 * Moves UP/DOWN with player input
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { crowdState, PLAYER_X } from './crowdState';

const dummy = new THREE.Object3D();

const PlayerArmy = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const maxSoldiers = 200;

    const geometry = useMemo(() => new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), []);
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#2196F3',
        emissive: '#1565C0',
        emissiveIntensity: 0.4,
        roughness: 0.3
    }), []);

    useFrame(({ clock }) => {
        if (!meshRef.current || crowdState.status !== 'RUNNING') return;

        // Display count based on soldier count (capped for visual)
        const displayCount = Math.min(Math.floor(crowdState.soldierCount / 2), maxSoldiers);
        const time = clock.getElapsedTime();

        for (let i = 0; i < displayCount; i++) {
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const radius = Math.sqrt(i) * 0.35;
            const angle = i * goldenAngle;

            const offsetX = Math.cos(angle) * radius;
            const offsetZ = Math.sin(angle) * radius;

            // Bounce animation
            const bounce = Math.sin(time * 10 + i * 0.3) * 0.05;

            dummy.position.set(
                PLAYER_X + offsetX,
                0.4 + bounce,
                crowdState.playerY + offsetZ
            );
            dummy.rotation.set(0, -Math.PI / 2, 0); // Face left (enemies)
            dummy.scale.setScalar(1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        // Hide unused
        for (let i = displayCount; i < maxSoldiers; i++) {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh ref={meshRef} args={[geometry, material, maxSoldiers]} castShadow />

            {/* Soldier count above */}
            <PlayerHPText />

            {/* Weapon indicator */}
            <WeaponVisual />
        </group>
    );
};

// HP/Soldier count floating text
const PlayerHPText = () => {
    const textRef = useRef<any>(null);

    useFrame(() => {
        if (textRef.current) {
            textRef.current.position.set(PLAYER_X, 3.5, crowdState.playerY);
        }
    });

    return (
        <Text
            ref={textRef}
            position={[PLAYER_X, 3.5, 0]}
            fontSize={1}
            color="#2196F3"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#000"
        >
            {crowdState.soldierCount}
        </Text>
    );
};

// Visual weapon on player
const WeaponVisual = () => {
    const groupRef = useRef<any>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.set(PLAYER_X - 0.5, 0.8, crowdState.playerY);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Gun barrel pointing left */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.12, 1.5, 8]} />
                <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
            </mesh>
        </group>
    );
};

export default PlayerArmy;
