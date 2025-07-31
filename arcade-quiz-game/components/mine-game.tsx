"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gem, Trophy, ArrowLeft, Target, Zap } from "lucide-react"

interface MineGameProps {
  difficulty: "easy" | "medium" | "hard"
  onBack: () => void
  onComplete: (mineScore: number, proScore: number) => void
  teamName?: string
  gameSession?: string
}

type CellType = "mine" | "pro" | "blank" | "revealed-mine" | "revealed-pro" | "revealed-blank"

export default function MineGame({ difficulty, onBack, onComplete, teamName, gameSession }: MineGameProps) {
  const [grid, setGrid] = useState<CellType[][]>([])
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing")
  const [mineScore, setMineScore] = useState(0)
  const [proScore, setProScore] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [minesFound, setMinesFound] = useState(0)
  const [prosFound, setProsFound] = useState(0)
  const [totalMines, setTotalMines] = useState(0)
  const [totalPros, setTotalPros] = useState(0)

  const getGameConfig = () => {
    switch (difficulty) {
      case "easy":
        return { attempts: 2, mines: 5, pros: 2, blanks: 2 }
      case "medium":
        return { attempts: 3, mines: 4, pros: 3, blanks: 2 }
      case "hard":
        return { attempts: 4, mines: 3, pros: 4, blanks: 2 }
      default:
        return { attempts: 2, mines: 5, pros: 2, blanks: 2 }
    }
  }

  useEffect(() => {
    initializeGame()
  }, [difficulty])

  const initializeGame = () => {
    const config = getGameConfig()
    setAttemptsLeft(config.attempts)
    setTotalAttempts(config.attempts)
    setTotalMines(config.mines)
    setTotalPros(config.pros)

    // Create 3x3 grid
    const newGrid: CellType[][] = Array(3)
      .fill(null)
      .map(() => Array(3).fill("blank"))

    // Create array of all positions
    const positions: [number, number][] = []
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        positions.push([i, j])
      }
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    // Place mines
    for (let i = 0; i < config.mines; i++) {
      const [row, col] = positions[i]
      newGrid[row][col] = "mine"
    }

    // Place pros
    for (let i = config.mines; i < config.mines + config.pros; i++) {
      const [row, col] = positions[i]
      newGrid[row][col] = "pro"
    }

    // Remaining cells stay as blanks (already set)

    setGrid(newGrid)
    setGameStatus("playing")
    setMineScore(0)
    setProScore(0)
    setMinesFound(0)
    setProsFound(0)
  }

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== "playing" || attemptsLeft <= 0) return
    if (grid[row][col].toString().includes("revealed")) return

    const newGrid = [...grid.map((row) => [...row])]
    const cellType = newGrid[row][col]

    // Decrease attempts regardless of what was clicked
    const newAttemptsLeft = attemptsLeft - 1
    setAttemptsLeft(newAttemptsLeft)

    if (cellType === "mine") {
      newGrid[row][col] = "revealed-mine"
      setMinesFound((prev) => prev + 1)
      setMineScore((prev) => prev + 100)
    } else if (cellType === "pro") {
      newGrid[row][col] = "revealed-pro"
      setProsFound((prev) => prev + 1)
      setProScore((prev) => prev + 200)
    } else if (cellType === "blank") {
      newGrid[row][col] = "revealed-blank"
      // No score change for blank
    }

    setGrid(newGrid)

    // Check if no attempts left
    if (newAttemptsLeft <= 0) {
      setGameStatus("won") // Game ends when attempts are exhausted
      setTimeout(() => {
        onComplete(mineScore + (cellType === "mine" ? 100 : 0), proScore + (cellType === "pro" ? 200 : 0))
      }, 2000)
    }
  }

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 border-green-400"
      case "medium":
        return "text-yellow-400 border-yellow-400"
      case "hard":
        return "text-red-400 border-red-400"
      default:
        return "text-cyan-400 border-cyan-400"
    }
  }

  const getCellContent = (row: number, col: number) => {
    const cell = grid[row][col]

    if (cell === "revealed-mine") {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-pulse">
          <Gem className="w-8 h-8 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-bold arcade-font">MINE</span>
        </div>
      )
    }

    if (cell === "revealed-pro") {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-bounce">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-bold arcade-font">PRO</span>
        </div>
      )
    }

    if (cell === "revealed-blank") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-2xl">💥</span>
          <span className="text-xs text-red-400 font-bold arcade-font">BLANK</span>
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded border-2 border-gray-600 hover:border-cyan-400 transition-all duration-200 cursor-pointer flex items-center justify-center transform hover:scale-95">
        <div className="w-6 h-6 bg-gray-500 rounded-full opacity-50 flex items-center justify-center">
          <Target className="w-3 h-3 text-gray-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-5"></div>

      <Card className="w-full max-w-lg bg-black/80 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 animate-pulse"></div>

        <CardHeader className="text-center relative z-10">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 arcade-font bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              BACK
            </Button>

            <Badge className={`${getDifficultyColor()} bg-transparent arcade-font`}>
              {difficulty.toUpperCase()} MINES
            </Badge>
          </div>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gem className="w-12 h-12 text-emerald-400 animate-bounce" />
              <Zap className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent arcade-font">
            💎 MINE HUNTER 💎
          </CardTitle>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm arcade-font">
            <div className="text-emerald-400 flex items-center justify-center gap-1">
              <Gem className="w-4 h-4" />
              Mine Score: {mineScore}
            </div>
            <div className="text-yellow-400 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4" />
              Pro Score: {proScore}
            </div>
            <div className="text-red-400 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />
              Attempts: {attemptsLeft}/{totalAttempts}
            </div>
            <div className="text-cyan-400 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              Total: {mineScore + proScore}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          {gameStatus === "won" && attemptsLeft === 0 && (
            <div className="text-center mb-6 p-4 bg-green-500/20 border border-green-400 rounded-lg">
              <div className="text-2xl font-bold text-green-400 arcade-font animate-pulse">🎉 GAME COMPLETE! 🎉</div>
              <div className="text-green-300 text-sm arcade-font mt-2">
                Final Score: {mineScore + proScore} points!
                <br />
                Mines: {mineScore} | Pros: {proScore}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square relative"
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  <div className="w-full h-full bg-gray-800 rounded-lg border-2 border-gray-600 hover:border-cyan-400 transition-all duration-200 flex items-center justify-center cursor-pointer transform hover:scale-105">
                    {getCellContent(rowIndex, colIndex)}
                  </div>
                </div>
              )),
            )}
          </div>

          <div className="text-center space-y-2">
            <div className="text-cyan-300 text-sm arcade-font">You have {attemptsLeft} attempts remaining!</div>
            <div className="text-cyan-400/70 text-xs arcade-font">
              Click any cell to reveal what's underneath. Mines = 100pts, Pros = 200pts
            </div>

            <Button
              onClick={initializeGame}
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 arcade-font"
            >
              🔄 NEW GAME
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .arcade-font {
          font-family: 'Orbitron', monospace;
        }
      `}</style>
    </div>
  )
}
