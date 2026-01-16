import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { DEFAULT_IMAGES, type ImageOption } from './defaultImages'
import { createPuzzle, gridSizeForDifficulty, isComplete, type Difficulty, type EdgeType, type Piece, type PuzzleState } from './puzzle'

type FireworkParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  ttl: number
  size: number
  color: string
  prevX: number
  prevY: number
}

type PieceShape = 'square' | 'interlock'

function pieceShapeLabel(shape: PieceShape) {
  return shape === 'square' ? '方形' : '互锁'
}

function jigsawPath(edges: { top: EdgeType; right: EdgeType; bottom: EdgeType; left: EdgeType }) {
  const size = 100
  const inset1 = 28
  const inset2 = 36
  const inset3 = 64
  const inset4 = 72
  const depth = 18
  const shoulder = 6
  const handle = 2

  type Side = 'top' | 'right' | 'bottom' | 'left'
  type Cmd =
    | { type: 'L'; x: number; y: number }
    | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }

  const mapPoint = (side: Side, u: number, v: number) => {
    if (side === 'top') return { x: u, y: -v }
    if (side === 'right') return { x: size + v, y: u }
    if (side === 'bottom') return { x: size - u, y: size + v }
    return { x: -v, y: size - u }
  }

  const edgeCmds = (edge: EdgeType): Cmd[] => {
    if (edge === 'flat') return [{ type: 'L', x: size, y: 0 }]
    const sign = edge === 'tab' ? 1 : -1
    const vShoulder = sign * shoulder
    const vDepth = sign * depth
    return [
      { type: 'L', x: inset1, y: 0 },
      { type: 'C', x1: inset1 + handle, y1: 0, x2: inset1 + handle, y2: vShoulder, x: inset2, y: vShoulder },
      { type: 'C', x1: inset2 + handle, y1: vShoulder, x2: inset2 + handle, y2: vDepth, x: 50, y: vDepth },
      { type: 'C', x1: inset3 - handle, y1: vDepth, x2: inset3 - handle, y2: vShoulder, x: inset3, y: vShoulder },
      { type: 'C', x1: inset4 - handle, y1: vShoulder, x2: inset4 - handle, y2: 0, x: inset4, y: 0 },
      { type: 'L', x: size, y: 0 },
    ]
  }

  const pushEdge = (p: string[], side: Side, edge: EdgeType) => {
    for (const cmd of edgeCmds(edge)) {
      if (cmd.type === 'L') {
        const pt = mapPoint(side, cmd.x, cmd.y)
        p.push(`L ${pt.x} ${pt.y}`)
      } else {
        const c1 = mapPoint(side, cmd.x1, cmd.y1)
        const c2 = mapPoint(side, cmd.x2, cmd.y2)
        const pt = mapPoint(side, cmd.x, cmd.y)
        p.push(`C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${pt.x} ${pt.y}`)
      }
    }
  }

  const p: string[] = [`M 0 0`]
  pushEdge(p, 'top', edges.top)
  pushEdge(p, 'right', edges.right)
  pushEdge(p, 'bottom', edges.bottom)
  pushEdge(p, 'left', edges.left)
  p.push('Z')
  return p.join(' ')
}

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const raw = localStorage.getItem('jigsaw:difficulty')
    const n = raw ? Number(raw) : 1
    if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n
    return 1
  })
  const [selected, setSelected] = useState<ImageOption>(() => {
    const raw = localStorage.getItem('jigsaw:imageSrc')
    const fromList = DEFAULT_IMAGES.find((x) => x.src === raw)
    return fromList ?? DEFAULT_IMAGES[0]
  })
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null)

  const [isImageReady, setIsImageReady] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null)
  const [moves, setMoves] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const [pieceShape, setPieceShape] = useState<PieceShape>(() => {
    const raw = localStorage.getItem('jigsaw:pieceShape')
    if (raw === 'interlock' || raw === 'square') return raw
    return 'square'
  })

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const raw = localStorage.getItem('jigsaw:sound')
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  })

  const [celebrating, setCelebrating] = useState(false)
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fxRafRef = useRef<number | null>(null)
  const fxStopTimerRef = useRef<number | null>(null)
  const fxParticlesRef = useRef<FireworkParticle[]>([])
  const fxLastTsRef = useRef<number>(0)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioNoiseRef = useRef<AudioBuffer | null>(null)

  const [hintSlot, setHintSlot] = useState<number | null>(null)
  const [hintPieceId, setHintPieceId] = useState<string | null>(null)
  const hintTimerRef = useRef<number | null>(null)

  const [drag, setDrag] = useState<{
    piece: Piece
    from: { type: 'tray' } | { type: 'board'; index: number }
    pointerId: number
    offsetX: number
    offsetY: number
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const n = useMemo(() => gridSizeForDifficulty(difficulty), [difficulty])
  const imageSrc = customImageUrl ?? selected.src

  const completed = useMemo(() => (puzzle ? isComplete(puzzle) : false), [puzzle])
  const remaining = puzzle?.tray.length ?? 0
  const elapsedSeconds = startedAt ? Math.floor((now - startedAt) / 1000) : 0

  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1500)
  }, [])

  const ensureAudio = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextCtor =
          window.AudioContext ?? ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null)
        if (!AudioContextCtor) return
        audioCtxRef.current = new AudioContextCtor()
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()
      if (!audioNoiseRef.current) {
        const sampleRate = audioCtxRef.current.sampleRate
        const durationSeconds = 0.18
        const frameCount = Math.floor(sampleRate * durationSeconds)
        const buffer = audioCtxRef.current.createBuffer(1, frameCount, sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < frameCount; i++) data[i] = (Math.random() * 2 - 1) * 0.9
        audioNoiseRef.current = buffer
      }
    } catch {
      // ignore (autoplay policy or unsupported)
    }
  }, [])

  const stopFireworks = useCallback(() => {
    if (fxRafRef.current) window.cancelAnimationFrame(fxRafRef.current)
    fxRafRef.current = null
    if (fxStopTimerRef.current) window.clearTimeout(fxStopTimerRef.current)
    fxStopTimerRef.current = null
    fxParticlesRef.current = []
    const canvas = fxCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const resizeFxCanvas = useCallback(() => {
    const canvas = fxCanvasRef.current
    if (!canvas) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.floor(window.innerWidth * dpr)
    const h = Math.floor(window.innerHeight * dpr)
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
  }, [])

  const startFireworks = useCallback(() => {
    stopFireworks()
    resizeFxCanvas()
    const canvas = fxCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const reduced = prefersReducedMotion()
    const bursts = reduced ? 3 : 6
    const perBurst = reduced ? 18 : 36
    const gravity = 980 * dpr

    const palette = ['#ff4d9d', '#a855f7', '#ff87c7', '#ff5c7a', '#ffd1e6', '#7c3aed']

    const particles: FireworkParticle[] = []
    for (let b = 0; b < bursts; b++) {
      const cx = (0.18 + Math.random() * 0.64) * canvas.width
      const cy = (0.16 + Math.random() * 0.38) * canvas.height
      const baseSpeed = (reduced ? 520 : 760) * dpr
      for (let i = 0; i < perBurst; i++) {
        const a = Math.random() * Math.PI * 2
        const speed = baseSpeed * (0.22 + Math.random() * 0.78)
        const vx = Math.cos(a) * speed
        const vy = Math.sin(a) * speed - (240 + Math.random() * 520) * dpr
        const ttl = (reduced ? 0.95 : 1.35) + Math.random() * 0.55
        particles.push({
          x: cx,
          y: cy,
          vx,
          vy,
          life: ttl,
          ttl,
          size: (1.6 + Math.random() * 2.6) * dpr,
          color: palette[(Math.random() * palette.length) | 0],
          prevX: cx,
          prevY: cy,
        })
      }
    }

    fxParticlesRef.current = particles
    fxLastTsRef.current = performance.now()

    const tick = (ts: number) => {
      const last = fxLastTsRef.current || ts
      const dt = Math.min(0.033, (ts - last) / 1000)
      fxLastTsRef.current = ts

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      const next: FireworkParticle[] = []
      for (const p of fxParticlesRef.current) {
        const life = p.life - dt
        if (life <= 0) continue

        const drag = Math.pow(0.12, dt)
        const vx = p.vx * drag
        const vy = p.vy * drag + gravity * dt
        const x = p.x + vx * dt
        const y = p.y + vy * dt

        const t = Math.max(0, life / p.ttl)
        const alpha = Math.min(1, t * 1.15)

        ctx.strokeStyle = p.color
        ctx.globalAlpha = Math.max(0, alpha * 0.55)
        ctx.lineWidth = p.size * 0.9
        ctx.beginPath()
        ctx.moveTo(p.prevX, p.prevY)
        ctx.lineTo(x, y)
        ctx.stroke()

        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()

        next.push({ ...p, x, y, vx, vy, life, prevX: x, prevY: y })
      }

      fxParticlesRef.current = next
      if (next.length > 0) fxRafRef.current = window.requestAnimationFrame(tick)
    }

    fxRafRef.current = window.requestAnimationFrame(tick)
    fxStopTimerRef.current = window.setTimeout(() => stopFireworks(), reduced ? 1400 : 2200)
  }, [prefersReducedMotion, resizeFxCanvas, stopFireworks])

  const playCelebrationSound = useCallback(() => {
    if (!soundEnabled) return
    const ctx = audioCtxRef.current
    if (!ctx || ctx.state !== 'running') return
    const noise = audioNoiseRef.current
    if (!noise) return

    const now = ctx.currentTime + 0.02
    const master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)

    const pop = (t: number, pitch: number) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(pitch, t)
      osc.frequency.exponentialRampToValueAtTime(Math.max(60, pitch * 0.22), t + 0.18)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      osc.connect(g)
      g.connect(master)
      osc.start(t)
      osc.stop(t + 0.24)
    }

    const sparkle = (t: number) => {
      const src = ctx.createBufferSource()
      src.buffer = noise
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1800
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
      src.connect(hp)
      hp.connect(g)
      g.connect(master)
      src.start(t)
      src.stop(t + 0.16)
    }

    pop(now, 210)
    sparkle(now + 0.02)
    pop(now + 0.22, 170)
    sparkle(now + 0.26)
    pop(now + 0.44, 240)
    sparkle(now + 0.47)

    master.gain.setValueAtTime(0.55, now)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.0)
  }, [soundEnabled])

  function clearHintSoon() {
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    hintTimerRef.current = window.setTimeout(() => {
      setHintSlot(null)
      setHintPieceId(null)
    }, 1500)
  }

  function startNewPuzzle() {
    const next = createPuzzle({ n })
    setPuzzle(next)
    setMoves(0)
    setStartedAt(Date.now())
    setHintSlot(null)
    setHintPieceId(null)
    setCelebrating(false)
    stopFireworks()
  }

  useEffect(() => {
    localStorage.setItem('jigsaw:difficulty', String(difficulty))
  }, [difficulty])

  useEffect(() => {
    localStorage.setItem('jigsaw:pieceShape', pieceShape)
  }, [pieceShape])

  useEffect(() => {
    localStorage.setItem('jigsaw:sound', soundEnabled ? '1' : '0')
  }, [soundEnabled])

  useEffect(() => {
    if (!customImageUrl) localStorage.setItem('jigsaw:imageSrc', selected.src)
  }, [selected.src, customImageUrl])

  useEffect(() => {
    setIsImageReady(false)
    setImageError(null)
    const img = new Image()
    img.onload = () => setIsImageReady(true)
    img.onerror = () => setImageError('图片加载失败（可能是网络或跨域限制）')
    img.src = imageSrc
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageSrc])

  useEffect(() => {
    if (!isImageReady) return
    startNewPuzzle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImageReady, n])

  useEffect(() => {
    if (!puzzle || completed || !startedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [puzzle, completed, startedAt])

  useEffect(() => {
    const onResize = () => resizeFxCanvas()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [resizeFxCanvas])

  useEffect(() => {
    if (!drag) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      setDrag((prev) => {
        if (!prev) return prev
        return { ...prev, x: e.clientX, y: e.clientY }
      })
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      setDrag(null)
      if (!puzzle) return
      const from = drag.from
      const piece = drag.piece

      const el = document.elementFromPoint(e.clientX, e.clientY)
      const trayEl = el?.closest?.('[data-dropzone="tray"]') as HTMLElement | null
      if (trayEl) {
        if (from.type === 'board') {
          setPuzzle((prev) => {
            if (!prev) return prev
            if (prev.fixed[from.index]) return prev
            const nextBoard = [...prev.board]
            const nextTray = [...prev.tray]
            nextBoard[from.index] = null
            nextTray.push(piece)
            return { ...prev, board: nextBoard, tray: nextTray }
          })
          setMoves((m) => m + 1)
          showToast('已放回备选区')
        }
        return
      }
      const slotEl = el?.closest?.('[data-slot-index]') as HTMLElement | null
      const raw = slotEl?.dataset?.slotIndex
      const slotIndex = raw ? Number(raw) : NaN
      if (!Number.isFinite(slotIndex)) return

      if (piece.correctIndex !== slotIndex) showToast('先放这里也行，之后再调整～')
      setPuzzle((prev) => {
        if (!prev) return prev
        if (prev.fixed[slotIndex]) return prev

        const nextBoard = [...prev.board]
        const nextTray = [...prev.tray]

        const removeFromSource = () => {
          if (from.type === 'tray') {
            const idx = nextTray.findIndex((p) => p.id === piece.id)
            if (idx >= 0) nextTray.splice(idx, 1)
            return
          }
          if (from.type === 'board') {
            if (from.index === slotIndex) return
            nextBoard[from.index] = null
          }
        }

        const targetPiece = nextBoard[slotIndex]
        if (targetPiece && prev.fixed[slotIndex]) return prev

        removeFromSource()

        if (targetPiece) {
          if (from.type === 'board') {
            nextBoard[from.index] = targetPiece
          } else {
            nextTray.push(targetPiece)
          }
        }

        nextBoard[slotIndex] = piece
        return { ...prev, board: nextBoard, tray: nextTray }
      })
      setMoves((m) => m + 1)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointercancel', onUp, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, puzzle, showToast])

  useEffect(() => {
    if (!completed) return
    setToast('完成啦！')
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1500)
    setCelebrating(true)
    startFireworks()
    playCelebrationSound()
  }, [completed, playCelebrationSound, startFireworks])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
      stopFireworks()
      try {
        audioCtxRef.current?.close?.()
      } catch {
        // ignore
      }
    }
  }, [stopFireworks])

  function onPickLocalFile(file: File | null) {
    if (!file) return
    const nextUrl = URL.createObjectURL(file)
    setCustomImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return nextUrl
    })
  }

  function onChooseDefault(image: ImageOption) {
    setCustomImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setSelected(image)
  }

  function hint() {
    if (!puzzle) return
    const slotIndex = puzzle.board.findIndex((cell, idx) => cell?.correctIndex !== idx)
    if (slotIndex < 0) return
    const piece =
      puzzle.tray.find((p) => p.correctIndex === slotIndex) ??
      puzzle.board.find((p) => p?.correctIndex === slotIndex) ??
      null
    setHintSlot(slotIndex)
    setHintPieceId(piece?.id ?? null)
    showToast('把高亮拼图块放到高亮格子')
    clearHintSoon()
  }

  const pieceStyle = (piece: Piece) => {
    const denom = Math.max(1, n - 1)
    const x = (piece.col / denom) * 100
    const y = (piece.row / denom) * 100
    return {
      backgroundImage: `url("${imageSrc}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${n * 100}% ${n * 100}%`,
      backgroundPosition: `${x}% ${y}%`,
    } as const
  }

  const boardCells = puzzle?.board ?? Array.from({ length: n * n }, () => null)

  const renderPieceFace = (piece: Piece) => {
    if (pieceShape === 'square') return null
    const clipId = `clip_${piece.id}`
    const path = jigsawPath(piece.edges)
    return (
      <svg className="pieceSvg" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={path} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={imageSrc}
            x={-piece.col * 100}
            y={-piece.row * 100}
            width={n * 100}
            height={n * 100}
            preserveAspectRatio="none"
          />
        </g>
        <path d={path} fill="none" stroke="rgba(255, 77, 157, 0.55)" strokeWidth={1.2} />
      </svg>
    )
  }

  return (
    <div
      className="app"
      data-piece-shape={pieceShape}
      onPointerDown={() => {
        void ensureAudio()
      }}
    >
      <header className="topbar">
        <div className="brand">
          <div className="title">智能拼图</div>
          <div className="meta">
            难度 {difficulty} · {n}×{n} · 剩余 {remaining} · 步数 {moves} · 用时 {elapsedSeconds}s
          </div>
        </div>
        <div className="actions">
          <button type="button" onClick={startNewPuzzle} disabled={!isImageReady}>
            重开
          </button>
          <button type="button" onClick={hint} disabled={!puzzle || completed}>
            求助
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)} disabled={!isImageReady}>
            原图
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="boardPanel" aria-label="拼图区域">
          <div className="boardWrap">
            <div
              className="board"
              style={{
                gridTemplateColumns: `repeat(${n}, 1fr)`,
                gridTemplateRows: `repeat(${n}, 1fr)`,
              }}
            >
              {boardCells.map((cell, idx) => {
                const hinting = hintSlot === idx
                return (
                  <div
                    key={`slot_${idx}`}
                    data-slot-index={idx}
                    className={`slot ${cell ? 'filled' : 'empty'} ${hinting ? 'hint' : ''} ${
                      cell && !puzzle?.fixed[idx] && cell.correctIndex !== idx ? 'wrong' : ''
                    }`}
                    aria-label={cell ? `已完成：${idx + 1}` : `空位：${idx + 1}`}
                  >
                    {cell ? (
                      <div
                        className={`piece ${puzzle?.fixed[idx] ? 'fixed' : 'movable'} ${
                          hintPieceId === cell.id ? 'hint' : ''
                        }`}
                        style={pieceShape === 'square' ? pieceStyle(cell) : undefined}
                        role={!puzzle?.fixed[idx] ? 'button' : undefined}
                        tabIndex={!puzzle?.fixed[idx] ? 0 : undefined}
                        aria-label={!puzzle?.fixed[idx] ? '可移动拼图块' : '固定拼图块'}
                        onPointerDown={(e) => {
                          if (completed) return
                          if (!puzzle) return
                          if (puzzle.fixed[idx]) return
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const offsetX = e.clientX - rect.left
                          const offsetY = e.clientY - rect.top
                          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                          setDrag({
                            piece: cell,
                            from: { type: 'board', index: idx },
                            pointerId: e.pointerId,
                            offsetX,
                            offsetY,
                            x: e.clientX,
                            y: e.clientY,
                            width: rect.width,
                            height: rect.height,
                          })
                        }}
                      >
                        {renderPieceFace(cell)}
                      </div>
                    ) : (
                      <div className="emptyMark" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          {!isImageReady && (
            <div className="boardOverlay" role="status">
              {imageError ? imageError : '图片加载中…'}
            </div>
          )}
          {completed && (
            <div className="boardOverlay done" role="status">
              <div className={`doneCard ${celebrating ? 'celebrate' : ''}`}>
                <div className="doneTitle">完成啦！</div>
                <div className="doneMeta">
                  步数 {moves} · 用时 {elapsedSeconds}s
                </div>
                <div className="doneActions">
                  <button type="button" onClick={startNewPuzzle}>
                    再来一局
                  </button>
                  <button type="button" onClick={() => setPreviewOpen(true)}>
                    看原图
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="sidePanel" aria-label="控制与备选拼图块">
          <div className="panelCard">
            <div className="row">
              <label className="field">
                <div className="fieldLabel">难度</div>
                <div className="seg">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={difficulty === v ? 'segOn' : 'segOff'}
                      onClick={() => setDifficulty(v as Difficulty)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="row">
              <label className="field">
                <div className="fieldLabel">声音</div>
                <div className="seg">
                  <button
                    type="button"
                    className={soundEnabled ? 'segOn' : 'segOff'}
                    onClick={() => {
                      void ensureAudio()
                      setSoundEnabled(true)
                      showToast('声音已开启')
                    }}
                  >
                    开
                  </button>
                  <button
                    type="button"
                    className={!soundEnabled ? 'segOn' : 'segOff'}
                    onClick={() => {
                      setSoundEnabled(false)
                      showToast('声音已关闭')
                    }}
                  >
                    关
                  </button>
                </div>
              </label>
            </div>

            <div className="row">
              <label className="field">
                <div className="fieldLabel">拼块形状</div>
                <div className="seg">
                  {(['square', 'interlock'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={pieceShape === v ? 'segOn' : 'segOff'}
                      onClick={() => {
                        setPieceShape(v)
                        showToast(`已切换为${pieceShapeLabel(v)}拼块`)
                      }}
                    >
                      {pieceShapeLabel(v)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="row">
              <label className="field">
                <div className="fieldLabel">本地相册</div>
                <input
                  type="file"
                  accept="image/*"
                  className="file"
                  onChange={(e) => onPickLocalFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="row">
              <div className="field">
                <div className="fieldLabel">默认图片</div>
                <div className="thumbs" role="list">
                  {DEFAULT_IMAGES.map((img) => {
                    const active = !customImageUrl && img.id === selected.id
                    return (
                      <button
                        key={img.id}
                        type="button"
                        className={`thumb ${active ? 'thumbOn' : 'thumbOff'}`}
                        onClick={() => onChooseDefault(img)}
                        title={img.label}
                        role="listitem"
                      >
                        <img src={img.src} alt={img.label} loading="lazy" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="panelCard trayCard">
            <div className="trayTitle">备选拼图块（拖到空位）</div>
            <div className="tray" aria-label="备选拼图块列表" data-dropzone="tray">
              {(puzzle?.tray ?? []).map((piece) => {
                const hinting = hintPieceId === piece.id
                const isDragging = drag?.piece.id === piece.id
                return (
                  <div
                    key={piece.id}
                    className={`trayPiece ${hinting ? 'hint' : ''} ${isDragging ? 'dragging' : ''}`}
                    style={pieceShape === 'square' ? pieceStyle(piece) : undefined}
                    role="button"
                    tabIndex={0}
                    aria-label="拖动拼图块"
                    onPointerDown={(e) => {
                      if (completed) return
                      if (!puzzle) return
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      const offsetX = e.clientX - rect.left
                      const offsetY = e.clientY - rect.top
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      setDrag({
                        piece,
                        from: { type: 'tray' },
                        pointerId: e.pointerId,
                        offsetX,
                        offsetY,
                        x: e.clientX,
                        y: e.clientY,
                        width: rect.width,
                        height: rect.height,
                      })
                    }}
                  >
                    {renderPieceFace(piece)}
                  </div>
                )
              })}
              {puzzle && puzzle.tray.length === 0 && <div className="trayEmpty">就差最后检查啦～</div>}
            </div>
          </div>
        </aside>
      </main>

      {drag && (
        <div
          className="dragLayer"
          style={{
            left: `${drag.x - drag.offsetX}px`,
            top: `${drag.y - drag.offsetY}px`,
            width: `${drag.width}px`,
            height: `${drag.height}px`,
          }}
          aria-hidden="true"
        >
          <div className="dragPiece" style={pieceShape === 'square' ? pieceStyle(drag.piece) : undefined}>
            {renderPieceFace(drag.piece)}
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="modal" role="dialog" aria-label="原图预览" onClick={() => setPreviewOpen(false)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalTop">
              <div className="modalTitle">原图预览</div>
              <button type="button" onClick={() => setPreviewOpen(false)}>
                关闭
              </button>
            </div>
            <div className="modalBody">
              <img className="previewImg" src={imageSrc} alt="原图" />
            </div>
          </div>
        </div>
      )}

      <canvas className="fxCanvas" ref={fxCanvasRef} aria-hidden="true" />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
