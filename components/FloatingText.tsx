// @ts-nocheck
import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { gameStateRef } from '../state/gameState';
import { FloatingText as FloatingTextType } from '../types';

let textIdCounter = 0;

export const addFloatingText = (text: string, x: number, y: number, z: number, color: string = '#ffffff') => {
    const ft: FloatingTextType = {
        id: ++textIdCounter,
        text,
        x,
        y,
        z,
        color,
        life: 3.0,      // 3 seconds - longer!
        maxLife: 3.0,
        vy: 2.0
    };

    if (!gameStateRef.current.floatingTexts) {
        gameStateRef.current.floatingTexts = [];
    }

    gameStateRef.current.floatingTexts.push(ft);
};

const FloatingTextRenderer: React.FC = () => {
    const [texts, setTexts] = useState<FloatingTextType[]>([]);

    useFrame((state, delta) => {
        if (!gameStateRef.current.floatingTexts) return;

        gameStateRef.current.floatingTexts.forEach(ft => {
            ft.life -= delta * 0.4; // Slower fade
            ft.y += ft.vy * delta;
            // Scale up as it rises
        });

        gameStateRef.current.floatingTexts = gameStateRef.current.floatingTexts.filter(ft => ft.life > 0);
        setTexts([...gameStateRef.current.floatingTexts]);
    });

    return (
        <group>
            {texts.map(ft => {
                const scale = 1 + (1 - ft.life / ft.maxLife) * 0.5; // Gets bigger
                return (
                    <Billboard key={ft.id} position={[ft.x, ft.y, ft.z]} follow={true}>
                        <Text
                            fontSize={2.5 * scale}
                            color={ft.color}
                            fillOpacity={Math.min(1, ft.life * 1.5)}
                            outlineWidth={0.15}
                            outlineColor="#000000"
                            outlineOpacity={Math.min(1, ft.life * 1.5)}
                            anchorX="center"
                            anchorY="middle"
                        >
                            {ft.text}
                        </Text>
                    </Billboard>
                );
            })}
        </group>
    );
};

export default FloatingTextRenderer;
