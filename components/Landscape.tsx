// @ts-nocheck
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameStateRef } from '../state/gameState';
import { getLevelConfig } from '../types/levels';

interface LandscapeProps {
  speed: number;
}

const Landscape: React.FC<LandscapeProps> = ({ speed }) => {
  const gridCount = 12;
  const gridLength = 100;
  const groupRef = useRef<THREE.Group>(null);

  // Get current level theme
  const gs = gameStateRef.current;
  const level = getLevelConfig(gs.currentLevel);

  // Define theme colors based on level
  const themeColors = useMemo(() => {
    const themes = {
      city: { ground: '#0a001a', wire: '#ff00ff', glow: '#00ffff' },
      ocean: { ground: '#001a2a', wire: '#00aaff', glow: '#00ffcc' },
      nebula: { ground: '#1a0020', wire: '#ff0099', glow: '#9900ff' },
      abyss: { ground: '#100000', wire: '#ff3300', glow: '#ff0000' },
    };
    return themes[level.theme] || themes.city;
  }, [level.theme]);

  // Generate terrain geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(520, gridLength, 180, 44);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const distFromCenter = Math.abs(x);
      const roadHalfWidth = 14;

      if (distFromCenter > roadHalfWidth) {
        const noise = (Math.sin(x * 0.2) * Math.cos(y * 0.2) * 2) +
          (Math.sin(x * 0.5) * 1) +
          (Math.random() * 0.2);

        // Higher mountains for later levels
        const heightMultiplier = 0.3 + gs.currentLevel * 0.1;
        const elevation = Math.pow(distFromCenter - roadHalfWidth, 1.2) * heightMultiplier * noise;
        pos.setZ(i, Math.max(0, elevation));
      } else {
        pos.setZ(i, 0);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [gs.currentLevel]);

  return (
    <group ref={groupRef}>
      {Array.from({ length: gridCount }).map((_, i) => (
        <group key={i} position={[0, 0, -i * gridLength]}>
          {/* Main Solid Terrain */}
          <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
              color={themeColors.ground}
              roughness={0.8}
              metalness={0.2}
              flatShading
            />
          </mesh>

          {/* Neon Wireframe Overlay */}
          <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <meshBasicMaterial
              color={themeColors.wire}
              wireframe
              transparent
              opacity={0.5}
              toneMapped={false}
            />
          </mesh>

          {/* Road band mask */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[15, gridLength]} />
            <meshBasicMaterial color={themeColors.ground} toneMapped={false} />
          </mesh>

          {/* Level-specific decorations */}
          <LevelDecorations theme={level.theme} sectionIndex={i} glowColor={themeColors.glow} />
        </group>
      ))}
    </group>
  );
};

// Unique decorations for each level theme
const LevelDecorations: React.FC<{ theme: string; sectionIndex: number; glowColor: string }> = ({ theme, sectionIndex, glowColor }) => {
  const decorations: JSX.Element[] = [];
  const baseZ = -sectionIndex * 100;

  if (theme === 'city') {
    // Neon billboards and city buildings
    for (let j = 0; j < 4; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      const z = baseZ - j * 25;
      decorations.push(
        <group key={`building-${sectionIndex}-${j}`} position={[side * 25, 0, z]}>
          <mesh position={[0, 8, 0]}>
            <boxGeometry args={[4, 16, 4]} />
            <meshStandardMaterial color="#111122" emissive="#ff00ff" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 17, 0]}>
            <boxGeometry args={[4.5, 2, 4.5]} />
            <meshBasicMaterial color="#ff00ff" toneMapped={false} />
          </mesh>
        </group>
      );
    }
  } else if (theme === 'ocean') {
    // Floating crystals
    for (let j = 0; j < 3; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      const z = baseZ - j * 33;
      decorations.push(
        <group key={`crystal-${sectionIndex}-${j}`} position={[side * 20, 3 + j, z]}>
          <mesh rotation={[0, Math.PI / 4, Math.PI / 6]}>
            <octahedronGeometry args={[2 + j * 0.5]} />
            <meshStandardMaterial
              color="#004466"
              emissive="#00aaff"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      );
    }
  } else if (theme === 'nebula') {
    // Floating orbs
    for (let j = 0; j < 5; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      const z = baseZ - j * 20;
      decorations.push(
        <group key={`orb-${sectionIndex}-${j}`} position={[side * (15 + j * 3), 4 + Math.sin(j) * 2, z]}>
          <mesh>
            <sphereGeometry args={[1 + j * 0.3, 12, 12]} />
            <meshBasicMaterial color="#ff0099" transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.5 + j * 0.3, 8, 8]} />
            <meshBasicMaterial color="#9900ff" wireframe transparent opacity={0.3} toneMapped={false} />
          </mesh>
        </group>
      );
    }
  } else if (theme === 'abyss') {
    // Fire pillars and lava cracks
    for (let j = 0; j < 4; j++) {
      const side = j % 2 === 0 ? -1 : 1;
      const z = baseZ - j * 25;
      decorations.push(
        <group key={`fire-${sectionIndex}-${j}`} position={[side * 18, 0, z]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[0.5, 1.5, 8, 6]} />
            <meshStandardMaterial color="#220000" emissive="#ff3300" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0, 9, 0]}>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshBasicMaterial color="#ff6600" transparent opacity={0.7} toneMapped={false} />
          </mesh>
        </group>
      );
    }
  }

  return <>{decorations}</>;
};

export default Landscape;
