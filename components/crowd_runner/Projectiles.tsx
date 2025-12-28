// @ts-nocheck
/**
 * Projectiles.tsx - Bullets flying LEFT to hit enemies
 * Auto-fires when ammo available
 */
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crowdState, useAmmo, FIRE_RATE, PLAYER_X } from './crowdState';

interface Bullet {
    id: number;
    x: number;
    z: number;
    active: boolean;
}

const MAX_BULLETS = 30;
const BULLET_SPEED = 40;

const Projectiles = ({ enemies, onHitEnemy }: {
    enemies: Array<{ id: number, x: number, z: number, hp: number }>,
    onHitEnemy: (enemyId: number, damage: number) => void
}) => {
    const [bullets, setBullets] = useState<Bullet[]>([]);
    const lastShotTime = useRef(0);
    const bulletIdRef = useRef(0);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(({ clock }, delta) => {
        if (crowdState.status !== 'RUNNING') return;

        const now = clock.getElapsedTime();
        const fireInterval = 1 / FIRE_RATE;

        // Auto-fire if enough time passed and have ammo
        if (now - lastShotTime.current > fireInterval && crowdState.ammo > 0) {
            if (useAmmo(1)) {
                lastShotTime.current = now;

                // Create bullet from player position
                const newBullet: Bullet = {
                    id: bulletIdRef.current++,
                    x: PLAYER_X - 1,
                    z: crowdState.playerY,
                    active: true
                };

                setBullets(prev => [...prev.slice(-MAX_BULLETS + 1), newBullet]);
            }
        }

        // Update bullets - move LEFT
        setBullets(prev => {
            return prev.map(b => {
                if (!b.active) return b;

                const newX = b.x - BULLET_SPEED * delta;

                // Check collision with enemies
                for (const enemy of enemies) {
                    const dx = Math.abs(enemy.x - newX);
                    const dz = Math.abs(enemy.z - b.z);
                    if (dx < 1.5 && dz < 1.5) {
                        onHitEnemy(enemy.id, crowdState.weaponDamage);
                        return { ...b, active: false };
                    }
                }

                return { ...b, x: newX };
            }).filter(b => b.x > -20 && b.active);
        });

        // Update instanced mesh
        if (meshRef.current) {
            bullets.forEach((b, i) => {
                if (i >= MAX_BULLETS) return;
                dummy.position.set(b.x, 0.8, b.z);
                dummy.scale.setScalar(b.active ? 1 : 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            });

            for (let i = bullets.length; i < MAX_BULLETS; i++) {
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
            }

            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BULLETS]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#ffff00" />
        </instancedMesh>
    );
};

export default Projectiles;
