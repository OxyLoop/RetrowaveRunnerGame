// @ts-nocheck
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { gameStateRef, getCurrentWeapon, addProjectile } from '../state/gameState';
import { GamePhase, Projectile, WeaponType } from '../types';
import { getWeaponStats } from '../types/weapons';
import { TRACK_WIDTH, STEER_SPEED, COLORS } from '../constants';

let projectileIdCounter = 0;

const Player: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const lastShotTime = useRef(0);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const gs = gameStateRef.current;

        // Show/Hide logic handled in return check, but we need PHYSICS running
        if (gs.gameMode === 'HYPER_CASUAL') {
            groupRef.current.visible = false;
            // Do NOT return here, let physics/input run
        } else {
            groupRef.current.visible = true;
        }

        if (gs.phase !== GamePhase.RUNNING && gs.phase !== GamePhase.BOSS_FIGHT) return;

        // Handle movement
        if (gs.input.left) gs.player.x -= STEER_SPEED * delta;
        if (gs.input.right) gs.player.x += STEER_SPEED * delta;

        // Clamp to track
        const maxX = TRACK_WIDTH / 2 - 1;
        gs.player.x = Math.max(-maxX, Math.min(maxX, gs.player.x));

        // Update visual position
        groupRef.current.position.x = gs.player.x;
        groupRef.current.position.z = gs.distance;

        // Bobbing or Jumping
        const time = state.clock.getElapsedTime();
        if (gs.player.isJumping) {
            gs.player.velocity.y -= 25 * delta; // Gravity
            gs.player.y += gs.player.velocity.y * delta;

            if (gs.player.y <= 0.5) {
                gs.player.y = 0.5;
                gs.player.velocity.y = 0;
                gs.player.isJumping = false;
            }
            groupRef.current.position.y = gs.player.y;
        } else {
            groupRef.current.position.y = 0.5 + Math.sin(time * 8) * 0.05;
        }

        // AUTO-FIRE: Always shoot when in game!
        const weapon = getCurrentWeapon();
        if (!weapon) return;

        const stats = getWeaponStats(weapon);
        const now = Date.now();
        const fireInterval = 1000 / stats.fireRate;

        // Fire continuously or when shoot input is pressed
        if (now - lastShotTime.current >= fireInterval) {
            lastShotTime.current = now;

            // Check ammo
            if (weapon.ammo > 0 || weapon.ammo === Infinity) {
                if (weapon.ammo !== Infinity) weapon.ammo--;

                // Fire projectile(s)
                if (weapon.type === WeaponType.SHOTGUN) {
                    for (let i = 0; i < 5; i++) {
                        const spread = (i - 2) * 0.3;
                        createProjectile(gs, weapon, stats.damage, spread, 0);
                    }
                } else {
                    createProjectile(gs, weapon, stats.damage, 0, 0);
                }

                // Clone squadron extra shots
                if (gs.player.clonesActive) {
                    createProjectile(gs, weapon, stats.damage, 0, -2);
                    createProjectile(gs, weapon, stats.damage, 0, 2);
                }
            }
        }

        // Clone timer check
        if (gs.player.clonesActive && Date.now() > (gs.player.clonesUntil || 0)) {
            gs.player.clonesActive = false;
        }

        // Invulnerability check
        if (gs.player.isInvulnerable && Date.now() > gs.player.invulnerableUntil) {
            gs.player.isInvulnerable = false;
        }
    });

    const createProjectile = (gs: any, weapon: any, damage: number, spread: number, offsetX: number) => {
        const projectile: Projectile = {
            id: ++projectileIdCounter,
            x: gs.player.x + offsetX + spread * 2,
            y: 1,
            z: gs.distance - 2,
            vx: spread * 15,
            vy: 0,
            vz: -weapon.projectileSpeed,
            damage,
            color: weapon.projectileColor,
            size: weapon.projectileSize * 2, // Make projectiles bigger
            piercing: weapon.piercing,
            explosive: weapon.explosive,
            fromEnemy: false,
        };
        addProjectile(projectile);
    };

    const gs = gameStateRef.current;
    const visible = !gs.player.isInvulnerable || Math.floor(Date.now() / 100) % 2 === 0;

    return (
        <group ref={groupRef} position={[0, 0.5, 0]} visible={visible}>
            {/* Main ship body */}
            <Box args={[1.5, 0.4, 2.5]} position={[0, 0, 0]}>
                <meshStandardMaterial
                    color="#111133"
                    emissive={COLORS.NEON_CYAN}
                    emissiveIntensity={0.8}
                    metalness={0.9}
                    roughness={0.2}
                    toneMapped={false}
                />
            </Box>

            {/* Cockpit - glowing */}
            <Sphere args={[0.4, 16, 16]} position={[0, 0.3, 0.3]}>
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </Sphere>

            {/* Wings */}
            <Box args={[3, 0.15, 1]} position={[0, -0.1, 0.3]}>
                <meshStandardMaterial
                    color="#220044"
                    emissive={COLORS.NEON_MAGENTA}
                    emissiveIntensity={0.8}
                    metalness={0.8}
                    roughness={0.3}
                    toneMapped={false}
                />
            </Box>

            {/* Engine glow left */}
            <Cylinder args={[0.2, 0.25, 0.6, 8]} position={[-0.5, -0.1, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </Cylinder>

            {/* Engine glow right */}
            <Cylinder args={[0.2, 0.25, 0.6, 8]} position={[0.5, -0.1, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </Cylinder>

            {/* Gun barrels */}
            <Cylinder args={[0.08, 0.08, 0.8, 6]} position={[-0.6, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ff00ff" toneMapped={false} />
            </Cylinder>
            <Cylinder args={[0.08, 0.08, 0.8, 6]} position={[0.6, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ff00ff" toneMapped={false} />
            </Cylinder>

            {/* Clones Visuals */}
            {gs.player.clonesActive && (
                <>
                    <CloneShip offsetX={-2.5} />
                    <CloneShip offsetX={2.5} />
                </>
            )}
        </group>
    );
};

const CloneShip: React.FC<{ offsetX: number }> = ({ offsetX }) => (
    <group position={[offsetX, 0, 0.5]}>
        <Box args={[1, 0.3, 1.5]}>
            <meshStandardMaterial color="#6600ff" transparent opacity={0.6} wireframe />
        </Box>
        <Sphere args={[0.25, 8, 8]} position={[0, 0.2, 0.2]}>
            <meshBasicMaterial color="#aa00ff" transparent opacity={0.7} />
        </Sphere>
    </group>
);

export default Player;
