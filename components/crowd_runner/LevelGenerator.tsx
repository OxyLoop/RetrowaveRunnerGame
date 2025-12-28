// @ts-nocheck
/**
 * LevelGenerator.tsx - Spawns gates, enemies, and weapons as player progresses
 * 
 * LEFT lane: Gates (+5, x2) OR Enemy Hordes
 * RIGHT lane: Weapon Platforms (ammo)
 */
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { crowdState } from './crowdState';
import { MathGate } from './MathGate';
import { EnemyHorde } from './EnemyHorde';
import { WeaponPlatform } from './WeaponPlatform';

interface Segment {
    id: number;
    z: number;
    leftType: 'gate' | 'enemy';
    // Gate props
    gateValue?: number;
    gateOp?: 'add' | 'multiply';
    // Enemy props
    enemyHp?: number;
    // Weapon props
    weaponAmmo: number;
}

const SEGMENT_DISTANCE = 35; // Distance between segments
const CLEANUP_DISTANCE = 30; // Remove passed segments

const LevelGenerator = () => {
    const [segments, setSegments] = useState<Segment[]>([]);
    const lastZ = useRef(40);
    const segmentId = useRef(0);

    useFrame(() => {
        if (crowdState.status !== 'RUNNING') return;

        const lookAhead = crowdState.distance + 200;

        // Generate new segments
        while (lastZ.current < lookAhead) {
            const z = lastZ.current;
            segmentId.current++;

            // Progressive difficulty
            const difficulty = 1 + crowdState.distance / 300;

            // 40% enemy, 60% gate
            const isEnemy = Math.random() < 0.4;

            const segment: Segment = {
                id: segmentId.current,
                z,
                leftType: isEnemy ? 'enemy' : 'gate',
                weaponAmmo: Math.floor(80 + Math.random() * 150 * difficulty),
            };

            if (isEnemy) {
                // Enemy HP scales with distance
                segment.enemyHp = Math.floor(15 + Math.random() * 40 * difficulty);
            } else {
                // Gate value
                const isMultiply = Math.random() < 0.25;
                segment.gateOp = isMultiply ? 'multiply' : 'add';
                segment.gateValue = isMultiply
                    ? (Math.random() < 0.5 ? 2 : 3)
                    : Math.floor(3 + Math.random() * 12);
            }

            setSegments(prev => [...prev, segment]);
            lastZ.current += SEGMENT_DISTANCE;
        }

        // Cleanup passed segments
        setSegments(prev => prev.filter(s => s.z > crowdState.distance - CLEANUP_DISTANCE));
    });

    return (
        <group>
            {segments.map(seg => (
                <group key={seg.id}>
                    {/* LEFT LANE: Gate or Enemy */}
                    {seg.leftType === 'gate' ? (
                        <MathGate
                            z={seg.z}
                            value={seg.gateValue!}
                            operation={seg.gateOp!}
                        />
                    ) : (
                        <EnemyHorde
                            z={seg.z}
                            hp={seg.enemyHp!}
                        />
                    )}

                    {/* RIGHT LANE: Always weapon */}
                    <WeaponPlatform
                        z={seg.z}
                        ammoValue={seg.weaponAmmo}
                    />
                </group>
            ))}
        </group>
    );
};

export default LevelGenerator;
