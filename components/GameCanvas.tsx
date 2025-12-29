// @ts-nocheck
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, Text, Box, Float } from '@react-three/drei';
import * as THREE from 'three';
import Landscape from './Landscape';
import UpgradeShop from './UpgradeShop';
import FloatingTexts from './FloatingTexts';
import Player from './Player';
import Enemies from './Enemies';
import Projectiles from './Projectiles';
import Particles from './Particles';
import PowerUps from './PowerUps';
import BossFight from './BossFight';
import FloatingTextRenderer from './FloatingText';
import MathGates from './MathGates';
import SoldierArmy from './SoldierArmy';
import EndermanBoss from './EndermanBoss';
import Obstacles from './Obstacles';
import { addFloatingText } from './FloatingText';
import { gameStateRef, resetGame, startGame, damageBoss, nextLevel } from '../state/gameState';
import { GamePhase, Boss } from '../types';
import { getLevelConfig } from '../types/levels';
import { TRACK_WIDTH, PLAYER_SPEED, STEER_SPEED, COLORS } from '../constants';

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onPhaseChange: (phase: GamePhase) => void;
  onBossInfo: (boss: Boss) => void;
  orientation?: 'auto' | 'portrait' | 'landscape';
}

// === ROAD COMPONENT ===
const RetroRoad = ({ width = 14, length = 800, dashCount = 50, primaryColor = '#ff3bd4', secondaryColor = '#ffb000', gridColor = '#ffe17a' }: { width?: number; length?: number; dashCount?: number; primaryColor?: string; secondaryColor?: string; gridColor?: string }) => {
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
      {/* Asphalt */}
      <mesh position={[0, 0.08, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#070711" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Neon edge lines - use theme colors */}
      <mesh position={[-width / 2 + 0.25, 0.11, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, length]} />
        <meshBasicMaterial color={primaryColor} toneMapped={false} />
      </mesh>
      <mesh position={[+width / 2 - 0.25, 0.11, -length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, length]} />
        <meshBasicMaterial color={secondaryColor} toneMapped={false} />
      </mesh>

      {/* Center dashes */}
      <instancedMesh ref={dashRef} args={[undefined as any, undefined as any, dashCount]}>
        <planeGeometry args={[0.22, 2.6]} />
        <meshBasicMaterial color={gridColor} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

// === HORIZON SUN - themed ===
const HorizonSun = ({ sunColor = '#ffaa00' }: { sunColor?: string }) => {
  const sunRef = useRef<THREE.Group>(null);
  const gs = gameStateRef.current;
  const level = getLevelConfig(gs.currentLevel);

  useFrame(() => {
    if (!sunRef.current) return;
    sunRef.current.position.set(0, 16, -level.distance - 100);
  });

  return (
    <group ref={sunRef}>
      <mesh>
        <circleGeometry args={[40, 24]} />
        <meshBasicMaterial color={sunColor} toneMapped={false} fog={false} />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, -10 + i * 5, 0.2]}>
          <planeGeometry args={[80, 2.5]} />
          <meshBasicMaterial color="#1a0b2e" toneMapped={false} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

// === PALM TREES ===
const PalmAvenue = ({ perSide = 44, spacing = 16 }: { perSide?: number; spacing?: number }) => {
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
    if (!trunkRef.current || !leafRef.current || !zRef.current || !jitterRef.current) return;

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
      <instancedMesh ref={trunkRef} args={[undefined as any, undefined as any, totalPalms]}>
        <cylinderGeometry args={[0.22, 0.48, 6.8, 8]} />
        <meshStandardMaterial color="#12051b" emissive="#ff00ff" emissiveIntensity={0.18} roughness={0.75} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined as any, undefined as any, totalLeaves]}>
        <planeGeometry args={[4.8, 1.25]} />
        <meshStandardMaterial color="#001a14" emissive="#00ffd0" emissiveIntensity={1.15} transparent opacity={0.95} side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};

// === CYBERPUNK CITY SKYLINE ===
const CyberpunkSkyline = ({ buildingCount = 40 }: { buildingCount?: number }) => {
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const windowsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate random building data once
  const buildingData = useMemo(() => {
    const data = [];
    for (let i = 0; i < buildingCount; i++) {
      const side = i < buildingCount / 2 ? -1 : 1;
      const x = side * (TRACK_WIDTH / 2 + 25 + Math.random() * 40);
      const z = -50 - i * 25 - Math.random() * 20;
      const height = 15 + Math.random() * 45;
      const width = 4 + Math.random() * 8;
      const depth = 4 + Math.random() * 6;
      const hue = Math.random() > 0.5 ? '#ff00ff' : '#00ffff';
      data.push({ x, z, height, width, depth, hue });
    }
    return data;
  }, [buildingCount]);

  useEffect(() => {
    if (!buildingsRef.current) return;

    buildingData.forEach((b, i) => {
      dummy.position.set(b.x, b.height / 2, b.z);
      dummy.scale.set(b.width, b.height, b.depth);
      dummy.updateMatrix();
      buildingsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    buildingsRef.current.instanceMatrix.needsUpdate = true;
  }, [buildingData, dummy]);

  return (
    <group>
      {/* Building silhouettes */}
      <instancedMesh ref={buildingsRef} args={[undefined as any, undefined as any, buildingCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#0a0015"
          emissive="#220033"
          emissiveIntensity={0.1}
          roughness={0.9}
        />
      </instancedMesh>

      {/* Neon edge lighting on buildings */}
      {buildingData.slice(0, 20).map((b, i) => (
        <group key={i} position={[b.x, b.height, b.z]}>
          {/* Top edge glow */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[b.width + 0.3, 0.3, b.depth + 0.3]} />
            <meshBasicMaterial color={b.hue} toneMapped={false} transparent opacity={0.8} />
          </mesh>
          {/* Vertical edge lines */}
          <mesh position={[-b.width / 2, -b.height / 2, b.depth / 2]}>
            <boxGeometry args={[0.2, b.height, 0.2]} />
            <meshBasicMaterial color={b.hue} toneMapped={false} transparent opacity={0.5} />
          </mesh>
          <mesh position={[b.width / 2, -b.height / 2, b.depth / 2]}>
            <boxGeometry args={[0.2, b.height, 0.2]} />
            <meshBasicMaterial color={b.hue} toneMapped={false} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// === BOSS MESH ===
const BossMesh = () => {
  const bossRef = useRef<THREE.Group>(null);
  const gs = gameStateRef.current;

  useFrame((state) => {
    if (!bossRef.current || !gs.boss.isActive) return;

    bossRef.current.position.z = gs.boss.z;
    bossRef.current.rotation.y += 0.01;
    bossRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    bossRef.current.position.y = 2 + Math.sin(state.clock.getElapsedTime()) * 0.5;
  });

  if (!gs.boss.isActive && gs.phase !== GamePhase.BOSS_FIGHT) return null;

  return (
    <group ref={bossRef} position={[0, 0, gs.boss.z]}>
      <Box args={[4, 4, 4]}>
        <meshStandardMaterial color="#220022" roughness={0.1} metalness={0.9} />
      </Box>
      <Box args={[4.5, 4.5, 4.5]}>
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} wireframe toneMapped={false} />
      </Box>
      <Box args={[1, 0.3, 0.3]} position={[-1, 0.6, 2.2]}>
        <meshBasicMaterial color="#ff0000" toneMapped={false} />
      </Box>
      <Box args={[1, 0.3, 0.3]} position={[1, 0.6, 2.2]}>
        <meshBasicMaterial color="#ff0000" toneMapped={false} />
      </Box>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <Text position={[0, 5, 0]} fontSize={1.5} color="#ff00ff" anchorX="center" anchorY="bottom">
          {gs.boss.name}
          <meshBasicMaterial color="#ff00ff" toneMapped={false} />
        </Text>
      </Float>
    </group>
  );
};

// === CAMERA CONTROLLER ===
const CameraController = ({ orientation = 'auto' }: { orientation?: 'auto' | 'portrait' | 'landscape' }) => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const mode = orientation === 'auto' ? (aspect > 1 ? 'landscape' : 'portrait') : orientation;

    if (mode === 'landscape') {
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

// === GAME CONTROLLER ===
const GameController = ({ onScoreChange, onPhaseChange, onBossInfo }: GameCanvasProps) => {
  const { camera } = useThree();

  useFrame((state, delta) => {
    const gs = gameStateRef.current;

    if (gs.phase === GamePhase.RUNNING) {
      // Move forward
      gs.distance -= PLAYER_SPEED * delta;

      // Player movement (works for both modes)
      if (gs.input.left) {
        gs.player.x = Math.max(gs.player.x - STEER_SPEED * delta, -TRACK_WIDTH / 2 + 1);
      }
      if (gs.input.right) {
        gs.player.x = Math.min(gs.player.x + STEER_SPEED * delta, TRACK_WIDTH / 2 - 1);
      }

      // Screen shake effect (subtle)
      const shake = gs.screenShake || 0;
      const shakeX = shake * (Math.random() - 0.5) * 0.5;
      const shakeY = shake * (Math.random() - 0.5) * 0.3;

      // Decay shake
      gs.screenShake = Math.max(0, shake - delta * 3);

      // Camera follows player with shake
      camera.position.z = gs.distance + 14;
      camera.position.y = 8 + shakeY;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, gs.player.x / 3, delta * 3) + shakeX;
      camera.lookAt(0, 2, gs.distance - 20);

      // Check boss trigger - ONLY in SHOOTER mode
      const level = getLevelConfig(gs.currentLevel);
      if (gs.gameMode !== 'HYPER_CASUAL' && gs.distance <= -level.distance + 50) {
        gs.phase = GamePhase.BOSS_FIGHT;
        gs.boss.isActive = true;
        gs.boss.z = -level.distance - 30;
        onPhaseChange(GamePhase.BOSS_FIGHT);
        onBossInfo({ ...gs.boss });
      }

      // HYPER_CASUAL: Boss fight after 500 distance
      if (gs.gameMode === 'HYPER_CASUAL' && gs.distance <= -500) {
        // Boss HP scales with soldiers - EASIER NOW (1x instead of 2x)
        const soldierCount = gs.hyperCasual?.soldierCount || 10;
        const bossHp = Math.min(1000, Math.max(200, soldierCount * 0.8)); // Much easier boss

        gs.phase = GamePhase.BOSS_FIGHT;
        gs.boss.isActive = true;
        gs.boss.z = -530;
        gs.boss.maxHp = bossHp;
        gs.boss.currentHp = bossHp;
        gs.boss.name = 'ENDER BOSS';
        onPhaseChange(GamePhase.BOSS_FIGHT);
        onBossInfo({ ...gs.boss });

        console.log(`[BOSS] Castle spawned with ${bossHp} HP! You have ${soldierCount} soldiers.`);
      }

      // Update score
      onScoreChange(gs.score);

    } else if (gs.phase === GamePhase.BOSS_FIGHT) {
      // Camera looks at boss
      if (gs.gameMode === 'HYPER_CASUAL') {
        // Wider view for hyper casual - see soldiers attacking
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, gs.distance + 25, delta * 2);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 12, delta * 2);
        camera.lookAt(0, 3, gs.boss.z + 5);
      } else {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, gs.distance + 20, delta);
        camera.lookAt(0, 3, gs.boss.z);
      }

      // HYPER_CASUAL: Soldiers attack boss automatically!
      if (gs.gameMode === 'HYPER_CASUAL' && gs.hyperCasual) {
        // Attack every 1 second for dramatic battle
        if (!gs.hyperCasual.lastAttack) gs.hyperCasual.lastAttack = Date.now();

        if (Date.now() - gs.hyperCasual.lastAttack > 1000) {
          gs.hyperCasual.lastAttack = Date.now();

          // Damage = soldier count / 20 (slower kill)
          const damage = Math.max(5, Math.ceil(gs.hyperCasual.soldierCount / 20));
          gs.boss.currentHp = Math.max(0, gs.boss.currentHp - damage);

          // Screen shake on hit!
          gs.screenShake = 0.3;

          // Visual Damage Number on Boss
          addFloatingText(`-${damage}`, 0, 8, gs.boss.z + 5, '#ff0000');

          // BOSS RETALIATION: Kills soldiers!
          // Kills 2 + 5% of army every second
          const casualties = Math.floor(2 + gs.hyperCasual.soldierCount * 0.05);
          gs.hyperCasual.soldierCount = Math.max(0, gs.hyperCasual.soldierCount - casualties);

          if (casualties > 0) {
            addFloatingText(`-${casualties} 💀`, (Math.random() - 0.5) * 5, 4, gs.distance + 15, '#ff0000');
          }

          // Score based on damage
          gs.score += damage * 5;

          console.log(`[BOSS] Attack! -${damage} HP. Casualties: ${casualties}`);
        }
      }

      // Boss info sync
      onBossInfo({ ...gs.boss });
      onScoreChange(gs.score);

      // Check if boss is dead
      if (gs.boss.currentHp <= 0) {
        // HYPER_CASUAL victory
        if (gs.gameMode === 'HYPER_CASUAL') {
          gs.score += gs.hyperCasual?.soldierCount || 0 * 100;
          gs.phase = GamePhase.VICTORY;
          onPhaseChange(GamePhase.VICTORY);
        } else if (gs.currentLevel >= gs.totalLevels) {
          gs.phase = GamePhase.VICTORY;
          onPhaseChange(GamePhase.VICTORY);
        } else {
          gs.phase = GamePhase.LEVEL_COMPLETE;
          onPhaseChange(GamePhase.LEVEL_COMPLETE);
        }
      }
    }

    // Update invulnerability
    if (gs.player.isInvulnerable && Date.now() > gs.player.invulnerableUntil) {
      gs.player.isInvulnerable = false;
    }
  });

  return null;
};


// === GAME SCENE ===
const GameScene: React.FC<GameCanvasProps> = (props) => {
  const { gl } = useThree();
  const gs = gameStateRef.current;
  const level = getLevelConfig(gs.currentLevel);

  useEffect(() => {
    gl.localClippingEnabled = true;
    console.log('[GameScene] Mounted - gameMode:', gs.gameMode, 'hyperCasual:', gs.hyperCasual);
  }, [gl]);

  return (
    <>
      <color attach="background" args={[level.backgroundColor]} />
      <fog attach="fog" args={[level.fogColor, 40, 250]} />

      <ambientLight intensity={0.5} color="#2b0b5a" />
      <pointLight position={[12, 18, 8]} intensity={1.8} color={level.primaryColor || '#00ffff'} />
      <pointLight position={[-12, 8, -12]} intensity={2.0} color={level.secondaryColor || '#ff00ff'} />
      <directionalLight position={[0, 12, -6]} intensity={0.8} color="#ffb000" />

      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />

      <GameController {...props} />
      <CameraController orientation={props.orientation} />

      <PalmAvenue perSide={40} spacing={20} />
      <CyberpunkSkyline buildingCount={30} />
      <Landscape speed={gs.phase === GamePhase.RUNNING ? 1.0 : 0.0} />
      <RetroRoad
        width={14}
        length={1500}
        dashCount={80}
        primaryColor={level.primaryColor || '#ff00ff'}
        secondaryColor={level.secondaryColor || '#00ffff'}
        gridColor={level.gridColor || '#ffff00'}
      />
      {/* Hide Sun in Hyper Casual Boss Fight */}
      {!(gs.gameMode === 'HYPER_CASUAL' && gs.phase === GamePhase.BOSS_FIGHT) && (
        <HorizonSun sunColor={level.sunColor || '#ff6600'} />
      )}

      {/* ALL components - they control their own visibility based on gameMode */}
      {/* Player Physics/Logic needs to run in ALL modes */}
      <Player />

      {gs.gameMode === 'HYPER_CASUAL' ? (
        <>
          <SoldierArmy />
          <MathGates />
          <Obstacles />
          <EndermanBoss />
        </>
      ) : (
        <>
          <Enemies />
          <Projectiles />
          <PowerUps />
          <FloatingTexts />
          <Particles />
          <EndermanBoss />
          {/* Boss Fight */}
        </>
      )}
      <FloatingTextRenderer />

      <Sparkles
        count={25}
        scale={10}
        size={4}
        speed={0.4}
        opacity={0.5}
        color="#00ffff"
        position={[0, 2, gs.distance - 10]}
      />
    </>
  );
};

// ============================================
// ACTION MUSIC (Shooter Mode)
// ============================================
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const ActionMusic = ({ active }: { active: boolean }) => {
  const intervalRef = useRef<any>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  useEffect(() => {
    if (!active || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(audioCtx.destination);
    nodesRef.current.push(masterGain);

    const BPM = 135;
    const beatDuration = 60 / BPM;
    const noteDuration = beatDuration / 4; // 16th notes
    let step = 0;
    let nextNoteTime = audioCtx.currentTime;

    // One-time buffer creation for noise (Snare/HiHat)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const playKick = (time: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.5);
    };

    const playSnare = (time: number) => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + 0.2);
    };

    const playHiHat = (time: number, open: boolean) => {
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      const gain = audioCtx.createGain();
      const vol = open ? 0.15 : 0.05;
      const dur = open ? 0.1 : 0.05;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(time);
      noise.stop(time + dur);
    };

    const playBass = (time: number, freq: number) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + 0.15);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.2);
    };

    const playLead = (time: number, freq: number) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      // Simple delay effect
      const delay = audioCtx.createDelay();
      delay.delayTime.value = 0.3;
      const delayGain = audioCtx.createGain();
      delayGain.gain.value = 0.4;

      osc.connect(gain);
      gain.connect(masterGain);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(masterGain);
      delayGain.connect(delay); // Feedback loop! careful

      osc.start(time);
      osc.stop(time + 0.4);
    };

    const scheduler = () => {
      while (nextNoteTime < audioCtx.currentTime + 0.1) {
        // KICK: 1, 5, 9, 13 (Quarter notes)
        if (step % 4 === 0) playKick(nextNoteTime);

        // SNARE: 5, 13 (2 and 4)
        if (step % 16 === 4 || step % 16 === 12) playSnare(nextNoteTime);

        // HIHAT: Every step (16th notes), accent offbeats
        playHiHat(nextNoteTime, step % 2 !== 0);

        // BASS: Driving 16th notes
        // Am (55) -> F (43.65) -> G (49)
        let bassNote = 55;
        if (step % 64 < 32) bassNote = 55; // A
        else if (step % 64 < 48) bassNote = 43.65; // F
        else bassNote = 49; // G

        // Offbeat bass accent
        if (step % 2 !== 0) playBass(nextNoteTime, bassNote);
        else playBass(nextNoteTime, bassNote * 0.99); // detune slightly

        // LEAD: Sparse melody
        if (step % 32 === 0) playLead(nextNoteTime, 440); // A4
        if (step % 32 === 6) playLead(nextNoteTime, 523.25); // C5
        if (step % 32 === 14) playLead(nextNoteTime, 659.25); // E5

        nextNoteTime += noteDuration;
        step++;
      }
    };

    intervalRef.current = setInterval(scheduler, 25);

    return () => {
      clearInterval(intervalRef.current);
      nodesRef.current.forEach(n => { try { n.disconnect() } catch { } });
    };
  }, [active]);

  return null;
};


// === MAIN GAME CANVAS ===
const GameCanvas: React.FC<GameCanvasProps> = (props) => {
  const [phase, setPhase] = useState(GamePhase.MENU);

  // Sync phase for music
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.phase !== phase) {
        setPhase(gameStateRef.current.phase);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  const initGame = () => {
    resetGame(1);
    startGame();
    props.onPhaseChange(GamePhase.RUNNING);
    props.onScoreChange(0);
    props.onBossInfo({ ...gameStateRef.current.boss });

    // Unlock pistol by default
    gameStateRef.current.player.weapons[0].unlocked = true;

    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  };

  const continueToNextLevel = () => {
    nextLevel();
    props.onPhaseChange(GamePhase.UPGRADE_SHOP);
  };

  useEffect(() => {
    // @ts-ignore
    window.startGame = initGame;
    // @ts-ignore
    window.continueToNextLevel = continueToNextLevel;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameStateRef.current.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') gameStateRef.current.input.right = true;
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') gameStateRef.current.input.shoot = true;

      // Weapon switching
      if (e.code === 'Digit1') gameStateRef.current.player.currentWeapon = 'PISTOL' as any;
      if (e.code === 'Digit2') gameStateRef.current.player.currentWeapon = 'LASER' as any;
      if (e.code === 'Digit3') gameStateRef.current.player.currentWeapon = 'SHOTGUN' as any;
      if (e.code === 'Digit4') gameStateRef.current.player.currentWeapon = 'CANNON' as any;

      // ULTIMATE ABILITY - Q key
      if (e.code === 'KeyQ' && (gameStateRef.current.player.rage || 0) >= 100) {
        const gs = gameStateRef.current;

        // Kill all enemies on screen!
        let killCount = 0;
        gs.enemies.forEach(enemy => {
          if (enemy.isActive) {
            gs.player.currency += enemy.points;
            gs.score += enemy.points;
            killCount++;
          }
        });
        gs.enemies = [];
        gs.player.rage = 0;
        gs.screenShake = 1.0; // Big shake!

        console.log(`[ULTIMATE] Killed ${killCount} enemies!`);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') gameStateRef.current.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') gameStateRef.current.input.right = false;
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') gameStateRef.current.input.shoot = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      // @ts-ignore
      delete window.startGame;
      // @ts-ignore
      delete window.continueToNextLevel;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls with shoot support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Bottom third of screen = movement
    if (touchY > height * 0.7) {
      if (touchX < width / 2) {
        gameStateRef.current.input.left = true;
      } else {
        gameStateRef.current.input.right = true;
      }
    } else {
      // Top part = shoot
      gameStateRef.current.input.shoot = true;
    }
  };

  const handleTouchEnd = () => {
    gameStateRef.current.input.left = false;
    gameStateRef.current.input.right = false;
    gameStateRef.current.input.shoot = false;
  };

  return (
    <div
      className="w-full h-full bg-[#170b29] outline-none cursor-crosshair"
      tabIndex={0}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        // Click to shoot
        if (gameStateRef.current.phase === GamePhase.RUNNING || gameStateRef.current.phase === GamePhase.BOSS_FIGHT) {
          gameStateRef.current.input.shoot = true;
          setTimeout(() => {
            gameStateRef.current.input.shoot = false;
          }, 100);
        }
      }}
    >
      <ActionMusic active={phase === GamePhase.RUNNING || phase === GamePhase.BOSS_FIGHT} />
      <Canvas shadows camera={{ position: [0, 6, 12], fov: 60 }}>
        <GameScene {...props} />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
