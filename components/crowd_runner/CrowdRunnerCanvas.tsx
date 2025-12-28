// @ts-nocheck
/**
 * CrowdRunnerCanvas.tsx - COUNT MASTERS + SHOOTER
 * 
 * Start with 5 soldiers, gain from LEFT pickups
 * Weapon upgrades from LEFT
 * Enemies from RIGHT
 * Muzzle flash when shooting
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import {
    crowdState,
    resetCrowdGame,
    startCrowdGame,
    damagePlayer,
    reloadAmmo,
    addSoldiers,
    upgradeWeapon,
    addScore,
    FIRE_RATE,
    WEAPON_NAMES,
    WEAPON_COLORS
} from './crowdState';

// Constants
const LEFT_LANE = -3.5;  // Pickups & Weapons
const RIGHT_LANE = 3.5;  // Enemies
const RUN_SPEED = 16;
const SPAWN_DISTANCE = 70;

// ============================================
// TYPES
// ============================================
interface Enemy {
    id: number;
    x: number;
    z: number;
    hp: number;
    maxHp: number;
}

interface Trap {
    id: number;
    x: number;
    z: number;
    type: 'spike';
}

interface Pickup {
    id: number;
    x: number;
    z: number;
    type: 'soldier' | 'weapon' | 'ammo';
    value: number; // Can be negative for soldiers
}

// ============================================
// CAMERA
// ============================================
const GameCamera = () => {
    const { camera } = useThree();

    useFrame((state) => {
        // Camera follows player
        // Increased Z offset (distance - 14) to push character 'forward' (make them appear smaller/further but with more view ahead)
        // OR Decreased Z offset to make them closer? 
        // User said "öne al" (bring forward/front). Usually means "further away from camera" so you see more ground?
        // Or "closer to screen"? Let's try adjusting Y and Z for a better "Runner" view.
        const targetZ = crowdState.distance - 10; // Was -12. Closer camera = Character bigger/closer. Character öne (ekrana) gelir.

        // Smooth follow
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, crowdState.playerX * 0.8, 0.1);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 6, 0.1); // Slightly higher
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.1);

        state.camera.lookAt(crowdState.playerX * 0.5, 0, crowdState.distance + 8); // Look further ahead
    });

    return null;
};

// ============================================
// GROUND
// ============================================
const Ground = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const leftRef = useRef<THREE.Mesh>(null);
    const rightRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        const z = crowdState.distance + 100;
        if (meshRef.current) meshRef.current.position.z = z;
        if (leftRef.current) leftRef.current.position.z = z;
        if (rightRef.current) rightRef.current.position.z = z;
    });

    return (
        <group>
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 100]} receiveShadow>
                <planeGeometry args={[14, 400]} />
                <meshStandardMaterial color="#8B7355" />
            </mesh>
            <mesh ref={leftRef} position={[-8.5, 1.5, 100]}>
                <boxGeometry args={[3, 3, 400]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
            <mesh ref={rightRef} position={[8.5, 1.5, 100]}>
                <boxGeometry args={[3, 3, 400]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>
        </group>
    );
};

// ============================================
// PLAYER ARMY (Blue soldiers)
// ============================================
// ============================================
// PLAYER ARMY (Blue soldiers)
// ============================================
const Soldier = ({ index }: { index: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        // Dynamic visibility check each frame
        const isVisible = index < crowdState.soldierCount;
        meshRef.current.visible = isVisible;

        if (!isVisible) return;

        const time = clock.getElapsedTime();
        const angle = index * 2.39996;
        const radius = Math.sqrt(index) * 0.55;

        meshRef.current.position.set(
            crowdState.playerX + Math.cos(angle) * radius,
            0.6 + Math.sin(time * 10 + index * 0.5) * 0.08,
            crowdState.distance + Math.sin(angle) * radius - 2
        );
    });

    // Always render the mesh, control visibility via ref
    return (
        <mesh ref={meshRef} castShadow visible={false}>
            <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
            <meshStandardMaterial color="#2196F3" emissive="#1565C0" emissiveIntensity={0.4} />
        </mesh>
    );
};

const PlayerArmy = () => {
    // Generate static array of max soldiers indices
    const soldiers = useMemo(() => Array.from({ length: 150 }, (_, i) => i), []);

    return (
        <group>
            {soldiers.map(i => (
                <Soldier key={i} index={i} />
            ))}
            <SoldierCount />
            <WeaponModel />
        </group>
    );
};

const SoldierCount = () => {
    const textRef = useRef<any>(null);

    useFrame(() => {
        if (textRef.current) {
            textRef.current.position.set(crowdState.playerX, 4, crowdState.distance - 2);
            // Update text content dynamically
            if (textRef.current.text !== crowdState.soldierCount.toString()) {
                textRef.current.text = crowdState.soldierCount.toString();
            }
        }
    });

    return (
        <Text ref={textRef} rotation={[0, Math.PI, 0]} fontSize={1.5} color="#2196F3" outlineWidth={0.08} outlineColor="#000">
            {crowdState.soldierCount.toString()}
        </Text>
    );
};

// ============================================
// WEAPON MODEL (changes per level)
// ============================================
const WeaponModel = () => {
    const groupRef = useRef<any>(null);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.position.set(crowdState.playerX, 0.9, crowdState.distance + 0.8);
        }
    });

    const level = crowdState.weaponLevel;
    const color = WEAPON_COLORS[level - 1] || '#666';
    const scale = 0.8 + level * 0.15;

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            {/* Gun body */}
            <Box args={[0.15, 0.15, 0.8]} position={[0, 0, 0.4]}>
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </Box>
            {/* Barrel */}
            <Cylinder args={[0.05, 0.06, 0.5]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.9]}>
                <meshStandardMaterial color="#222" metalness={0.9} />
            </Cylinder>
            {level >= 3 && (
                <Box args={[0.25, 0.08, 0.3]} position={[0, -0.1, 0.3]}>
                    <meshStandardMaterial color="#333" />
                </Box>
            )}
        </group>
    );
};

// ============================================
// MUZZLE FLASH
// ============================================
const MuzzleFlash = ({ active }: { active: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current && active) {
            meshRef.current.position.set(crowdState.playerX, 0.9, crowdState.distance + 1.8);
            meshRef.current.scale.setScalar(0.3 + Math.random() * 0.3);
        }
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
        </mesh>
    );
};

// ============================================
// ENEMY
// ============================================
const EnemyVisual = ({ enemy }: { enemy: Enemy }) => {
    const hpPercent = enemy.hp / enemy.maxHp;

    return (
        <group position={[enemy.x, 0, enemy.z]}>
            <mesh position={[0, 0.5, 0]}>
                <capsuleGeometry args={[0.35, 0.7, 4, 8]} />
                <meshStandardMaterial color="#f44336" emissive="#b71c1c" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1.2, 0.15, 0.1]} />
                <meshBasicMaterial color="#333" />
            </mesh>
            <mesh position={[-(1 - hpPercent) * 0.6, 1.5, 0.02]}>
                <boxGeometry args={[hpPercent * 1.2, 0.12, 0.1]} />
                <meshBasicMaterial color="#ff0000" />
            </mesh>
            <Text position={[0, 2, 0]} rotation={[0, Math.PI, 0]} fontSize={0.6} color="#ff6666" outlineWidth={0.03} outlineColor="#000">
                {enemy.hp}
            </Text>
        </group>
    );
};

// ============================================
// PICKUP (Left lane: Soldiers, Weapons, Ammo)
// ============================================
// ============================================
// TRAP (Spinning Spike)
// ============================================
const TrapVisual = ({ trap }: { trap: Trap }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 5;
        }
    });

    return (
        <group position={[trap.x, 0, trap.z]}>
            {/* Base */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.2, 1.4, 0.2, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Spike */}
            <mesh ref={meshRef} position={[0, 0.8, 0]}>
                <coneGeometry args={[1, 1.5, 4]} /> // Pyramid spike
                <meshStandardMaterial color="#D32F2F" metalness={0.8} roughness={0.4} />
            </mesh>
            <Text position={[0, 2.5, 0]} fontSize={0.8} color="#D32F2F" outlineWidth={0.04} outlineColor="#000">
                Wait! Trap!
            </Text>
        </group>
    );
};

// ============================================
// PICKUP (Left/Right lanes: Soldiers, Weapons, Ammo)
// ============================================
const PickupVisual = ({ pickup }: { pickup: Pickup }) => {
    const groupRef = useRef<THREE.Group>(null);
    const isNegative = pickup.value < 0;

    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.position.y = 0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
            groupRef.current.rotation.y += 0.02;
        }
    });

    // Soldier: Green if positive, Red if negative
    const soldierColor = isNegative ? '#D32F2F' : '#4CAF50';

    const colors = { soldier: soldierColor, weapon: '#E91E63', ammo: '#FFC107' };
    const icons = {
        soldier: `${pickup.value > 0 ? '+' : ''}${pickup.value} 👤`,
        weapon: 'WEAPON ⬆',
        ammo: `+${pickup.value} 🔫`
    };

    return (
        <group position={[pickup.x, 0, pickup.z]}>
            <group ref={groupRef}>
                <Cylinder args={[1.2, 1.2, 0.3, 16]}>
                    <meshStandardMaterial color={colors[pickup.type]} emissive={colors[pickup.type]} emissiveIntensity={0.5} />
                </Cylinder>
                {pickup.type === 'soldier' && (
                    <mesh position={[0, 0.5, 0]}>
                        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
                        <meshStandardMaterial color={isNegative ? '#B71C1C' : '#2196F3'} />
                    </mesh>
                )}
                {pickup.type === 'weapon' && (
                    <Box args={[0.3, 0.15, 0.6]} position={[0, 0.4, 0]}>
                        <meshStandardMaterial color="#E91E63" metalness={0.8} />
                    </Box>
                )}
            </group>
            <Text position={[0, 2.5, 0]} rotation={[0, Math.PI, 0]} fontSize={0.7} color={colors[pickup.type]} outlineWidth={0.04} outlineColor="#000">
                {icons[pickup.type]}
            </Text>
        </group>
    );
};

// ============================================
// BULLETS
// ============================================
// ============================================
// BULLETS
// ============================================
const Bullet = ({ data }: { data: { id: number, x: number, z: number } }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.set(data.x, 1, data.z);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffff00" />
        </mesh>
    );
};

const Bullets = ({ enemies, onHit, setFlash }: { enemies: Enemy[], onHit: (id: number, dmg: number) => void, setFlash: (v: boolean) => void }) => {
    const [bullets, setBullets] = useState<{ id: number, x: number, z: number }[]>([]);
    const lastShot = useRef(0);
    const bulletId = useRef(0);

    useFrame(({ clock }, delta) => {
        if (crowdState.status !== 'RUNNING') return;

        const now = clock.getElapsedTime();

        // Fire
        if (now - lastShot.current > 1 / FIRE_RATE && crowdState.ammo > 0) {
            crowdState.ammo--;
            lastShot.current = now;
            setFlash(true);
            setTimeout(() => setFlash(false), 50);

            // Fire bullets for EACH soldier (up to a limit to save visual clutter/perf)
            const count = Math.min(20, crowdState.soldierCount);
            const radius = Math.min(2.5, Math.sqrt(crowdState.soldierCount) * 0.4);

            // Always fire at least one center shot
            setBullets(prev => [...prev, { id: bulletId.current++, x: crowdState.playerX, z: crowdState.distance + 2.5 }]);

            // Fire extra shots for other soldiers
            if (count > 1) {
                const extraShots = count - 1;
                for (let i = 0; i < extraShots; i++) {
                    // Randomize start position around army radius to simulate group fire
                    const offsetX = (Math.random() - 0.5) * 2 * radius;
                    setBullets(prev => [...prev, { id: bulletId.current++, x: crowdState.playerX + offsetX, z: crowdState.distance + 2.5 }]);
                }
            }
        }

        // Move bullets
        setBullets(prev => prev.map(b => {
            const newZ = b.z + 50 * delta;
            for (const e of enemies) {
                if (Math.abs(e.x - b.x) < 1.5 && Math.abs(e.z - newZ) < 1.5) {
                    onHit(e.id, crowdState.weaponDamage);
                    return null;
                }
            }
            return { ...b, z: newZ };
        }).filter(b => b && b.z < crowdState.distance + SPAWN_DISTANCE + 15));
    });

    return (
        <group>
            {bullets.map(b => <Bullet key={b.id} data={b} />)}
        </group>
    );
};

// ============================================
// GAME MANAGER
// ============================================
const GameManager = () => {
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [pickups, setPickups] = useState<Pickup[]>([]);
    const [traps, setTraps] = useState<Trap[]>([]);
    const [muzzleFlash, setMuzzleFlash] = useState(false);
    const lastSpawn = useRef({ enemy: 0, pickup: 0, trap: 0 });
    const ids = useRef({ enemy: 0, pickup: 0, trap: 0 });

    const isDragging = useRef(false);
    const lastX = useRef(0);

    useEffect(() => {
        const handleDown = (e: MouseEvent | TouchEvent) => {
            isDragging.current = true;
            lastX.current = 'clientX' in e ? e.clientX : e.touches[0].clientX;
        };
        const handleUp = () => isDragging.current = false;
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
            const delta = clientX - lastX.current;
            lastX.current = clientX;
            crowdState.playerX = Math.max(-5, Math.min(5, crowdState.playerX + delta * 0.035));
        };

        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchstart', handleDown);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchstart', handleDown);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);

    useFrame(({ clock }, delta) => {
        if (crowdState.status !== 'RUNNING') return;

        crowdState.distance += RUN_SPEED * delta;
        const now = clock.getElapsedTime();
        const difficulty = 1 + crowdState.wave * 0.12;

        // Spawn enemies on LEFT lane (Horde Logic)
        if (now - lastSpawn.current.enemy > Math.max(2.5, 4.0 / difficulty)) {
            lastSpawn.current.enemy = now;

            // Spawn a horde (3-6 enemies)
            const count = 3 + Math.floor(Math.random() * 4);
            const newEnemies = [];

            for (let i = 0; i < count; i++) {
                const hp = Math.floor(8 + crowdState.wave * 4);
                // Random position within horde cluster
                const zOffset = (Math.random() * 5); // Spread in depth
                const xOffset = (Math.random() - 0.5) * 2.5; // Spread in width

                newEnemies.push({
                    id: ids.current.enemy++,
                    x: LEFT_LANE + xOffset,
                    z: crowdState.distance + SPAWN_DISTANCE + zOffset,
                    hp,
                    maxHp: hp
                });
            }
            setEnemies(prev => [...prev, ...newEnemies]);
        }

        // Spawn pickups on RIGHT lane (Negative logic added)
        if (now - lastSpawn.current.pickup > 1.8) {
            lastSpawn.current.pickup = now;
            const types: Array<'soldier' | 'weapon' | 'ammo'> = ['soldier', 'soldier', 'ammo', 'ammo', 'weapon'];
            const type = types[Math.floor(Math.random() * types.length)];

            let value = 0;
            if (type === 'soldier') {
                // 30% chance to be negative
                const isNegative = Math.random() < 0.3;
                value = 3 + Math.floor(Math.random() * 5);
                if (isNegative) value = -value;
            } else {
                const values = { weapon: 1, ammo: 30 + Math.floor(Math.random() * 40) };
                value = values[type as 'weapon' | 'ammo'];
            }

            setPickups(prev => [...prev, {
                id: ids.current.pickup++,
                x: RIGHT_LANE + (Math.random() - 0.5) * 2,
                z: crowdState.distance + SPAWN_DISTANCE,
                type,
                value
            }]);
        }

        // Spawn Traps (Random Lanes)
        if (now - lastSpawn.current.trap > 3.5) {
            lastSpawn.current.trap = now;
            // Spawn on random lane (Left or Right)
            const lane = Math.random() > 0.5 ? LEFT_LANE : RIGHT_LANE;

            setTraps(prev => [...prev, {
                id: ids.current.trap++,
                x: lane + (Math.random() - 0.5) * 1.5,
                z: crowdState.distance + SPAWN_DISTANCE,
                type: 'spike'
            }]);
        }

        // Update enemies
        setEnemies(prev => prev.map(e => {
            if (e.z < crowdState.distance + 1 && Math.abs(e.x - crowdState.playerX) < 1.8) {
                damagePlayer(Math.ceil(e.hp / 2));
                return null;
            }
            if (e.z < crowdState.distance - 8) return null;
            return e;
        }).filter(Boolean));

        // Update pickups (Handle negative soldiers)
        setPickups(prev => prev.map(p => {
            if (p.z < crowdState.distance + 1.5 && Math.abs(p.x - crowdState.playerX) < 2) {
                if (p.type === 'soldier') {
                    if (p.value > 0) addSoldiers(p.value);
                    else damagePlayer(Math.abs(p.value)); // Negative value damages player
                }
                else if (p.type === 'weapon') upgradeWeapon();
                else if (p.type === 'ammo') reloadAmmo(p.value);

                if (p.value > 0) addScore(20);
                return null;
            }
            if (p.z < crowdState.distance - 8) return null;
            return p;
        }).filter(Boolean));

        // Update traps
        setTraps(prev => prev.map(t => {
            if (t.z < crowdState.distance + 1.5 && Math.abs(t.x - crowdState.playerX) < 1.8) {
                damagePlayer(5); // Trap damage
                return null;
            }
            if (t.z < crowdState.distance - 8) return null;
            return t;
        }).filter(Boolean));


        // Wave
        if (enemies.length === 0 && now > 4) crowdState.wave++;
    });

    const handleHit = (id: number, dmg: number) => {
        setEnemies(prev => prev.map(e => {
            if (e.id === id) {
                if (e.hp - dmg <= 0) {
                    addScore(e.maxHp * 2);
                    return null;
                }
                return { ...e, hp: e.hp - dmg };
            }
            return e;
        }).filter(Boolean));
    };

    return (
        <>
            {traps.map(t => <TrapVisual key={t.id} trap={t} />)}
            {enemies.map(e => <EnemyVisual key={e.id} enemy={e} />)}
            {pickups.map(p => <PickupVisual key={p.id} pickup={p} />)}
            <Bullets enemies={enemies} onHit={handleHit} setFlash={setMuzzleFlash} />
            <MuzzleFlash active={muzzleFlash} />
        </>
    );
};

// ============================================
// HUD
// ============================================
const GameHUD = ({ onBack }: { onBack: () => void }) => {
    const [s, setS] = useState({ soldiers: 5, ammo: 80, dmg: 3, weaponLvl: 1, score: 0, wave: 1, status: 'MENU', distance: 0 });

    useEffect(() => {
        const i = setInterval(() => setS({
            soldiers: crowdState.soldierCount,
            ammo: crowdState.ammo,
            dmg: crowdState.weaponDamage,
            weaponLvl: crowdState.weaponLevel,
            score: crowdState.score,
            wave: crowdState.wave,
            status: crowdState.status,
            distance: crowdState.distance
        }), 50);
        return () => clearInterval(i);
    }, []);

    if (s.status === 'MENU') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-900 z-50">
                <div className="text-center">
                    <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">CROWD</h1>
                    <h2 className="text-3xl font-bold text-yellow-300 mb-2">SHOOTER</h2>
                    <p className="text-white/70 mb-6 text-sm">Asker Topla • Düşman Vur • Silah Geliştir</p>
                    <button onClick={startCrowdGame} className="px-12 py-5 bg-green-500 hover:bg-green-400 text-white font-black text-2xl rounded-xl shadow-lg">
                        ▶ BAŞLA
                    </button>
                </div>
            </div>
        );
    }

    if (s.status === 'GAMEOVER') {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-50">
                <div className="text-center">
                    <h1 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h1>
                    <p className="text-2xl text-white mb-2">Puan: {s.score}</p>
                    <p className="text-gray-400 mb-8">{Math.floor(s.distance)}m koştun</p>
                    <button onClick={startCrowdGame} className="px-10 py-4 bg-yellow-500 text-black font-bold text-xl rounded-xl">
                        TEKRAR DENE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 pointer-events-none z-10">
            <button onClick={onBack} className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500/80 text-white text-sm rounded pointer-events-auto">✕ ÇIKIŞ</button>

            {/* Soldiers */}
            <div className="absolute top-4 left-4 bg-blue-600/90 px-4 py-2 rounded-xl">
                <div className="text-xs text-blue-200">ASKERLER</div>
                <div className="text-3xl font-black text-white">{s.soldiers}</div>
            </div>

            {/* Ammo */}
            <div className="absolute top-4 right-4 bg-yellow-600/90 px-4 py-2 rounded-xl text-right">
                <div className="text-xs text-yellow-200">MERMİ</div>
                <div className="text-3xl font-black text-white">{s.ammo}</div>
            </div>

            {/* Weapon Level */}
            <div className="absolute top-20 left-4 bg-pink-600/90 px-3 py-1 rounded-lg">
                <div className="text-xs text-pink-200">SİLAH</div>
                <div className="text-lg font-bold text-white">Lv.{s.weaponLvl} ({s.dmg}dmg)</div>
            </div>

            {/* Score & Wave */}
            <div className="absolute bottom-6 w-full text-center">
                <div className="text-white/60 text-sm">DALGA {s.wave}</div>
                <div className="text-2xl font-black text-white">{s.score} pts</div>
                <div className="text-white/40 text-xs">{Math.floor(s.distance)}m</div>
            </div>

            <div className="absolute bottom-24 w-full text-center text-white/40 text-xs">← Sürükle →</div>
        </div>
    );
};

// ============================================
// MAIN CANVAS
// ============================================
const CrowdRunnerCanvas = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="w-full h-screen relative overflow-hidden">
            <GameHUD onBack={onBack} />
            <Canvas shadows camera={{ fov: 55, position: [0, 9, -12] }}>
                <color attach="background" args={['#87CEEB']} />
                <fog attach="fog" args={['#87CEEB', 50, 140]} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 25, 15]} intensity={1.2} castShadow />
                <GameCamera />
                <Ground />
                <PlayerArmy />
                <GameManager />
            </Canvas>
        </div>
    );
};

export default CrowdRunnerCanvas;
