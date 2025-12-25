// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';
import { GamePhase } from '../types';
import { addFloatingText } from './FloatingText';
import { TRACK_WIDTH } from '../constants';

interface Gate {
    id: number;
    z: number;
    leftOp: string;
    leftVal: number;
    rightOp: string;
    rightVal: number;
    passed: boolean;
}

let gateId = 0;

const MathGates: React.FC = () => {
    const [gates, setGates] = useState<Gate[]>([]);
    const gatesRef = useRef<Gate[]>([]);
    const lastSpawnRef = useRef(0);
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        console.log('[MathGates] Component mounted');
        gatesRef.current = [];
        gateId = 0;
    }, []);

    useFrame(() => {
        const gs = gameStateRef.current;

        // Hide in SHOOTER mode
        if (gs.gameMode !== 'HYPER_CASUAL') {
            if (groupRef.current) groupRef.current.visible = false;
            return;
        }

        // ClEANUP for Boss Fight - Remove all gates
        if (gs.phase === GamePhase.BOSS_FIGHT) {
            if (groupRef.current) groupRef.current.visible = false;
            // clear internal ref so they don't reappear
            gatesRef.current = [];
            // trigger re-render to empty if needed, but visible=false handles it fast
            if (gates.length > 0) {
                setGates([]);
            }
            return;
        }

        if (groupRef.current) groupRef.current.visible = true;

        if (gs.phase !== GamePhase.RUNNING) return;
        if (!gs.hyperCasual) {
            console.log('[MathGates] No hyperCasual state!');
            return;
        }

        // ===== SPAWN NEW GATES =====
        const spawnDistance = 35;
        if (Math.abs(gs.distance - lastSpawnRef.current) > spawnDistance) {
            lastSpawnRef.current = gs.distance;

            // Random operations
            const ops = ['+', '-', '×', '÷'];
            const leftOp = ops[Math.floor(Math.random() * ops.length)];
            const rightOp = ops[Math.floor(Math.random() * ops.length)];

            // Values based on operation
            const getVal = (op: string) => {
                if (op === '+') return Math.floor(Math.random() * 10) + 2; // +2 to +12
                if (op === '-') return Math.floor(Math.random() * 5) + 1;  // -1 to -6
                if (op === '×') return Math.floor(Math.random() * 2) + 2; // ×2 or ×3
                return 2; // ÷2
            };

            const newGate: Gate = {
                id: ++gateId,
                z: gs.distance - 50,
                leftOp,
                leftVal: getVal(leftOp),
                rightOp,
                rightVal: getVal(rightOp),
                passed: false,
            };

            gatesRef.current.push(newGate);
            console.log('[MathGates] Spawned gate #' + newGate.id + ' at z=' + newGate.z.toFixed(0));
        }

        // ===== CHECK COLLISIONS =====
        gatesRef.current.forEach((gate) => {
            if (gate.passed) return;

            const dz = gate.z - gs.distance;
            if (dz > -1.5 && dz < 1.5) {
                gate.passed = true;

                // Which side did player choose?
                const isLeft = gs.player.x < 0;
                const op = isLeft ? gate.leftOp : gate.rightOp;
                const val = isLeft ? gate.leftVal : gate.rightVal;

                // Calculate new soldier count
                let oldCount = gs.hyperCasual.soldierCount;
                let newCount = oldCount;

                try {
                    if (op === '+') newCount = oldCount + val;
                    else if (op === '-') newCount = Math.max(1, oldCount - val); // Min 1
                    else if (op === '×') newCount = Math.min(9999, oldCount * val); // Max 9999
                    else if (op === '÷') newCount = Math.max(1, Math.floor(oldCount / val));
                } catch (e) {
                    console.error('[MathGates] Calculation error:', e);
                    newCount = oldCount;
                }

                gs.hyperCasual.soldierCount = newCount;
                gs.hyperCasual.gatesCleared = (gs.hyperCasual.gatesCleared || 0) + 1;

                const change = newCount - oldCount;
                const color = change >= 0 ? '#00ff00' : '#ff0000';
                const text = change >= 0 ? `+${change}` : `${change}`;

                console.log('[MathGates] Passed! ' + op + val + ' => ' + oldCount + ' -> ' + newCount);

                try {
                    addFloatingText(text, gs.player.x, 3, gs.distance, color);
                } catch (e) {
                    console.error('[MathGates] FloatingText error:', e);
                }

                // Game over if 0 soldiers
                if (newCount <= 0) {
                    console.log('[MathGates] GAME OVER - no soldiers!');
                    gs.phase = GamePhase.GAME_OVER;
                }
            }
        });

        // ===== CLEANUP OLD GATES =====
        gatesRef.current = gatesRef.current.filter(g => {
            const dz = g.z - gs.distance;
            return dz < 15; // Keep if not too far behind
        });

        // ===== UPDATE VISIBLE GATES =====
        const visible = gatesRef.current.filter(g => {
            const dz = g.z - gs.distance;
            return dz > -70 && dz < 10;
        });

        setGates([...visible]);
    });

    // Gate colors
    const getColor = (op: string) => {
        if (op === '+' || op === '×') return '#00aa00'; // Green = good
        return '#aa0000'; // Red = bad
    };

    return (
        <group ref={groupRef}>
            {gates.map((gate) => (
                <group key={gate.id} position={[0, 0, gate.z]}>
                    {/* LEFT GATE */}
                    <group position={[-TRACK_WIDTH / 4, 2, 0]}>
                        <Box args={[TRACK_WIDTH / 2 - 1, 3.5, 0.4]}>
                            <meshBasicMaterial color={getColor(gate.leftOp)} />
                        </Box>
                        <Text
                            position={[0, 0, 0.25]}
                            fontSize={1.2}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.08}
                            outlineColor="#000000"
                        >
                            {gate.leftOp}{gate.leftVal}
                        </Text>
                    </group>

                    {/* RIGHT GATE */}
                    <group position={[TRACK_WIDTH / 4, 2, 0]}>
                        <Box args={[TRACK_WIDTH / 2 - 1, 3.5, 0.4]}>
                            <meshBasicMaterial color={getColor(gate.rightOp)} />
                        </Box>
                        <Text
                            position={[0, 0, 0.25]}
                            fontSize={1.2}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.08}
                            outlineColor="#000000"
                        >
                            {gate.rightOp}{gate.rightVal}
                        </Text>
                    </group>

                    {/* CENTER DIVIDER */}
                    <Cylinder args={[0.15, 0.15, 4, 8]} position={[0, 2, 0]}>
                        <meshBasicMaterial color="#ffffff" />
                    </Cylinder>
                </group>
            ))}
        </group>
    );
};

export default MathGates;
