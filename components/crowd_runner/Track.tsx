// @ts-nocheck
/**
 * Track.tsx - Ground and side barriers
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crowdState, TRACK_WIDTH } from './crowdState';

// Brown ground that scrolls with player
const Ground = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.z = crowdState.distance + 100;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 100]} receiveShadow>
            <planeGeometry args={[TRACK_WIDTH, 500]} />
            <meshStandardMaterial color="#9B7653" roughness={0.9} />
        </mesh>
    );
};

// Rocky side barriers
const SideBarriers = () => {
    const leftRef = useRef<THREE.Mesh>(null);
    const rightRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        const z = crowdState.distance + 100;
        if (leftRef.current) leftRef.current.position.z = z;
        if (rightRef.current) rightRef.current.position.z = z;
    });

    return (
        <>
            {/* Left barrier */}
            <mesh ref={leftRef} position={[-TRACK_WIDTH / 2 - 1.5, 2, 100]}>
                <boxGeometry args={[3, 4, 500]} />
                <meshStandardMaterial color="#5D4037" roughness={1} />
            </mesh>

            {/* Right barrier */}
            <mesh ref={rightRef} position={[TRACK_WIDTH / 2 + 1.5, 2, 100]}>
                <boxGeometry args={[3, 4, 500]} />
                <meshStandardMaterial color="#5D4037" roughness={1} />
            </mesh>
        </>
    );
};

// Lane divider line (subtle)
const LaneDivider = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.z = crowdState.distance + 100;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 100]}>
            <planeGeometry args={[0.2, 500]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
    );
};

const Track = () => {
    return (
        <group>
            <Ground />
            <SideBarriers />
            <LaneDivider />
        </group>
    );
};

export default Track;
