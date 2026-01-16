import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { DEFAULT_IMAGES, type ImageOption } from './defaultImages'
import { createPuzzle, gridSizeForDifficulty, isComplete, type Difficulty, type Piece, type PuzzleState } from './puzzle'

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

  function showToast(message: string) {
    setToast(message)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1500)
  }

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
  }

  useEffect(() => {
    localStorage.setItem('jigsaw:difficulty', String(difficulty))
  }, [difficulty])

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
  }, [drag, puzzle])

  useEffect(() => {
    if (!completed) return
    showToast('完成啦！')
  }, [completed])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    }
  }, [])

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

  return (
    <div className="app">
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
                        style={pieceStyle(cell)}
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
                      />
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
              <div className="doneCard">
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
                    style={pieceStyle(piece)}
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
                  />
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
          <div className="dragPiece" style={pieceStyle(drag.piece)} />
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
