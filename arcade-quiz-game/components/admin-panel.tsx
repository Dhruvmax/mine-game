"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Settings, Users, Clock, Trophy, Edit, Save, Plus, Trash2 } from "lucide-react"

interface AdminPanelProps {
  onBack: () => void
}

interface LeaderboardEntry {
  id: string
  teamName: string
  difficulty: string
  quizScore: number
  mineScore: number
  proScore: number
  totalQuestions: number
  timestamp: string
  canPlayMine: boolean
  mineGameCompleted: boolean
}

interface Question {
  id: number
  question: string
  options: string[]
  correct: number
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timerSettings, setTimerSettings] = useState({
    easy: 300,
    medium: 300,
    hard: 300,
  })
  const [questions, setQuestions] = useState<{ [key: string]: Question[] }>({})
  const [editingQuestion, setEditingQuestion] = useState<{ difficulty: string; index: number } | null>(null)
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: 0,
    question: "",
    options: ["", "", "", ""],
    correct: 0,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [showGenerated, setShowGenerated] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load leaderboard from backend API
    try {
      const response = await fetch('/api/admin/leaderboard')
      const data = await response.json()
      
      if (data.success) {
        setLeaderboard(data.data.leaderboard.map((entry: any) => ({
          id: entry.sessionId,
          teamName: entry.teamName,
          difficulty: entry.difficulty,
          quizScore: entry.quizScore,
          mineScore: entry.mineScore,
          proScore: entry.proScore,
          totalQuestions: entry.totalQuestions || 8,
          timestamp: entry.startedAt,
          canPlayMine: entry.canPlayMine,
          mineGameCompleted: entry.status === 'mine_completed' || entry.status === 'finished'
        })))
      } else {
        console.error('Failed to load leaderboard:', data.message)
        // Fallback to localStorage
        const savedLeaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]")
        setLeaderboard(
          savedLeaderboard.sort(
            (a: LeaderboardEntry, b: LeaderboardEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
        )
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      // Fallback to localStorage
      const savedLeaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]")
      setLeaderboard(
        savedLeaderboard.sort(
          (a: LeaderboardEntry, b: LeaderboardEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      )
    }

    // Load timer settings
    const savedTimers = JSON.parse(localStorage.getItem("timer-settings") || "{}")
    setTimerSettings({
      easy: savedTimers.easy || 300,
      medium: savedTimers.medium || 300,
      hard: savedTimers.hard || 300,
    })

    // Load questions - ensure default questions are loaded if none exist
    const savedQuestions = JSON.parse(localStorage.getItem("quiz-questions") || "{}")

    // If no saved questions, load defaults
    const defaultQuestions = {
      easy: [
        {
          id: 1,
          question: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlink and Text Markup Language",
          ],
          correct: 0,
        },
        {
          id: 2,
          question: "Which HTML tag is used for the largest heading?",
          options: ["<h6>", "<h1>", "<heading>", "<header>"],
          correct: 1,
        },
        {
          id: 3,
          question: "What is the correct HTML tag for inserting a line break?",
          options: ["<break>", "<lb>", "<br>", "<newline>"],
          correct: 2,
        },
        {
          id: 4,
          question: "Which attribute specifies the URL of the page the link goes to?",
          options: ["src", "href", "link", "url"],
          correct: 1,
        },
        {
          id: 5,
          question: "What is the correct HTML for creating a hyperlink?",
          options: [
            "<a url='http://www.example.com'>Example</a>",
            "<a href='http://www.example.com'>Example</a>",
            "<a>http://www.example.com</a>",
            "<link>http://www.example.com</link>",
          ],
          correct: 1,
        },
        {
          id: 6,
          question: "Which HTML tag is used to define an internal style sheet?",
          options: ["<css>", "<script>", "<style>", "<styles>"],
          correct: 2,
        },
        {
          id: 7,
          question: "What is the correct HTML for making a text bold?",
          options: ["<bold>", "<b>", "<strong>", "Both <b> and <strong>"],
          correct: 3,
        },
        {
          id: 8,
          question: "Which HTML attribute is used to define inline styles?",
          options: ["class", "style", "styles", "font"],
          correct: 1,
        },
      ],
      medium: [
        {
          id: 1,
          question: "Which HTML5 element is used to specify a footer for a document or section?",
          options: ["<bottom>", "<footer>", "<section>", "<end>"],
          correct: 1,
        },
        {
          id: 2,
          question: "What is the correct HTML5 element for playing video files?",
          options: ["<movie>", "<video>", "<media>", "<film>"],
          correct: 1,
        },
        {
          id: 3,
          question: "Which input type is NOT valid in HTML5?",
          options: ["email", "url", "datetime", "slider"],
          correct: 3,
        },
        {
          id: 4,
          question: "What is the purpose of the 'data-*' attributes in HTML5?",
          options: ["To store custom data", "To define CSS classes", "To create links", "To add comments"],
          correct: 0,
        },
        {
          id: 5,
          question: "Which HTML5 element is used to draw graphics via scripting?",
          options: ["<graphics>", "<canvas>", "<draw>", "<svg>"],
          correct: 1,
        },
        {
          id: 6,
          question: "What is the correct way to make a number input field?",
          options: ["<input type='num'>", "<input type='number'>", "<input type='numeric'>", "<number>"],
          correct: 1,
        },
        {
          id: 7,
          question: "Which attribute makes an input field required?",
          options: ["required", "mandatory", "needed", "must"],
          correct: 0,
        },
        {
          id: 8,
          question: "What is the semantic HTML5 element for navigation links?",
          options: ["<navigation>", "<nav>", "<menu>", "<links>"],
          correct: 1,
        },
      ],
      hard: [
        {
          id: 1,
          question: "Which HTML5 API is used for client-side storage that persists even after the browser is closed?",
          options: ["sessionStorage", "localStorage", "cookies", "indexedDB"],
          correct: 1,
        },
        {
          id: 2,
          question: "What is the purpose of the 'srcset' attribute in HTML5?",
          options: [
            "To set multiple sources",
            "For responsive images",
            "To define fallback sources",
            "All of the above",
          ],
          correct: 3,
        },
        {
          id: 3,
          question: "Which HTML5 element is used to represent a scalar measurement within a known range?",
          options: ["<progress>", "<meter>", "<range>", "<scale>"],
          correct: 1,
        },
        {
          id: 4,
          question: "What is the correct way to specify that an input field must be filled out before submitting?",
          options: [
            "<input required>",
            "<input type='required'>",
            "<input mandatory='true'>",
            "<input validate='true'>",
          ],
          correct: 0,
        },
        {
          id: 5,
          question:
            "Which HTML5 element represents a disclosure widget from which the user can obtain additional information?",
          options: ["<summary>", "<details>", "<accordion>", "<expand>"],
          correct: 1,
        },
        {
          id: 6,
          question: "What is the purpose of the 'contenteditable' attribute?",
          options: [
            "Makes element draggable",
            "Makes element editable",
            "Makes element clickable",
            "Makes element visible",
          ],
          correct: 1,
        },
        {
          id: 7,
          question: "Which HTML5 input type is used for selecting a week and year?",
          options: ["week", "date-week", "weekly", "week-year"],
          correct: 0,
        },
        {
          id: 8,
          question: "What does the 'defer' attribute do in a script tag?",
          options: [
            "Delays script execution",
            "Executes script after page load",
            "Executes script asynchronously",
            "Prevents script execution",
          ],
          correct: 1,
        },
      ],
    }

    // Merge saved questions with defaults, prioritizing saved questions
    const finalQuestions = {
      easy: savedQuestions.easy && savedQuestions.easy.length > 0 ? savedQuestions.easy : defaultQuestions.easy,
      medium:
        savedQuestions.medium && savedQuestions.medium.length > 0 ? savedQuestions.medium : defaultQuestions.medium,
      hard: savedQuestions.hard && savedQuestions.hard.length > 0 ? savedQuestions.hard : defaultQuestions.hard,
    }

    setQuestions(finalQuestions)

    // Save the merged questions back to localStorage if defaults were used
    if (!savedQuestions.easy || !savedQuestions.medium || !savedQuestions.hard) {
      localStorage.setItem("quiz-questions", JSON.stringify(finalQuestions))
    }
  }

  const saveTimerSettings = () => {
    localStorage.setItem("timer-settings", JSON.stringify(timerSettings))
    alert("Timer settings saved!")
  }

  const saveQuestions = () => {
    localStorage.setItem("quiz-questions", JSON.stringify(questions))
    alert("Questions saved!")
  }

  const addQuestion = (difficulty: string) => {
    const currentQuestions = questions[difficulty] || []
    const newId = Math.max(...currentQuestions.map((q) => q.id), 0) + 1
    const questionToAdd = { ...newQuestion, id: newId }

    setQuestions({
      ...questions,
      [difficulty]: [...currentQuestions, questionToAdd],
    })

    setNewQuestion({
      id: 0,
      question: "",
      options: ["", "", "", ""],
      correct: 0,
    })
  }

  const deleteQuestion = (difficulty: string, index: number) => {
    const currentQuestions = questions[difficulty] || []
    const updatedQuestions = currentQuestions.filter((_, i) => i !== index)

    setQuestions({
      ...questions,
      [difficulty]: updatedQuestions,
    })
  }

  const updateQuestion = (difficulty: string, index: number, updatedQuestion: Question) => {
    const currentQuestions = questions[difficulty] || []
    const updatedQuestions = [...currentQuestions]
    updatedQuestions[index] = updatedQuestion

    setQuestions({
      ...questions,
      [difficulty]: updatedQuestions,
    })

    setEditingQuestion(null)
  }

  const generateQuestions = async (difficulty: string) => {
    setIsGenerating(true)

    // Simulate AI generation with predefined question templates
    const questionTemplates = {
      easy: [
        {
          question: "What does CSS stand for?",
          options: [
            "Cascading Style Sheets",
            "Computer Style Sheets",
            "Creative Style Sheets",
            "Colorful Style Sheets",
          ],
          correct: 0,
        },
        {
          question: "Which HTML tag is used to create a paragraph?",
          options: ["<paragraph>", "<p>", "<para>", "<text>"],
          correct: 1,
        },
        {
          question: "What is the correct way to comment in HTML?",
          options: ["// comment", "/* comment */", "<!-- comment -->", "# comment"],
          correct: 2,
        },
        {
          question: "Which attribute is used to provide alternative text for an image?",
          options: ["title", "alt", "src", "text"],
          correct: 1,
        },
        {
          question: "What is the largest heading tag in HTML?",
          options: ["<h6>", "<h1>", "<head>", "<header>"],
          correct: 1,
        },
      ],
      medium: [
        {
          question: "Which CSS property is used to change the text color?",
          options: ["font-color", "text-color", "color", "foreground-color"],
          correct: 2,
        },
        {
          question: "What is the correct CSS syntax for making all <p> elements bold?",
          options: ["p {text-size: bold;}", "p {font-weight: bold;}", "p {text-style: bold;}", "p {font-style: bold;}"],
          correct: 1,
        },
        {
          question: "Which HTML5 element is used for navigation?",
          options: ["<navigation>", "<nav>", "<navigate>", "<menu>"],
          correct: 1,
        },
        {
          question: "What does the 'box-sizing' property do in CSS?",
          options: [
            "Changes box color",
            "Controls how element size is calculated",
            "Sets box position",
            "Creates box shadow",
          ],
          correct: 1,
        },
        {
          question: "Which CSS property is used to create space between elements?",
          options: ["padding", "margin", "spacing", "gap"],
          correct: 1,
        },
      ],
      hard: [
        {
          question: "What is the purpose of the 'viewport' meta tag?",
          options: ["Sets page title", "Controls responsive design", "Defines character encoding", "Links stylesheets"],
          correct: 1,
        },
        {
          question: "Which CSS property creates a flexible layout?",
          options: ["display: flex", "layout: flex", "flex: true", "flexible: yes"],
          correct: 0,
        },
        {
          question: "What is the difference between 'em' and 'rem' units?",
          options: [
            "No difference",
            "em is relative to parent, rem to root",
            "rem is relative to parent, em to root",
            "Both are absolute units",
          ],
          correct: 1,
        },
        {
          question: "Which JavaScript method is used to select an element by ID?",
          options: ["getElementById", "selectById", "findById", "getElementByIdName"],
          correct: 0,
        },
        {
          question: "What is the purpose of CSS Grid?",
          options: ["Create animations", "Two-dimensional layout system", "Style text", "Handle events"],
          correct: 1,
        },
      ],
    }

    // Simulate loading time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const templates = questionTemplates[difficulty as keyof typeof questionTemplates] || questionTemplates.easy
    const generated = templates.map((template, index) => ({
      id: Date.now() + index,
      ...template,
    }))

    setGeneratedQuestions(generated)
    setShowGenerated(true)
    setIsGenerating(false)
  }

  const acceptGeneratedQuestions = (difficulty: string) => {
    setQuestions({
      ...questions,
      [difficulty]: generatedQuestions,
    })
    setShowGenerated(false)
    setGeneratedQuestions([])
    alert(`${generatedQuestions.length} questions added to ${difficulty} difficulty!`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-400"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-400"
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-400"
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-400"
    }
  }

  const EditQuestionForm = ({
    question,
    onSave,
    onCancel,
  }: {
    question: Question
    onSave: (question: Question) => void
    onCancel: () => void
  }) => {
    const [editedQuestion, setEditedQuestion] = useState(question)

    return (
      <div className="space-y-3">
        <Textarea
          value={editedQuestion.question}
          onChange={(e) => setEditedQuestion({ ...editedQuestion, question: e.target.value })}
          className="bg-gray-800 border-cyan-400/30 text-cyan-100 arcade-font"
        />
        {editedQuestion.options.map((option, optIndex) => (
          <div key={optIndex} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => {
                const newOptions = [...editedQuestion.options]
                newOptions[optIndex] = e.target.value
                setEditedQuestion({ ...editedQuestion, options: newOptions })
              }}
              className="bg-gray-800 border-cyan-400/30 text-cyan-100 arcade-font"
            />
            <Button
              size="sm"
              variant={editedQuestion.correct === optIndex ? "default" : "outline"}
              onClick={() => setEditedQuestion({ ...editedQuestion, correct: optIndex })}
              className="arcade-font"
            >
              {editedQuestion.correct === optIndex ? "✓" : "Correct"}
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            onClick={() => onSave(editedQuestion)}
            className="bg-green-500 hover:bg-green-600 text-white arcade-font"
          >
            <Save className="w-4 h-4 mr-1" />
            SAVE
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-red-400 text-red-400 hover:bg-red-400/20 arcade-font bg-transparent"
          >
            CANCEL
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 arcade-font bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO GAME
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent arcade-font">
              🔧 ADMIN CONTROL PANEL 🔧
            </h1>
          </div>
          <Badge className="bg-red-500/20 text-red-400 border-red-400 arcade-font text-lg px-4 py-2">ADMIN MODE</Badge>
        </div>

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-cyan-400/30">
            <TabsTrigger value="leaderboard" className="arcade-font data-[state=active]:bg-cyan-500">
              <Users className="w-4 h-4 mr-2" />
              LEADERBOARD
            </TabsTrigger>
            <TabsTrigger value="settings" className="arcade-font data-[state=active]:bg-cyan-500">
              <Settings className="w-4 h-4 mr-2" />
              SETTINGS
            </TabsTrigger>
            <TabsTrigger value="questions" className="arcade-font data-[state=active]:bg-cyan-500">
              <Edit className="w-4 h-4 mr-2" />
              QUESTIONS
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-black/80 border-2 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-400 arcade-font flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  TEAM LEADERBOARD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <div className="text-center text-cyan-400/70 arcade-font py-8">No quiz attempts yet</div>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-cyan-400/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-cyan-400 arcade-font">#{index + 1}</div>
                          <div>
                            <div className="text-lg font-bold text-white arcade-font">{entry.teamName}</div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getDifficultyColor(entry.difficulty)}>
                                {entry.difficulty.toUpperCase()}
                              </Badge>
                              {entry.canPlayMine && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400">
                                  💎 MINE ACCESS
                                </Badge>
                              )}
                              {entry.mineGameCompleted && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-400">
                                  🎮 MINE COMPLETED
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-cyan-300 arcade-font">{formatDate(entry.timestamp)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white arcade-font mb-1">
                            Quiz: {entry.quizScore}/{entry.totalQuestions}
                          </div>
                          <div className="text-sm arcade-font space-y-1">
                            <div className="text-emerald-400">Mine: {entry.mineScore || 0} pts</div>
                            <div className="text-yellow-400">Pro: {entry.proScore || 0} pts</div>
                            <div className="text-cyan-400 font-bold">
                              Total: {entry.quizScore + (entry.mineScore || 0) + (entry.proScore || 0)} pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-black/80 border-2 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-400 arcade-font flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  TIMER SETTINGS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(timerSettings).map(([difficulty, seconds]) => (
                  <div
                    key={difficulty}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-cyan-400/20"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={getDifficultyColor(difficulty)}>{difficulty.toUpperCase()}</Badge>
                      <span className="text-cyan-300 arcade-font">Quiz Timer</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={seconds}
                        onChange={(e) =>
                          setTimerSettings({
                            ...timerSettings,
                            [difficulty]: Number.parseInt(e.target.value) || 300,
                          })
                        }
                        className="w-20 bg-gray-800 border-cyan-400/30 text-cyan-100 arcade-font"
                        min="60"
                        max="1800"
                      />
                      <span className="text-cyan-400 arcade-font text-sm">({formatTime(seconds)})</span>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={saveTimerSettings}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white arcade-font"
                >
                  <Save className="w-4 h-4 mr-2" />
                  SAVE TIMER SETTINGS
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <div className="space-y-6">
              {["easy", "medium", "hard"].map((difficulty) => (
                <Card key={difficulty} className="bg-black/80 border-2 border-cyan-400/50">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 arcade-font flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit className="w-6 h-6" />
                        {difficulty.toUpperCase()} QUESTIONS
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(difficulty)}>
                          {(questions[difficulty] || []).length}/8 Questions
                        </Badge>
                        <Button
                          onClick={() => generateQuestions(difficulty)}
                          disabled={isGenerating}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white arcade-font"
                        >
                          {isGenerating ? "🔄 GENERATING..." : "🤖 GENERATE QUESTIONS"}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Show Generated Questions Preview */}
                    {showGenerated && (
                      <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-400/50">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-purple-400 arcade-font font-bold">🤖 GENERATED QUESTIONS PREVIEW</h4>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => acceptGeneratedQuestions(difficulty)}
                              className="bg-green-500 hover:bg-green-600 text-white arcade-font"
                            >
                              ✅ ACCEPT ALL
                            </Button>
                            <Button
                              onClick={() => setShowGenerated(false)}
                              variant="outline"
                              className="border-red-400 text-red-400 hover:bg-red-400/20 arcade-font"
                            >
                              ❌ REJECT
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {generatedQuestions.map((question, index) => (
                            <div key={question.id} className="p-3 bg-gray-900/50 rounded border border-purple-400/30">
                              <p className="text-purple-300 arcade-font font-bold mb-2">
                                Q{index + 1}: {question.question}
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-1 rounded arcade-font ${
                                      optIndex === question.correct
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-gray-800 text-gray-300"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Question */}
                    <div className="p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
                      <h4 className="text-cyan-400 arcade-font mb-3">ADD NEW QUESTION</h4>
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Question text"
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          className="bg-gray-800 border-cyan-400/30 text-cyan-100 arcade-font"
                        />
                        {newQuestion.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              placeholder={`Option ${optIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newQuestion.options]
                                newOptions[optIndex] = e.target.value
                                setNewQuestion({ ...newQuestion, options: newOptions })
                              }}
                              className="bg-gray-800 border-cyan-400/30 text-cyan-100 arcade-font"
                            />
                            <Button
                              size="sm"
                              variant={newQuestion.correct === optIndex ? "default" : "outline"}
                              onClick={() => setNewQuestion({ ...newQuestion, correct: optIndex })}
                              className="arcade-font"
                            >
                              {newQuestion.correct === optIndex ? "✓" : "Set Correct"}
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => addQuestion(difficulty)}
                          disabled={!newQuestion.question || newQuestion.options.some((opt) => !opt)}
                          className="bg-green-500 hover:bg-green-600 text-white arcade-font"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          ADD QUESTION
                        </Button>
                      </div>
                    </div>

                    {/* Existing Questions */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(questions[difficulty] || []).map((question, index) => (
                        <div key={question.id} className="p-4 bg-gray-900/50 rounded-lg border border-cyan-400/20">
                          {editingQuestion?.difficulty === difficulty && editingQuestion?.index === index ? (
                            <EditQuestionForm
                              question={question}
                              onSave={(updatedQuestion) => updateQuestion(difficulty, index, updatedQuestion)}
                              onCancel={() => setEditingQuestion(null)}
                            />
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-cyan-300 arcade-font font-bold">Q{index + 1}</h5>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingQuestion({ difficulty, index })}
                                    className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 arcade-font"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteQuestion(difficulty, index)}
                                    className="border-red-400 text-red-400 hover:bg-red-400/20 arcade-font"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-cyan-100 arcade-font mb-2">{question.question}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-2 rounded text-sm arcade-font ${
                                      optIndex === question.correct
                                        ? "bg-green-500/20 text-green-400 border border-green-400"
                                        : "bg-gray-800 text-gray-300"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={saveQuestions}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 text-lg arcade-font"
              >
                <Save className="w-5 h-5 mr-2" />
                SAVE ALL QUESTIONS
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      
      .arcade-font {
        font-family: 'Orbitron', monospace;
      }
    `}</style>
    </div>
  )
}
