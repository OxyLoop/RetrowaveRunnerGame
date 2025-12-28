import React, { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import GameCanvas from "./GameCanvas";
import { GamePhase } from "../../types";

interface GameCanvasProps {
    onScoreChange: (score: number) => void;
    onPhaseChange: (phase: GamePhase) => void;
    onBossInfo: (boss: any) => void;
}

const Game3DWrapper: React.FC<GameCanvasProps> = (props) => {
    const startGame = () => {
        props.onPhaseChange(GamePhase.RUNNING);
        props.onScoreChange(1);
    };

    useEffect(() => {
        // @ts-ignore
        window.startGame = startGame;
        return () => {
            // @ts-ignore
            delete window.startGame;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="w-screen h-screen bg-[#170b29] outline-none cursor-crosshair overflow-hidden"
            tabIndex={0}
            onTouchStart={(e) => {
                const touchX = e.touches[0].clientX;
                if (touchX < window.innerWidth / 2) {
                    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft" }));
                } else {
                    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight" }));
                }
            }}
            onTouchEnd={() => {
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));
            }}
        >
            <Canvas
                shadows
                style={{ width: "100%", height: "100%" }}
                camera={{
                    fov: 70,
                    position: [0, 7.5, 18],
                    near: 0.1,
                    far: 2000,
                }}
            >
                <GameCanvas {...props} />
            </Canvas>
        </div>
    );
};

export default Game3DWrapper;
