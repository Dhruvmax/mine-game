"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import QuizRound from "@/components/quiz-round"
import MineGame from "@/components/mine-game"
import AdminPanel from "@/components/admin-panel"
import { Gamepad2, Trophy, Clock, Zap } from "lucide-react"

const ACCESS_CODES = {
  easy: "EASY123",
  medium: "MED456",
  hard: "HARD789",
  admin: "techteammode",
}

export default function HomePage() {
  const [accessCode, setAccessCode] = useState("")
  const [currentMode, setCurrentMode] = useState<"home" | "quiz" | "mine" | "admin">("home")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [canPlayMine, setCanPlayMine] = useState(false)
  const [gameSession, setGameSession] = useState<string>("")
  const [teamName, setTeamName] = useState("")

  useEffect(() => {
    // Generate unique session ID
    setGameSession(Date.now().toString())
  }, [])

  const checkTeamNameExists = (name: string): boolean => {
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]")
    return leaderboard.some((entry: any) => entry.teamName.toLowerCase() === name.toLowerCase())
  }

  const handleAccessCode = () => {
    const code = accessCode.toLowerCase()

    if (code === ACCESS_CODES.admin.toLowerCase()) {
      setCurrentMode("admin")
      return
    }

    const upperCode = accessCode.toUpperCase()
    const difficultyMap = {
      [ACCESS_CODES.easy]: "easy" as const,
      [ACCESS_CODES.medium]: "medium" as const,
      [ACCESS_CODES.hard]: "hard" as const,
    }

    const selectedDifficulty = difficultyMap[upperCode]
    if (selectedDifficulty) {
      if (!teamName.trim()) {
        alert("Please enter your team name first!")
        return
      }

      // Check if team name already exists
      if (checkTeamNameExists(teamName.trim())) {
        alert("This team name has already been used! Please choose a different team name.")
        return
      }

      setDifficulty(selectedDifficulty)
      setCurrentMode("quiz")
      setQuizCompleted(false)
      setQuizScore(0)
      setCanPlayMine(false)
    } else {
      alert("Invalid access code! Try again.")
    }
  }

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    setQuizScore(score)
    setQuizCompleted(true)

    // Updated requirements: Easy-6/8, Medium-5/8, Hard-4/8
    const requirements = { easy: 6, medium: 5, hard: 4 }
    const canPlay = difficulty && score >= requirements[difficulty]
    setCanPlayMine(!!canPlay)

    // Save to leaderboard with team name and new structure
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]")
    leaderboard.push({
      id: gameSession,
      teamName: teamName.trim(),
      difficulty,
      quizScore: score,
      mineScore: 0,
      proScore: 0,
      totalQuestions,
      timestamp: new Date().toISOString(),
      canPlayMine: !!canPlay,
      mineGameCompleted: false,
    })
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard))

    // If qualified for mine game, auto-transition after 1.5 seconds
    if (canPlay) {
      setTimeout(() => {
        setCurrentMode("mine")
      }, 1500)
    }
  }

  const handleMineGameComplete = (mineScore: number, proScore: number) => {
    // Update the existing leaderboard entry with mine game results
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]")
    const entryIndex = leaderboard.findIndex((entry: any) => entry.id === gameSession)

    if (entryIndex !== -1) {
      leaderboard[entryIndex].mineScore = mineScore
      leaderboard[entryIndex].proScore = proScore
      leaderboard[entryIndex].mineGameCompleted = true
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard))
    }
  }

  const resetGame = () => {
    setCurrentMode("home")
    setAccessCode("")
    setDifficulty(null)
    setQuizCompleted(false)
    setQuizScore(0)
    setCanPlayMine(false)
    setGameSession(Date.now().toString())
  }

  if (currentMode === "admin") {
    return <AdminPanel onBack={resetGame} />
  }

  if (currentMode === "mine") {
    return (
      <MineGame
        difficulty={difficulty!}
        onBack={resetGame}
        onComplete={(mineScore, proScore) => {
          handleMineGameComplete(mineScore, proScore)
          setTimeout(resetGame, 3000)
        }}
        teamName={teamName}
        gameSession={gameSession}
      />
    )
  }

  if (currentMode === "quiz") {
    return <QuizRound difficulty={difficulty!} onComplete={handleQuizComplete} onExit={resetGame} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-10"></div>

      <Card className="w-full max-w-md bg-black/80 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 animate-pulse"></div>

        <CardHeader className="text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gamepad2 className="w-16 h-16 text-cyan-400 animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent arcade-font">
            ARCADE QUIZ
          </CardTitle>
          <p className="text-cyan-300 text-sm mt-2 arcade-font">Enter the access code to begin your challenge!</p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {!quizCompleted ? (
            <>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter Team Name (Unique)"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-gray-900/50 border-purple-400/50 text-purple-100 placeholder-purple-400/50 text-center text-lg arcade-font"
                />

                <Input
                  type="text"
                  placeholder="Enter Access Code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-gray-900/50 border-cyan-400/50 text-cyan-100 placeholder-cyan-400/50 text-center text-lg arcade-font"
                  onKeyPress={(e) => e.key === "Enter" && handleAccessCode()}
                />

                <Button
                  onClick={handleAccessCode}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 text-lg arcade-font transform hover:scale-105 transition-all duration-200"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  START GAME
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 text-center">
                <div className="text-cyan-300 text-sm arcade-font">DIFFICULTY LEVELS:</div>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Badge variant="outline" className="border-green-400 text-green-400 arcade-font">
                    EASY
                  </Badge>
                  <Badge variant="outline" className="border-yellow-400 text-yellow-400 arcade-font">
                    MEDIUM
                  </Badge>
                  <Badge variant="outline" className="border-red-400 text-red-400 arcade-font">
                    HARD
                  </Badge>
                </div>
              </div>

              <div className="text-center text-xs text-cyan-400/70 arcade-font">
                <Clock className="w-4 h-4 inline mr-1" />5 minutes per round • HTML knowledge required
                <br />
                <span className="text-red-400">⚠️ Each team name can only be used once!</span>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold text-cyan-400 arcade-font">QUIZ COMPLETED!</div>
              <div className="text-lg text-white arcade-font">Score: {quizScore}/8</div>

              {canPlayMine ? (
                <div className="space-y-4">
                  <div className="text-green-400 font-bold arcade-font animate-pulse">🎉 CONGRATULATIONS! 🎉</div>
                  <div className="text-cyan-300 text-sm arcade-font">You've unlocked the MINE GAME!</div>
                  <Button
                    onClick={() => setCurrentMode("mine")}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 arcade-font"
                  >
                    💎 PLAY MINE GAME 💎
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-red-400 font-bold arcade-font">😅 Oops! Not quite there yet!</div>
                  <div className="text-cyan-300 text-sm arcade-font">
                    You need {difficulty === "easy" ? "6" : difficulty === "medium" ? "5" : "4"} correct answers to
                    unlock the mine game.
                    <br />
                    Better luck next time, champion! 🎮
                  </div>
                  <Button
                    onClick={resetGame}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 arcade-font"
                  >
                    🏠 RETURN HOME
                  </Button>
                </div>
              )}

              <Button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 arcade-font"
              >
                🔄 NEW GAME
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .arcade-font {
          font-family: 'Orbitron', monospace;
        }
        
        @keyframes neon-glow {
          0%, 100% { text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor; }
          50% { text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor; }
        }
        
        .neon-text {
          animation: neon-glow 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  )
}
