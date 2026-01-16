export type Difficulty = 1 | 2 | 3 | 4 | 5

export type EdgeType = 'flat' | 'tab' | 'blank'

export type Piece = {
  id: string
  correctIndex: number
  row: number
  col: number
  edges: {
    top: EdgeType
    right: EdgeType
    bottom: EdgeType
    left: EdgeType
  }
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

  const invertEdge = (edge: EdgeType): EdgeType => {
    if (edge === 'tab') return 'blank'
    if (edge === 'blank') return 'tab'
    return 'flat'
  }

  const randomEdge = (): EdgeType => (rng() < 0.5 ? 'tab' : 'blank')

  const rightEdges: EdgeType[] = Array.from({ length: total }, () => 'flat')
  const bottomEdges: EdgeType[] = Array.from({ length: total }, () => 'flat')

  for (let idx = 0; idx < total; idx += 1) {
    const row = Math.floor(idx / n)
    const col = idx % n

    const top = row === 0 ? 'flat' : invertEdge(bottomEdges[(row - 1) * n + col])
    const left = col === 0 ? 'flat' : invertEdge(rightEdges[row * n + (col - 1)])
    const right = col === n - 1 ? 'flat' : randomEdge()
    const bottom = row === n - 1 ? 'flat' : randomEdge()

    rightEdges[idx] = right
    bottomEdges[idx] = bottom

    const piece: Piece = {
      id: `p_${n}_${idx}`,
      correctIndex: idx,
      row,
      col,
      edges: { top, right, bottom, left },
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
