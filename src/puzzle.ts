export type Difficulty = 1 | 2 | 3 | 4 | 5

export type Piece = {
  id: string
  correctIndex: number
  row: number
  col: number
}

export type PuzzleState = {
  n: number
  board: Array<Piece | null>
  fixed: boolean[]
  tray: Piece[]
}

export function gridSizeForDifficulty(difficulty: Difficulty): number {
  return difficulty + 2
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createPuzzle({
  n,
  rng = Math.random,
}: {
  n: number
  rng?: () => number
}): PuzzleState {
  const total = n * n
  const allIndices = Array.from({ length: total }, (_, i) => i)
  const missingCount = Math.max(3, Math.floor(total * 0.45))
  const missing = new Set(shuffle(allIndices, rng).slice(0, missingCount))

  const board: Array<Piece | null> = []
  const fixed: boolean[] = []
  const tray: Piece[] = []

  for (let idx = 0; idx < total; idx += 1) {
    const row = Math.floor(idx / n)
    const col = idx % n
    const piece: Piece = {
      id: `p_${n}_${idx}`,
      correctIndex: idx,
      row,
      col,
    }

    if (missing.has(idx)) {
      board.push(null)
      fixed.push(false)
      tray.push(piece)
    } else {
      board.push(piece)
      fixed.push(true)
    }
  }

  return {
    n,
    board,
    fixed,
    tray: shuffle(tray, rng),
  }
}

export function isComplete(puzzle: PuzzleState): boolean {
  return puzzle.board.every((cell, idx) => cell?.correctIndex === idx)
}
