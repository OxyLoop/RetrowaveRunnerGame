// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { gameStateRef } from '../state/gameState';
import { FloatingText } from '../types';

const FloatingTexts: React.FC = () => {
    const [texts, setTexts] = useState<FloatingText[]>([]);

    useFrame((state, delta) => {
        const gs = gameStateRef.current;

        // Update physics for texts
        if (gs.floatingTexts.length > 0) {
            gs.floatingTexts.forEach(t => {
                t.y += t.vy * delta;
                t.life -= delta;
            });

            // Remove dead texts
            gs.floatingTexts = gs.floatingTexts.filter(t => t.life > 0);

            // Update react state to render
            setTexts([...gs.floatingTexts]);
        } else if (texts.length > 0) {
            setTexts([]);
        }
    });

    return (
        <group>
            {texts.map(t => (
                <Text
                    key={t.id}
                    position={[t.x, t.y, t.z]}
                    fontSize={1}
                    color={t.color}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="black"
                    fillOpacity={t.life / t.maxLife} // Fade out
                    outlineOpacity={t.life / t.maxLife}
                >
                    {t.text}
                </Text>
            ))}
        </group>
    );
};

export default FloatingTexts;
