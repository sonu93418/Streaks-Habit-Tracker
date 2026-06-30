import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = [
  '#FFD400', // Yellow
  '#4ADE80', // Success Green
  '#60A5FA', // Accent Blue
  '#FF6B6B', // Warning Red
  '#A78BFA', // Purple
  '#FB923C', // Orange
];

type ParticleProps = {
  x: number;
  y: number;
  color: string;
  angle: number;
  velocity: number;
  size: number;
  delay: number;
  onFinished: () => void;
};

function ConfettiParticle({
  x,
  y,
  color,
  angle,
  velocity,
  size,
  delay,
  onFinished,
}: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1500 }, (isFinished) => {
        if (isFinished) {
          runOnJS(onFinished)();
        }
      })
    );
  }, [delay, onFinished, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Math logic for motion
    // Burst out horizontally and vertically, then gravity pulls it down.
    const rad = (angle * Math.PI) / 180;
    const distance = progress.value * velocity * 250;
    
    // Horizontal drift
    const tx = Math.cos(rad) * distance;
    // Vertical burst + gravity curve (quadratic fall)
    const ty = Math.sin(rad) * distance + (progress.value * progress.value * 400);

    const rotation = progress.value * 720; // Multiple spins
    const opacity = progress.value > 0.7 ? 1 - (progress.value - 0.7) / 0.3 : 1;
    const scale = progress.value < 0.2 ? progress.value / 0.2 : 1;

    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${rotation}deg` },
        { scale: scale },
      ],
      opacity: opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          left: x,
          top: y,
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 3, // slightly rounded square
        },
      ]}
    />
  );
}

type ConfettiProps = {
  active: boolean;
  x?: number;
  y?: number;
  onComplete?: () => void;
};

export function Confetti({ active, x = SCREEN_WIDTH / 2, y = SCREEN_HEIGHT / 2, onComplete }: ConfettiProps) {
  interface Particle {
    id: number;
    angle: number;
    velocity: number;
    color: string;
    size: number;
    delay: number;
  }
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const finishedCount = React.useRef(0);

  useEffect(() => {
    if (active) {
      finishedCount.current = 0;
      const count = 35;
      const newParticles = Array.from({ length: count }).map((_, index) => {
        // Explode in 360-degree directions, mostly pointing upwards (e.g. angle -45 to -135 or full circle)
        // -30 to -150 is upwards arc
        const angle = -30 - Math.random() * 120;
        const velocity = 0.5 + Math.random() * 0.8;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = 8 + Math.random() * 12;
        const delay = Math.random() * 150;

        return {
          id: index,
          angle,
          velocity,
          color,
          size,
          delay,
        };
      });
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  const handleParticleFinished = useCallback(() => {
    finishedCount.current += 1;
    if (finishedCount.current >= particles.length && onComplete) {
      onComplete();
    }
  }, [particles.length, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle
          key={p.id}
          x={x}
          y={y}
          color={p.color}
          angle={p.angle}
          velocity={p.velocity}
          size={p.size}
          delay={p.delay}
          onFinished={handleParticleFinished}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#000000',
  },
});
