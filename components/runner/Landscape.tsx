import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LandscapeProps {
    speed: number;
    color?: string;
}

const Landscape: React.FC<LandscapeProps> = ({ speed, color = "#00ffff" }) => {
    const gridCount = 20; // daha uzun "sonsuz" görünür
    const gridLength = 120;

    const groupRef = useRef<THREE.Group>(null);

    // Generate noise for mountains
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(520, gridLength, 180, 44);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);

            // Keep the road area (center) flat
            const distFromCenter = Math.abs(x);
            const roadHalfWidth = 14; // yolun düz kalacağı yarı genişlik
            if (distFromCenter > roadHalfWidth) {
                // Low poly mountain logic
                const noise =
                    Math.sin(x * 0.2) * Math.cos(y * 0.2) * 2 +
                    Math.sin(x * 0.5) * 1 +
                    Math.random() * 0.2;

                const elevation =
                    Math.pow(distFromCenter - roadHalfWidth, 1.2) * 0.4 * noise;
                pos.setZ(i, Math.max(0, elevation));
            } else {
                pos.setZ(i, 0);
            }
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <group ref={groupRef}>
            {Array.from({ length: gridCount }).map((_, i) => (
                <group key={i} position={[0, 0, -i * gridLength]}>
                    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
                        <meshStandardMaterial
                            color="#0a001a"
                            roughness={0.8}
                            metalness={0.2}
                            flatShading
                        />
                    </mesh>

                    {/* Renk artık prop'tan geliyor */}
                    <mesh
                        geometry={geometry}
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, 0.05, 0]}
                    >
                        <meshBasicMaterial
                            color={color}
                            wireframe
                            transparent
                            opacity={0.4}
                        />
                    </mesh>

                    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[15, gridLength]} />
                        <meshBasicMaterial color="#0a001a" toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export default Landscape;
