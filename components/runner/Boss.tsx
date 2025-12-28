import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sphere, Text, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

interface BossProps {
    z: number;
    name: string;
    hp: number;
    maxHp: number;
    isActive: boolean;
    color?: string;
    onDamage?: (amount: number) => void;
}

interface DamageNumber {
    id: number;
    amount: number;
    position: THREE.Vector3;
    lifetime: number;
}

const Boss: React.FC<BossProps> = ({
    z,
    name,
    hp,
    maxHp,
    isActive,
    color = "#ff00ff",
    onDamage
}) => {
    const coreRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const shieldRef = useRef<THREE.Mesh>(null);
    const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
    const [flashIntensity, setFlashIntensity] = useState(0);
    const lastHp = useRef(hp);

    useFrame((state, delta) => {
        if (!isActive || !coreRef.current) return;
        const t = state.clock.getElapsedTime();

        // Position ve animasyonlar
        coreRef.current.position.z = z;
        coreRef.current.position.y = 3 + Math.sin(t * 1.5) * 0.8;
        coreRef.current.rotation.y += delta * 0.3;

        // Rotating rings
        if (ringRef.current) {
            ringRef.current.rotation.z = t * 0.8;
            ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.3;
        }

        // Shield pulse
        if (shieldRef.current) {
            const healthPercent = hp / maxHp;
            const pulseSpeed = 2 + (1 - healthPercent) * 3; // Low HP = faster pulse
            const scale = 1 + Math.sin(t * pulseSpeed) * 0.1;
            shieldRef.current.scale.setScalar(scale);
            shieldRef.current.rotation.y -= delta * 0.5;
        }

        // Damage detection
        if (hp < lastHp.current) {
            const damage = lastHp.current - hp;
            setFlashIntensity(1);

            // Spawn damage number
            const newDamage: DamageNumber = {
                id: Date.now() + Math.random(),
                amount: Math.round(damage),
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    3 + Math.random() * 2,
                    z
                ),
                lifetime: 1.0
            };
            setDamageNumbers(prev => [...prev, newDamage]);

            if (onDamage) onDamage(damage);
        }
        lastHp.current = hp;

        // Flash fade
        if (flashIntensity > 0) {
            setFlashIntensity(Math.max(0, flashIntensity - delta * 4));
        }

        // Update damage numbers
        setDamageNumbers(prev =>
            prev
                .map(dmg => ({
                    ...dmg,
                    lifetime: dmg.lifetime - delta,
                    position: new THREE.Vector3(
                        dmg.position.x,
                        dmg.position.y + delta * 2,
                        dmg.position.z
                    )
                }))
                .filter(dmg => dmg.lifetime > 0)
        );
    });

    if (!isActive) return null;

    const healthPercent = hp / maxHp;
    const coreColor = flashIntensity > 0.5 ? "#ffffff" : color;

    return (
        <group ref={coreRef}>
            {/* Core - Wobbling Sphere */}
            <Sphere args={[2.5, 32, 32]} renderOrder={1000}>
                <MeshWobbleMaterial
                    color={coreColor}
                    factor={0.6}
                    speed={3}
                    emissive={coreColor}
                    emissiveIntensity={2 + flashIntensity * 3}
                    toneMapped={false}
                    roughness={0.2}
                    metalness={0.8}
                    depthTest={true}
                    depthWrite={true}
                />
            </Sphere>

            {/* Inner Glow */}
            <Sphere args={[2.8, 16, 16]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2 + flashIntensity * 0.3}
                    toneMapped={false}
                />
            </Sphere>

            {/* Rotating Energy Rings */}
            <mesh ref={ringRef}>
                <torusGeometry args={[4.5, 0.15, 16, 100]} />
                <meshBasicMaterial
                    color={color}
                    toneMapped={false}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Secondary Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[4.2, 0.12, 16, 100]} />
                <meshBasicMaterial
                    color="#ffee00"
                    toneMapped={false}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Shield Hexagon */}
            <mesh ref={shieldRef}>
                <cylinderGeometry args={[5, 5, 0.1, 6]} />
                <meshBasicMaterial
                    color={healthPercent > 0.3 ? "#00ff88" : "#ff0088"}
                    wireframe
                    transparent
                    opacity={0.3 + flashIntensity * 0.4}
                    toneMapped={false}
                />
            </mesh>

            {/* Orbiting Energy Spheres */}
            {[0, 1, 2, 3].map((i) => (
                <Float key={i} speed={2 + i * 0.5} rotationIntensity={0} floatIntensity={0.5}>
                    <Sphere
                        args={[0.3, 16, 16]}
                        position={[
                            Math.cos((i / 4) * Math.PI * 2) * 6,
                            Math.sin((i / 4) * Math.PI * 2) * 2,
                            0
                        ]}
                    >
                        <meshBasicMaterial color={color} toneMapped={false} />
                    </Sphere>
                </Float>
            ))}

            {/* Damage Numbers */}
            {damageNumbers.map((dmg) => (
                <Text
                    key={dmg.id}
                    position={dmg.position}
                    fontSize={1.2}
                    color="#ff0000"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.1}
                    outlineColor="#000000"
                >
                    -{dmg.amount}
                    <meshBasicMaterial
                        transparent
                        opacity={dmg.lifetime}
                        toneMapped={false}
                    />
                </Text>
            ))}

            {/* Boss Name Label (floating above) */}
            <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
                <Text
                    position={[0, 6, 0]}
                    fontSize={1.2}
                    color={color}
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.05}
                    outlineColor="#000000"
                >
                    {name}
                    <meshBasicMaterial color={color} toneMapped={false} />
                </Text>
            </Float>
        </group>
    );
};

export default Boss;
