// @ts-nocheck
/**
 * EnemyHorde.tsx - Red enemy soldiers on LEFT lane
 */
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { crowdState, modifySoldiers, LEFT_LANE_X } from './crowdState';

const dummy = new THREE.Object3D();

interface EnemyHordeProps {
    z: number;
    hp: number;
    onDestroyed?: () => void;
}

const EnemyHorde = ({ z, hp: initialHp, onDestroyed }: EnemyHordeProps) => {
    const [hp, setHp] = useState(initialHp);
    const [destroyed, setDestroyed] = useState(false);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const textRef = useRef<any>(null);

    const maxDisplay = Math.min(100, initialHp);

    const geometry = useMemo(() => new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), []);
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#f44336',
        emissive: '#b71c1c',
        emissiveIntensity: 0.3,
        roughness: 0.4
    }), []);

    useFrame(({ clock }) => {
        if (destroyed || crowdState.status !== 'RUNNING') return;

        const time = clock.getElapsedTime();
        const playerZ = crowdState.distance;

        // Update text position to face camera
        if (textRef.current) {
            textRef.current.position.set(LEFT_LANE_X, 4, z);
        }

        // Display soldiers
        if (meshRef.current) {
            const displayCount = Math.min(hp, maxDisplay);

            for (let i = 0; i < displayCount; i++) {
                const angle = i * 2.39996;
                const radius = Math.sqrt(i) * 0.4;

                dummy.position.set(
                    LEFT_LANE_X + Math.cos(angle) * radius,
                    0.4 + Math.sin(time * 10 + i) * 0.05,
                    z + Math.sin(angle) * radius
                );
                dummy.rotation.set(0, Math.PI, 0);
                dummy.scale.setScalar(1);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }

            // Hide rest
            for (let i = displayCount; i < maxDisplay; i++) {
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }

            meshRef.current.instanceMatrix.needsUpdate = true;
        }

        // Check collision with player
        if (Math.abs(z - playerZ) < 2) {
            // Player reached enemy - lose soldiers equal to remaining HP
            modifySoldiers(-hp);
            setDestroyed(true);
            onDestroyed?.();
        }
    });

    // Receive damage from bullets
    const takeDamage = (amount: number) => {
        const newHp = hp - amount;
        if (newHp <= 0) {
            setDestroyed(true);
            onDestroyed?.();
        } else {
            setHp(newHp);
        }
    };

    if (destroyed) return null;

    return (
        <group>
            <instancedMesh ref={meshRef} args={[geometry, material, maxDisplay]} castShadow />

            {/* HP/Damage indicator */}
            <Text
                ref={textRef}
                position={[LEFT_LANE_X, 4, z]}
                rotation={[0, Math.PI, 0]}
                fontSize={1.5}
                color="#ff0000"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.12}
                outlineColor="#000"
            >
                -{hp}
            </Text>

            {/* Ground circle indicator */}
            <mesh position={[LEFT_LANE_X, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[3, 32]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

export default EnemyHorde;
export { EnemyHorde };
