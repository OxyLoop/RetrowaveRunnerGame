import React, { useRef, useMemo } from "react";
import { Box, Cylinder, MeshDistortMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export enum ObstacleType {
    BARRIER = "BARRIER", // Üzerinden zıplanabilir (Lazer Çit)
    BLOCK = "BLOCK", // Yanından kaçılmalı (Cyber Sütun)

    // Yeni komplike tipler
    SIDE_TALL = "SIDE_TALL", // sol/sağ yarı - atlanamaz (yüksek sütun)
    FULL_BARRIER = "FULL_BARRIER", // tüm yolu kaplayan atlanabilir (lazer çit)
    COMBO = "COMBO", // FULL_BARRIER + SIDE_TALL aynı z'de
}

interface ObstacleProps {
    type: ObstacleType;
    x: number;
    z: number;
    width: number;

    // SIDE_TALL / COMBO için
    side?: "left" | "right";
    blockWidth?: number; // COMBO'daki side bloğun genişliği
}

/** --- Visual helpers (mevcut görsellerini bozmadan tekrar kullanmak için) --- */

const BarrierVisual: React.FC<{
    width: number;
    height: number;
    color: string;
}> = ({ width, height, color }) => {
    return (
        <group>
            {/* Yan Direkler */}
            <Box args={[0.4, height, 0.4]} position={[-width / 2, 0, 0]}>
                <meshStandardMaterial color="#222" metalness={1} roughness={0} />
            </Box>
            <Box args={[0.4, height, 0.4]} position={[width / 2, 0, 0]}>
                <meshStandardMaterial color="#222" metalness={1} roughness={0} />
            </Box>

            {/* Yatay Lazer Kirişleri */}
            {[0.2, 0.5, 0.8].map((yMult, i) => (
                <Cylinder
                    key={i}
                    args={[0.08, 0.08, width, 8]}
                    rotation={[0, 0, Math.PI / 2]}
                    position={[0, -height / 2 + height * yMult, 0]}
                >
                    <meshBasicMaterial color={color} toneMapped={false} />
                </Cylinder>
            ))}

            {/* Arka Plan Enerji Alanı */}
            <Box args={[width, height - 0.2, 0.05]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    toneMapped={false}
                />
            </Box>
        </group>
    );
};

const BlockVisual: React.FC<{
    width: number;
    height: number;
    color: string;
}> = ({ width, height, color }) => {
    return (
        <group>
            {/* Ana Gövde */}
            <Box args={[width, height, width * 0.4]}>
                <MeshDistortMaterial
                    color={color}
                    speed={2}
                    distort={0.2}
                    emissive={color}
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </Box>

            {/* Dış Tel Kafes */}
            <Box args={[width + 0.2, height + 0.2, width * 0.4 + 0.2]}>
                <meshBasicMaterial
                    color={color}
                    wireframe
                    toneMapped={false}
                    opacity={0.8}
                    transparent
                />
            </Box>

            {/* Tarama Çizgisi */}
            <ScanningLine width={width} height={height} color={color} />
        </group>
    );
};

// Blokların üzerinde yukarı aşağı giden neon tarama çizgisi
const ScanningLine: React.FC<{
    width: number;
    height: number;
    color: string;
}> = ({ width, height, color }) => {
    const lineRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!lineRef.current) return;
        lineRef.current.position.y =
            Math.sin(state.clock.getElapsedTime() * 3) * (height / 2);
    });

    return (
        <Box ref={lineRef} args={[width + 0.4, 0.1, width * 0.4 + 0.4]}>
            <meshBasicMaterial color={color} toneMapped={false} />
        </Box>
    );
};

const GroundGlow: React.FC<{ width: number; color: string }> = ({
    width,
    color,
}) => (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[width + 2, 3]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} toneMapped={false} />
    </mesh>
);

const Obstacle: React.FC<ObstacleProps> = ({
    type,
    x,
    z,
    width,
    side,
    blockWidth,
}) => {
    const groupRef = useRef<THREE.Group>(null);

    // tek useFrame (sende iki kez vardı, onu temizledim)
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        const scale = 1 + Math.sin(t * 4) * 0.02;
        groupRef.current.scale.set(scale, scale, scale);
    });

    const barrierH = 1.2;
    const blockH = 2.2;
    const tallH = 5.5;

    const barrierColor = "#00ffcc";
    const blockColor = "#ff0088";
    const tallColor = "#ff3bd4";

    const isBarrier = type === ObstacleType.BARRIER;
    const isFullBarrier = type === ObstacleType.FULL_BARRIER;
    const isBlock = type === ObstacleType.BLOCK;
    const isSideTall = type === ObstacleType.SIDE_TALL;
    const isCombo = type === ObstacleType.COMBO;

    // Base transform: COMBO'da kendi içinde parçalara ayıracağız, o yüzden grup merkezde dursun
    const baseX = isCombo ? 0 : x;

    const baseY = useMemo(() => {
        if (isCombo) return 0;
        if (isBarrier || isFullBarrier) return barrierH / 2;
        if (isSideTall) return tallH / 2;
        return blockH / 2; // BLOCK
    }, [isCombo, isBarrier, isFullBarrier, isSideTall]);

    const glowColor = useMemo(() => {
        if (isBarrier || isFullBarrier) return barrierColor;
        if (isSideTall) return tallColor;
        if (isCombo) return barrierColor;
        return blockColor;
    }, [isBarrier, isFullBarrier, isSideTall, isCombo]);

    return (
        <group ref={groupRef} position={[baseX, baseY, z]}>
            {/* ===== Normal BARRIER ===== */}
            {isBarrier && (
                <>
                    <BarrierVisual width={width} height={barrierH} color={barrierColor} />
                    <GroundGlow width={width} color={barrierColor} />
                </>
            )}

            {/* ===== Normal BLOCK ===== */}
            {isBlock && (
                <>
                    <BlockVisual width={width} height={blockH} color={blockColor} />
                    <GroundGlow width={width} color={blockColor} />
                </>
            )}

            {/* ===== SIDE_TALL (sol/sağ yarı) ===== */}
            {isSideTall && (
                <>
                    <BlockVisual width={width} height={tallH} color={tallColor} />
                    <GroundGlow width={width} color={tallColor} />
                </>
            )}

            {/* ===== FULL_BARRIER (tüm yol) ===== */}
            {isFullBarrier && (
                <>
                    <BarrierVisual width={width} height={barrierH} color={barrierColor} />
                    <GroundGlow width={width} color={barrierColor} />
                </>
            )}

            {/* ===== COMBO: FULL_BARRIER + SIDE_TALL aynı z ===== */}
            {isCombo && (
                <>
                    {/* full barrier: merkezde */}
                    <group position={[0, barrierH / 2, 0]}>
                        <BarrierVisual
                            width={width}
                            height={barrierH}
                            color={barrierColor}
                        />
                    </group>

                    {/* side tall: sol/sağ */}
                    <group
                        position={[
                            // side verilmemişse random default gibi düşün: sağ
                            side === "left" ? -(blockWidth ?? width / 2) / 2 : +(blockWidth ?? width / 2) / 2,
                            tallH / 2,
                            0,
                        ]}
                    >
                        <BlockVisual
                            width={blockWidth ?? width / 2}
                            height={tallH}
                            color={tallColor}
                        />
                    </group>

                    {/* glow: combo için tek glow yeter */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                        <planeGeometry args={[width + 2, 3]} />
                        <meshBasicMaterial
                            color={barrierColor}
                            transparent
                            opacity={0.2}
                            toneMapped={false}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
};

export default Obstacle;
