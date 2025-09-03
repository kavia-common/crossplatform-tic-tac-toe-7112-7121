import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

/**
 * Color palette per spec
 */
const COLORS = {
  primary: '#1976D2',
  accent: '#FFC107',
  secondary: '#424242',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1F1F1F',
  subtle: '#9E9E9E',
  grid: '#E0E0E0',
};

/**
 * Game types
 */
type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];

/**
 * Helpers
 */
const emptyBoard = (): Board => Array(9).fill(null);

/**
 * PUBLIC_INTERFACE
 * Root App component for Tic Tac Toe.
 * Provides a 3x3 grid, Player vs Player gameplay, animations, score tracking, reset/new game, and turn indicator.
 */
export default function App() {
  // Game state
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);
  const [scores, setScores] = useState<{ X: number; O: number }>({ X: 0, O: 0 });
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // Animations
  const boardOpacity = useRef(new Animated.Value(0)).current;
  const turnPulse = useRef(new Animated.Value(1)).current;
  const symbolScales = useRef(Array.from({ length: 9 }, () => new Animated.Value(0))).current;
  const symbolRotations = useRef(Array.from({ length: 9 }, () => new Animated.Value(0))).current;

  // Responsive sizing for grid
  const gridSize = useMemo(() => {
    const { width } = Dimensions.get('window');
    const size = Math.min(width - 32, 360); // padding for sides
    return size;
  }, []);

  // Fade in board on mount
  useEffect(() => {
    Animated.timing(boardOpacity, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [boardOpacity]);

  // Subtle pulse for current turn
  useEffect(() => {
    turnPulse.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(turnPulse, {
          toValue: 1.05,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(turnPulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [currentPlayer, turnPulse]);

  // Compute winner/draw
  const calculateWinner = useCallback((b: Board): { winner: Player | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diags
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return { winner: b[a], line: [a, c, d] };
      }
    }
    return { winner: null, line: null };
  }, []);

  const isBoardFull = (b: Board) => b.every((c) => c !== null);

  // Handle press on a cell
  const handleCellPress = useCallback(
    (index: number) => {
      if (winner || board[index]) return;
      const next = [...board];
      next[index] = currentPlayer;
      setBoard(next);

      // Animate symbol scale and rotation
      Animated.parallel([
        Animated.spring(symbolScales[index], {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(symbolRotations[index], {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Winner/draw detection
      const { winner: w, line } = calculateWinner(next);
      if (w) {
        setWinner(w);
        setWinningLine(line);
        setScores((prev) => ({ ...prev, [w]: prev[w] + 1 }));
      } else if (isBoardFull(next)) {
        setWinner('Draw');
        setWinningLine(null);
      } else {
        setCurrentPlayer((p) => (p === 'X' ? 'O' : 'X'));
      }
    },
    [board, currentPlayer, winner, calculateWinner, symbolRotations, symbolScales]
  );

  // Reset board, keep scores
  const onReset = useCallback(() => {
    setBoard(emptyBoard());
    setWinner(null);
    setWinningLine(null);
    setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
    // reset animation states for cells
    symbolScales.forEach((v) => v.setValue(0));
    symbolRotations.forEach((v) => v.setValue(0));
  }, [symbolScales, symbolRotations]);

  // New game resets scores too
  const onNewGame = useCallback(() => {
    setScores({ X: 0, O: 0 });
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine(null);
    setBoard(emptyBoard());
    symbolScales.forEach((v) => v.setValue(0));
    symbolRotations.forEach((v) => v.setValue(0));
  }, [symbolRotations, symbolScales]);

  // Render a symbol with animation
  const renderSymbol = (value: Cell, idx: number) => {
    const rotate = symbolRotations[idx].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', value === 'X' ? '180deg' : '360deg'],
    });

    const isWinningCell = winningLine?.includes(idx);

    return (
      <Animated.View
        style={[
          styles.symbolContainer,
          {
            transform: [{ scale: symbolScales[idx] }, { rotate }],
          },
        ]}
      >
        {value ? (
          <Text
            style={[
              styles.symbol,
              value === 'X' ? styles.symbolX : styles.symbolO,
              isWinningCell ? styles.symbolWin : undefined,
            ]}
          >
            {value}
          </Text>
        ) : null}
      </Animated.View>
    );
  };

  // Turn/status text
  const statusText = useMemo(() => {
    if (winner === 'Draw') return 'It’s a draw!';
    if (winner === 'X' || winner === 'O') return `Player ${winner} wins!`;
    return `Player ${currentPlayer}'s turn`;
  }, [winner, currentPlayer]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tic Tac Toe</Text>
          <View style={styles.scoreBoard}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Player X</Text>
              <Text style={[styles.scoreValue, { color: COLORS.primary }]}>{scores.X}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Player O</Text>
              <Text style={[styles.scoreValue, { color: COLORS.accent }]}>{scores.O}</Text>
            </View>
          </View>
        </View>

        {/* Board */}
        <Animated.View style={[styles.boardWrapper, { opacity: boardOpacity }]}>
          <View style={[styles.board, { width: gridSize, height: gridSize }]}>
            {board.map((cell, idx) => {
              const isDisabled = Boolean(winner || cell);
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleCellPress(idx)}
                  disabled={isDisabled}
                  android_ripple={{ color: '#e0e0e0' }}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      backgroundColor: pressed ? '#F5F5F5' : COLORS.surface,
                      borderColor: COLORS.grid,
                    },
                    winningLine?.includes(idx) ? styles.winningCell : null,
                  ]}
                >
                  {renderSymbol(cell, idx)}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Turn & Actions */}
        <View style={styles.footer}>
          <Animated.View
            style={[
              styles.turnPill,
              {
                transform: [{ scale: turnPulse }],
                backgroundColor:
                  winner === 'Draw'
                    ? '#EEEEEE'
                    : winner
                    ? (winner === 'X' ? COLORS.primary : COLORS.accent) + '22'
                    : (currentPlayer === 'X' ? COLORS.primary : COLORS.accent) + '22',
                borderColor:
                  winner === 'Draw'
                    ? '#E0E0E0'
                    : winner
                    ? winner === 'X'
                      ? COLORS.primary
                      : COLORS.accent
                    : currentPlayer === 'X'
                    ? COLORS.primary
                    : COLORS.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.turnText,
                {
                  color:
                    winner === 'Draw'
                      ? COLORS.secondary
                      : winner
                      ? winner === 'X'
                        ? COLORS.primary
                        : COLORS.accent
                      : currentPlayer === 'X'
                      ? COLORS.primary
                      : COLORS.accent,
                },
              ]}
            >
              {statusText}
            </Text>
          </Animated.View>

          <View style={styles.actions}>
            <Pressable onPress={onReset} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={[styles.buttonText, { color: COLORS.secondary }]}>Reset</Text>
            </Pressable>
            <Pressable onPress={onNewGame} style={({ pressed }) => [styles.buttonPrimary, pressed && styles.buttonPrimaryPressed]}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>New Game</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const CELL_GAP = 8;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  scoreCard: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.subtle,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  divider: {
    height: 24,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    flexGrow: 1,
  },
  board: {
    aspectRatio: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E6E6',
    padding: CELL_GAP,
  },
  cell: {
    width: '33.3333%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    margin: CELL_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winningCell: {
    backgroundColor: '#E3F2FD',
    borderColor: COLORS.primary,
  },
  symbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 48,
    fontWeight: '900',
  },
  symbolX: {
    color: COLORS.primary,
  },
  symbolO: {
    color: COLORS.accent,
  },
  symbolWin: {
    textShadowColor: '#90CAF9',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  turnPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  turnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  buttonPressed: {
    backgroundColor: '#EAECEF',
  },
  buttonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  buttonPrimaryPressed: {
    opacity: 0.9,
  },
});
