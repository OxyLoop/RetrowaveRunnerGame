// @ts-nocheck
import React, { useRef, useEffect, useState, useMemo } from "react";
import Landscape from "./Landscape";
import Boss from "./Boss";
import Obstacle, { ObstacleType } from "./Obstacle";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    Text,
    Box,
    Sphere,
    Cylinder,
    Stars,
    Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import {
    GamePhase,
    GateOperation,
    Gate,
    Particle,
} from "../../types";
import {
    TRACK_WIDTH,
    PLAYER_SPEED,
    STEER_SPEED,
    BOSS_DISTANCE,
    GATE_SPAWN_INTERVAL,
    LANE_WIDTH,
    CROWD_SPREAD,
    CROWD_RADIUS,
    RUNNER_LEVELS,
} from "../../constants";

interface GameCanvasProps {
    onScoreChange: (score: number) => void;
    onPhaseChange: (phase: GamePhase) => void;
    onBossInfo: (boss: any) => void;
    onLevelChange?: (level: number) => void;
    orientation?: "auto" | "portrait" | "landscape";
}

// Global state ref to share between React components and R3F loop without context issues
const gameStateRef = {
    current: {
        phase: GamePhase.MENU,
        score: 1,
        potentialScore: 1,
        distance: 0,
        maxDistance: BOSS_DISTANCE,
        sunZ: -BOSS_DISTANCE - 100,
        laneX: 0,
        input: { left: false, right: false },
        gates: [] as Gate[],
        particles: [] as Particle[],
        boss: {
            name: "Yükleniyor...",
            taunt: "...",
            maxHp: 100,
            currentHp: 100,
            z: -BOSS_DISTANCE,
            isActive: false,
        },
        nextGateZ: -30,
        currentLevel: 1,
        levelProgress: 0,
        y: 0,
        vy: 0,
        isJumping: false,
        obstacles: [] as any[],
        shakeIntensity: 0,
    },
};

// --- 3D Components ---

type RunnerProps = {
    position: [number, number, number];
    color: string;
    animOffset: number;
    key?: React.Key;
};

const Runner: React.FC<RunnerProps> = ({ position, color, animOffset }) => {
    const mesh = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (mesh.current) {
            const t = state.clock.getElapsedTime() * 15 + animOffset;
            mesh.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.2;
            mesh.current.rotation.x = 0.3;
        }
    });

    return (
        <group ref={mesh} position={[position[0], 0, position[2]]}>
            <Cylinder
                args={[CROWD_RADIUS, CROWD_RADIUS * 0.8, 0.8, 8]}
                position={[0, 0.4, 0]}
            >
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.6}
                    roughness={0.2}
                    metalness={0.8}
                    toneMapped={false}
                />
            </Cylinder>
            <Box
                args={[CROWD_RADIUS * 1.8, CROWD_RADIUS * 1.5, CROWD_RADIUS * 1.8]}
                position={[0, 0.9, 0]}
            >
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#0088ff"
                    emissiveIntensity={0.8}
                    roughness={0.2}
                    metalness={1}
                    toneMapped={false}
                />
            </Box>
        </group>
    );
};

const Crowd = () => {
    const group = useRef<THREE.Group>(null);
    const [visibleParticles, setVisibleParticles] = useState<Particle[]>([]);

    useFrame((state, delta) => {
        if (!group.current) return;
        const gs = gameStateRef.current;

        group.current.position.x = THREE.MathUtils.lerp(
            group.current.position.x,
            gs.laneX,
            delta * 10
        );
        group.current.position.z = gs.distance;
        group.current.position.y = gs.y;

        if (visibleParticles.length !== gs.particles.length) {
            setVisibleParticles([...gs.particles]);
        }
    });

    return (
        <group ref={group}>
            {visibleParticles.map((p) => (
                <Runner
                    key={p.id}
                    position={[p.offset.x, 0, p.offset.z]}
                    color="#0ea5e9"
                    animOffset={p.id * 10}
                />
            ))}
        </group>
    );
};

type GateMeshProps = { gate: Gate; key?: React.Key };
const GateMesh: React.FC<GateMeshProps> = ({ gate }) => {
    const [opStr, valStr] = useMemo(() => {
        let s = "";
        switch (gate.operation) {
            case GateOperation.ADD:
                s = "+";
                break;
            case GateOperation.SUBTRACT:
                s = "-";
                break;
            case GateOperation.MULTIPLY:
                s = "x";
                break;
            case GateOperation.DIVIDE:
                s = "÷";
                break;
        }
        return [s, gate.value.toString()];
    }, [gate]);

    const neonColor = useMemo(() => {
        return gate.color === "#ef4444" ? "#ff0055" : "#00ff99";
    }, [gate.color]);

    return (
        <group position={[gate.x, 1.5, gate.z]}>
            <Box args={[gate.width - 0.2, 3, 0.05]}>
                <meshStandardMaterial
                    color={neonColor}
                    transparent
                    opacity={0.3}
                    emissive={neonColor}
                    emissiveIntensity={0.8}
                    toneMapped={false}
                />
            </Box>
            <Box args={[gate.width, 0.2, 0.2]} position={[0, 1.5, 0]}>
                <meshStandardMaterial
                    color={neonColor}
                    emissive={neonColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Box>
            <Box args={[gate.width, 0.2, 0.2]} position={[0, -1.5, 0]}>
                <meshStandardMaterial
                    color={neonColor}
                    emissive={neonColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Box>
            <Box args={[0.2, 3.2, 0.2]} position={[-gate.width / 2, 0, 0]}>
                <meshStandardMaterial
                    color={neonColor}
                    emissive={neonColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Box>
            <Box args={[0.2, 3.2, 0.2]} position={[gate.width / 2, 0, 0]}>
                <meshStandardMaterial
                    color={neonColor}
                    emissive={neonColor}
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </Box>
            <Text
                position={[0, 0, 0.2]}
                fontSize={1.5}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.05}
                outlineColor={neonColor}
            >
                {opStr}
                {valStr}
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </Text>
        </group>
    );
};

const RetroRoad = ({
    width = 14,
    length = 520,
    dashCount = 34,
}: {
    width?: number;
    length?: number;
    dashCount?: number;
}) => {
    const dashRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        if (!dashRef.current) return;

        const startZ = -20;
        const endZ = -length + 40;
        const dz = (startZ - endZ) / dashCount;

        for (let i = 0; i < dashCount; i++) {
            const z = startZ - i * dz;
            dummy.position.set(0, 0.115, z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.updateMatrix();
            dashRef.current.setMatrixAt(i, dummy.matrix);
        }
        dashRef.current.instanceMatrix.needsUpdate = true;
    }, [dashCount, length, dummy]);

    return (
        <group>
            <mesh position={[0, 0.08, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width, length]} />
                <meshStandardMaterial
                    color="#070711"
                    roughness={0.95}
                    metalness={0.05}
                    emissive="#000000"
                />
            </mesh>
            <mesh
                position={[-width / 2 + 0.25, 0.11, -length / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[0.22, length]} />
                <meshBasicMaterial color="#ff3bd4" toneMapped={false} />
            </mesh>
            <mesh
                position={[+width / 2 - 0.25, 0.11, -length / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[0.22, length]} />
                <meshBasicMaterial color="#ffb000" toneMapped={false} />
            </mesh>
            <instancedMesh
                ref={dashRef}
                args={[undefined as any, undefined as any, dashCount]}
            >
                <planeGeometry args={[0.22, 2.6]} />
                <meshBasicMaterial color="#ffe17a" toneMapped={false} />
            </instancedMesh>
        </group>
    );
};

const HorizonSun = ({ color = "#ffaa00" }: { color?: string }) => {
    const sunRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!sunRef.current) return;
        const gs = gameStateRef.current;
        sunRef.current.position.set(0, 16, gs.sunZ);
    });

    return (
        <group ref={sunRef}>
            <mesh>
                <circleGeometry args={[40, 32]} />
                <meshBasicMaterial color={color} toneMapped={false} fog={false} />
            </mesh>
            {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[0, -10 + i * 4, 0.2]}>
                    <planeGeometry args={[80, 2]} />
                    <meshBasicMaterial color="#1a0b2e" toneMapped={false} fog={false} />
                </mesh>
            ))}
        </group>
    );
};

const PalmAvenue = ({
    perSide = 44,
    spacing = 16,
}: {
    perSide?: number;
    spacing?: number;
}) => {
    const trunkRef = useRef<THREE.InstancedMesh>(null);
    const leafRef = useRef<THREE.InstancedMesh>(null);
    const totalPalms = perSide * 2;
    const leavesPerPalm = 7;
    const totalLeaves = totalPalms * leavesPerPalm;
    const zRef = useRef<Float32Array>();
    const jitterRef = useRef<Float32Array>();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        zRef.current = new Float32Array(perSide);
        jitterRef.current = new Float32Array(perSide);
        for (let i = 0; i < perSide; i++) {
            zRef.current[i] = -30 - i * spacing;
            jitterRef.current[i] = (Math.random() - 0.5) * 3.0;
        }
    }, [perSide, spacing]);

    useFrame(({ clock }) => {
        const gs = gameStateRef.current;
        if (
            !trunkRef.current ||
            !leafRef.current ||
            !zRef.current ||
            !jitterRef.current
        )
            return;

        const t = clock.getElapsedTime();
        const recycleLen = perSide * spacing;
        const playerZ = gs.distance;

        for (let i = 0; i < perSide; i++) {
            if (zRef.current[i] > playerZ + 30) zRef.current[i] -= recycleLen;
        }

        for (let i = 0; i < totalPalms; i++) {
            const side = i < perSide ? -1 : 1;
            const idx = i % perSide;
            const xBase = side * (TRACK_WIDTH / 2 + 8.5);
            const x = xBase + jitterRef.current[idx];
            const z = zRef.current[idx];
            const sway = Math.sin(t * 1.2 + idx * 0.7) * 0.06 * side;

            dummy.position.set(x, 3.2, z);
            dummy.rotation.set(0, side * 0.12, sway);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            trunkRef.current.setMatrixAt(i, dummy.matrix);
        }
        trunkRef.current.instanceMatrix.needsUpdate = true;

        let leafInstance = 0;
        for (let i = 0; i < totalPalms; i++) {
            const side = i < perSide ? -1 : 1;
            const idx = i % perSide;
            const xBase = side * (TRACK_WIDTH / 2 + 8.5);
            const x = xBase + jitterRef.current[idx];
            const z = zRef.current[idx];
            const sway = Math.sin(t * 1.2 + idx * 0.7) * 0.12;
            const topY = 7.2;

            for (let k = 0; k < leavesPerPalm; k++) {
                const ang = (k / leavesPerPalm) * Math.PI * 2;
                dummy.position.set(x, topY, z);
                dummy.scale.set(1.0, 1.0, 1.0);
                const rotY = ang + side * 0.15;
                const rotX = -0.9 + Math.sin(ang) * 0.15;
                const rotZ = sway * (0.6 + k * 0.05);
                dummy.rotation.set(rotX, rotY, rotZ);
                dummy.updateMatrix();
                leafRef.current.setMatrixAt(leafInstance++, dummy.matrix);
            }
        }
        leafRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <group>
            <instancedMesh
                ref={trunkRef}
                args={[undefined as any, undefined as any, totalPalms]}
                frustumCulled={false}
            >
                <cylinderGeometry args={[0.22, 0.48, 6.8, 8]} />
                <meshStandardMaterial
                    color="#12051b"
                    emissive="#ff00ff"
                    emissiveIntensity={0.18}
                    roughness={0.75}
                    metalness={0.05}
                    toneMapped={false}
                />
            </instancedMesh>
            <instancedMesh
                ref={leafRef}
                args={[undefined as any, undefined as any, totalLeaves]}
                frustumCulled={false}
            >
                <planeGeometry args={[4.8, 1.25]} />
                <meshStandardMaterial
                    color="#001a14"
                    emissive="#00ffd0"
                    emissiveIntensity={1.15}
                    transparent
                    opacity={0.95}
                    side={THREE.DoubleSide}
                    roughness={0.25}
                    metalness={0.05}
                    toneMapped={false}
                />
            </instancedMesh>
        </group>
    );
};

const CameraController = ({
    orientation = "auto",
}: {
    orientation?: "auto" | "portrait" | "landscape";
}) => {
    const { camera, size } = useThree();

    useEffect(() => {
        const aspect = size.width / size.height;
        const mode =
            orientation === "auto"
                ? aspect > 1
                    ? "landscape"
                    : "portrait"
                : orientation;

        if (mode === "landscape") {
            camera.fov = 70;
            camera.position.set(0, 7.5, 18);
        } else {
            camera.fov = 60;
            camera.position.set(0, 6, 14);
        }
        camera.updateProjectionMatrix();
    }, [size, camera, orientation]);

    return null;
};

const GameController = ({
    onScoreChange,
    onPhaseChange,
    onBossInfo,
}: GameCanvasProps) => {
    const { camera } = useThree();
    const GRAVITY = -35;
    const internalScore = useRef(1);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        // --- Zıplama Fiziği ---
        if (gs.isJumping) {
            gs.vy += GRAVITY * delta;
            gs.y += gs.vy * delta;

            if (gs.y <= 0) {
                gs.y = 0;
                gs.vy = 0;
                gs.isJumping = false;
            }
        }

        // --- Kamera Sarsıntısı ---
        if (gs.shakeIntensity > 0) {
            camera.position.x += (Math.random() - 0.5) * gs.shakeIntensity;
            camera.position.y += (Math.random() - 0.5) * gs.shakeIntensity;
            gs.shakeIntensity *= 0.9;
        }

        // --- Engel Çarpışma Kontrolü ---
        gs.obstacles.forEach((obs) => {
            if (obs.hit) return;

            if (gs.distance < obs.z + 0.6 && gs.distance > obs.z - 0.6) {
                const isInLane = Math.abs(gs.laneX - obs.x) < obs.width / 2 + 0.8;

                if (isInLane) {
                    let collided = false;

                    if (obs.type === ObstacleType.BARRIER) {
                        if (gs.y < 1.3) collided = true;
                    } else if (obs.type === ObstacleType.BLOCK) {
                        if (gs.y < 2.0) collided = true;
                    } else if (obs.type === ObstacleType.SIDE_TALL) {
                        if (gs.y < 4.5) collided = true;
                    } else if (obs.type === ObstacleType.FULL_BARRIER) {
                        if (gs.y < 1.3) collided = true;
                    } else if (obs.type === ObstacleType.COMBO) {
                        if (gs.y < 1.3) {
                            collided = true;
                        } else {
                            const half = (obs.blockWidth ?? TRACK_WIDTH / 2) - 0.5;
                            const sideX =
                                obs.side === "left" ? -TRACK_WIDTH / 4 : TRACK_WIDTH / 4;
                            const inTallSide = Math.abs(gs.laneX - sideX) < half / 2 + 0.8;
                            if (inTallSide && gs.y < 4.5) collided = true;
                        }
                    }

                    if (collided) {
                        obs.hit = true;
                        gs.shakeIntensity = 0.5;
                        const newScore = Math.floor(gs.score * 0.8);
                        gs.score = Math.max(1, newScore);
                        onScoreChange(gs.score);
                        syncParticles(gs.score);
                    }
                }
            }
        });

        if (gs.phase === GamePhase.RUNNING) {
            gs.distance -= PLAYER_SPEED * delta;

            const SPAWN_INTERVAL = 30;
            const LOOKAHEAD = 180;
            const productionHorizon = gs.distance - LOOKAHEAD;

            const isSpawnZoneOccupied = (z: number, minGap: number) => {
                const gateNear = gs.gates.some((g) => Math.abs(g.z - z) < minGap);
                const obsNear = gs.obstacles.some((o) => Math.abs(o.z - z) < minGap);
                return gateNear || obsNear;
            };

            if (gs.nextGateZ > productionHorizon && gs.nextGateZ > gs.boss.z + 100) {
                const MIN_GAP = SPAWN_INTERVAL * 0.9;
                if (!isSpawnZoneOccupied(gs.nextGateZ, MIN_GAP)) {
                    const isObstacle = Math.random() < 0.5;
                    if (isObstacle) {
                        spawnObstacle(gs.nextGateZ);
                    } else {
                        spawnGates(gs.nextGateZ);
                    }
                }
                gs.nextGateZ -= SPAWN_INTERVAL;
            }

            if (gs.input.left) gs.laneX -= STEER_SPEED * delta;
            if (gs.input.right) gs.laneX += STEER_SPEED * delta;

            const maxOffset = TRACK_WIDTH / 2 - 1.5;
            gs.laneX = Math.max(-maxOffset, Math.min(maxOffset, gs.laneX));

            camera.position.z = gs.distance + 12;
            camera.position.y = 6;
            camera.position.x = THREE.MathUtils.lerp(
                camera.position.x,
                gs.laneX / 3,
                delta * 3
            );
            camera.lookAt(0, 2, gs.distance - 20);

            if (gs.distance <= gs.sunZ + 35) {
                gs.phase = GamePhase.BOSS_FIGHT;
                onPhaseChange(GamePhase.BOSS_FIGHT);

                gs.boss.isActive = true;
                gs.boss.z = gs.sunZ + 10;

                const calculatedMaxHp = Math.floor(gs.potentialScore * 0.9);
                gs.boss.maxHp = Math.max(50, calculatedMaxHp);
                gs.boss.currentHp = gs.boss.maxHp;

                onBossInfo({ ...gs.boss });
            }

            gs.gates.forEach((gate) => {
                if (gate.hit) return;
                if (gs.distance < gate.z + 1 && gs.distance > gate.z - 1) {
                    const crowdLeft = gs.laneX - 1.5;
                    const crowdRight = gs.laneX + 1.5;
                    const gateLeft = gate.x - gate.width / 2;
                    const gateRight = gate.x + gate.width / 2;

                    if (crowdRight > gateLeft && crowdLeft < gateRight) {
                        gate.hit = true;
                        applyGate(gate, onScoreChange, onPhaseChange);
                    }
                }
            });
        } else if (gs.phase === GamePhase.BOSS_FIGHT) {
            camera.position.z = THREE.MathUtils.lerp(
                camera.position.z,
                gs.distance + 15,
                delta
            );
            camera.lookAt(0, 3, gs.boss.z);

            if (gs.score > 0 && Math.random() < 0.1) {
                gs.score--;
                gs.boss.currentHp -= 1;

                internalScore.current = gs.score;
                onScoreChange(gs.score);
                syncParticles(gs.score);

                if (gs.boss.currentHp <= 0) {
                    gs.phase = GamePhase.VICTORY;
                    onPhaseChange(GamePhase.VICTORY);
                } else if (gs.score <= 0) {
                    gs.phase = GamePhase.GAME_OVER;
                    onPhaseChange(GamePhase.GAME_OVER);
                }

                onBossInfo({ ...gs.boss });
            }
        }
    });

    return null;
};

// --- Helpers ---

const calculateGateOutcome = (
    currentScore: number,
    op: GateOperation,
    val: number
): number => {
    switch (op) {
        case GateOperation.ADD:
            return currentScore + val;
        case GateOperation.SUBTRACT:
            return Math.max(0, currentScore - val);
        case GateOperation.MULTIPLY:
            return currentScore * val;
        case GateOperation.DIVIDE:
            return Math.floor(currentScore / val);
        default:
            return currentScore;
    }
};

const spawnGates = (z: number) => {
    const isBad = Math.random() > 0.6;
    let operation: GateOperation;
    let value: number;
    let color: string;

    if (isBad) {
        if (Math.random() > 0.5) {
            operation = GateOperation.SUBTRACT;
            value = Math.floor(Math.random() * 20) + 10;
            color = "#ef4444";
        } else {
            operation = GateOperation.DIVIDE;
            value = 2;
            color = "#ef4444";
        }
    } else {
        if (Math.random() > 0.5) {
            operation = GateOperation.ADD;
            value = Math.floor(Math.random() * 30) + 10;
            color = "#22c55e";
        } else {
            operation = GateOperation.MULTIPLY;
            value = 2;
            color = "#3b82f6";
        }
    }

    const gateLeft: Gate = {
        id: Math.random(),
        z: z,
        x: -LANE_WIDTH / 2 - 1,
        width: LANE_WIDTH,
        operation,
        value,
        color,
        hit: false,
    };

    let op2 = GateOperation.ADD;
    let val2 = 5;
    let col2 = "#22c55e";

    if (isBad) {
        op2 = GateOperation.ADD;
        val2 = 10;
        col2 = "#22c55e";
    } else {
        op2 = GateOperation.SUBTRACT;
        val2 = 10;
        col2 = "#ef4444";
    }

    const gateRight: Gate = {
        id: Math.random(),
        z: z,
        x: LANE_WIDTH / 2 + 1,
        width: LANE_WIDTH,
        operation: op2,
        value: val2,
        color: col2,
        hit: false,
    };

    gameStateRef.current.gates.push(gateLeft, gateRight);

    const currentPotential = gameStateRef.current.potentialScore;
    const outcomeLeft = calculateGateOutcome(
        currentPotential,
        gateLeft.operation,
        gateLeft.value
    );
    const outcomeRight = calculateGateOutcome(
        currentPotential,
        gateRight.operation,
        gateRight.value
    );
    gameStateRef.current.potentialScore = Math.max(outcomeLeft, outcomeRight);
};

const spawnObstacle = (z: number) => {
    const gs = gameStateRef.current;
    const roll = Math.random();

    if (roll < 0.34) {
        const side = Math.random() < 0.5 ? "left" : "right";
        const half = TRACK_WIDTH / 2;
        const x = side === "left" ? -TRACK_WIDTH / 4 : TRACK_WIDTH / 4;

        gs.obstacles.push({
            id: Math.random(),
            z,
            x,
            type: ObstacleType.SIDE_TALL,
            width: half - 0.5,
            side,
            hit: false,
        });
        return;
    }

    if (roll < 0.67) {
        gs.obstacles.push({
            id: Math.random(),
            z,
            x: 0,
            type: ObstacleType.FULL_BARRIER,
            width: TRACK_WIDTH - 1,
            hit: false,
        });
        return;
    }

    {
        const side = Math.random() < 0.5 ? "left" : "right";
        const half = TRACK_WIDTH / 2;

        gs.obstacles.push({
            id: Math.random(),
            z,
            x: 0,
            type: ObstacleType.COMBO,
            width: TRACK_WIDTH - 1,
            side,
            blockWidth: half - 0.5,
            hit: false,
        });
    }
};

const applyGate = (
    gate: Gate,
    onScoreChange: Function,
    onPhaseChange: Function
) => {
    let sc = gameStateRef.current.score;
    switch (gate.operation) {
        case GateOperation.ADD:
            sc += gate.value;
            break;
        case GateOperation.SUBTRACT:
            sc -= gate.value;
            break;
        case GateOperation.MULTIPLY:
            sc *= gate.value;
            break;
        case GateOperation.DIVIDE:
            sc = Math.floor(sc / gate.value);
            break;
    }

    if (sc < 0) sc = 0;
    gameStateRef.current.score = sc;
    syncParticles(sc);
    onScoreChange(sc);

    if (sc === 0) {
        gameStateRef.current.phase = GamePhase.GAME_OVER;
        onPhaseChange(GamePhase.GAME_OVER);
    }
};

const syncParticles = (count: number) => {
    const currentLen = gameStateRef.current.particles.length;
    const displayCount = Math.min(count, 100);

    if (displayCount > currentLen) {
        for (let i = 0; i < displayCount - currentLen; i++) {
            gameStateRef.current.particles.push({
                id: Math.random(),
                x: 0,
                y: 0,
                z: 0,
                offset: {
                    x: (Math.random() - 0.5) * CROWD_SPREAD * 2,
                    z: (Math.random() - 0.5) * CROWD_SPREAD * 2,
                },
            });
        }
    } else if (displayCount < currentLen) {
        gameStateRef.current.particles.splice(displayCount);
    }
};

const GameScene: React.FC<GameCanvasProps> = ({
    onScoreChange,
    onPhaseChange,
    onBossInfo,
}) => {
    const { gl } = useThree();
    useEffect(() => {
        gl.localClippingEnabled = true;
    }, [gl]);

    const [gates, setGates] = useState<Gate[]>([]);
    const [obstacles, setObstacles] = useState<any[]>([]);

    const gs = gameStateRef.current;
    const levelData = RUNNER_LEVELS[gs.currentLevel - 1] || RUNNER_LEVELS[0];
    const themeColor = levelData.color;
    const scrollSpeed = gs.phase === GamePhase.RUNNING ? 1.0 : 0.0;

    useFrame(() => {
        const liveGates = gameStateRef.current.gates.filter(
            (g) => !g.hit && g.z < gameStateRef.current.distance + 20
        );
        const hasChanged =
            liveGates.length !== gates.length ||
            liveGates.some((g, i) => g.id !== gates[i]?.id);
        if (hasChanged) {
            setGates([...liveGates]);
        }
    });

    useFrame(() => {
        const liveObs = gs.obstacles.filter(
            (o) => !o.hit && o.z < gs.distance + 40
        );
        const changed =
            liveObs.length !== obstacles.length ||
            liveObs.some((o, i) => o.id !== obstacles[i]?.id);
        if (changed) setObstacles([...liveObs]);
    });

    const bossColor = "#ff6a00";

    return (
        <>
            <color attach="background" args={["#0b0618"]} />
            <fog attach="fog" args={["#0b0618", 50, 320]} />
            <ambientLight intensity={0.55} color={themeColor} />
            <pointLight position={[12, 18, 8]} intensity={2.2} color={themeColor} />
            <pointLight position={[-12, 8, -12]} intensity={2.4} color="#ff00ff" />
            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />
            <GameController
                onScoreChange={onScoreChange}
                onPhaseChange={onPhaseChange}
                onBossInfo={onBossInfo}
                orientation="auto"
            />
            <PalmAvenue
                key={`palms-lv-${gs.currentLevel}`}
                perSide={45}
                spacing={18}
            />
            <Crowd />

            <Boss
                z={gs.boss.z}
                name={gs.boss.name}
                hp={gs.boss.currentHp}
                maxHp={gs.boss.maxHp}
                isActive={gs.boss.isActive || gs.phase === GamePhase.BOSS_FIGHT}
                color={bossColor}
            />
            {gates.map((gate) => (
                <GateMesh key={gate.id} gate={gate} />
            ))}
            {obstacles.map((obs) => (
                <Obstacle
                    key={obs.id}
                    type={obs.type}
                    x={obs.x}
                    z={obs.z}
                    width={obs.width}
                    side={obs.side}
                    blockWidth={obs.blockWidth}
                />
            ))}
            <Landscape
                key={`land-lv-${gs.currentLevel}`}
                speed={scrollSpeed}
                color={themeColor}
            />
            <RetroRoad width={14} length={2000} dashCount={120} />
            <HorizonSun color={themeColor} />
            <Sparkles
                count={50}
                scale={12}
                size={6}
                speed={0.4}
                opacity={0.5}
                color={themeColor}
                position={[0, 2, gs.distance - 10]}
            />
        </>
    );
};

const GameCanvas: React.FC<GameCanvasProps> = (props) => {
    const startGame = (level = 1) => {
        const levelData = RUNNER_LEVELS[level - 1] || RUNNER_LEVELS[0];
        const targetDistance = levelData.playerSpeed * levelData.duration;

        gameStateRef.current = {
            ...gameStateRef.current,
            phase: GamePhase.RUNNING,
            score: level === 1 ? 1 : gameStateRef.current.score,
            currentLevel: level,
            potentialScore: 1,
            distance: 0,
            maxDistance: BOSS_DISTANCE,
            sunZ: -BOSS_DISTANCE - 100,
            laneX: 0,
            input: { left: false, right: false },
            gates: [],
            particles: [],
            obstacles: [],
            y: 0,
            vy: 0,
            isJumping: false,
            shakeIntensity: 0,
            boss: {
                name: "INITIALIZING...",
                taunt: "...",
                maxHp: 100 * (levelData.bossHpMultiplier || 1),
                currentHp: 100 * (levelData.bossHpMultiplier || 1),
                z: -targetDistance,
                isActive: false,
            },
            nextGateZ: -30,
        };
        syncParticles(gameStateRef.current.score);
        props.onPhaseChange(GamePhase.RUNNING);
        props.onScoreChange(gameStateRef.current.score);

        const bossNames = [
            "MEGA BYTE",
            "CYBER LORD",
            "PIXEL KING",
            "GLITCH MASTER",
        ];
        const bossTaunts = [
            "Yolun Sonu!",
            "Sistem Hatası!",
            "Kaçış Yok!",
            "Game Over!",
        ];

        gameStateRef.current.boss.name = bossNames[level - 1] || bossNames[0];
        gameStateRef.current.boss.taunt = bossTaunts[level - 1] || bossTaunts[0];
        gameStateRef.current.boss.z = gameStateRef.current.sunZ;
        props.onBossInfo({ ...gameStateRef.current.boss });

        // Notify parent of level change
        if (props.onLevelChange) {
            props.onLevelChange(level);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const gs = gameStateRef.current;

            if (e.code === "KeyA" || e.code === "ArrowLeft") gs.input.left = true;
            if (e.code === "KeyD" || e.code === "ArrowRight") gs.input.right = true;

            if (
                e.code === "KeyW" &&
                !gs.isJumping &&
                gs.phase === GamePhase.RUNNING
            ) {
                gs.isJumping = true;
                gs.vy = 16;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const gs = gameStateRef.current;
            if (e.code === "KeyA" || e.code === "ArrowLeft") gs.input.left = false;
            if (e.code === "KeyD" || e.code === "ArrowRight") gs.input.right = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        // @ts-ignore
        window.startRunnerGame = (level = 1) => {
            startGame(level);
        };

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            // @ts-ignore
            delete window.startRunnerGame;
        };
    }, []);

    return (
        <div
            className="w-full h-full bg-[#170b29] outline-none cursor-crosshair"
            tabIndex={0}
            onTouchStart={(e) => {
                const touchX = e.touches[0].clientX;
                if (touchX < window.innerWidth / 2) {
                    gameStateRef.current.input.left = true;
                    gameStateRef.current.input.right = false;
                } else {
                    gameStateRef.current.input.right = true;
                    gameStateRef.current.input.left = false;
                }
            }}
            onTouchEnd={() => {
                gameStateRef.current.input.left = false;
                gameStateRef.current.input.right = false;
            }}
        >
            <Canvas shadows camera={{ position: [0, 6, 12], fov: 60 }}>
                <CameraController orientation={props.orientation} />
                <GameScene {...props} />
            </Canvas>
        </div>
    );
};

export default GameCanvas;
