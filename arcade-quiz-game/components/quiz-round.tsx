"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, X } from "lucide-react"

interface Question {
  id: number
  question: string
  options: string[]
  correct: number
}

const getQuestions = async (difficulty: string): Promise<Question[]> => {
  try {
    const response = await fetch(`/api/quiz/questions?difficulty=${difficulty}`)
    const data = await response.json()
    
    if (data.success) {
      return data.data.questions
    } else {
      console.error('Failed to fetch questions:', data.message)
      return getDefaultQuestions(difficulty)
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
    return getDefaultQuestions(difficulty)
  }
}

const getDefaultQuestions = (difficulty: string): Question[] => {
  const questionSets = {
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
        options: ["To set multiple sources", "For responsive images", "To define fallback sources", "All of the above"],
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
        options: ["<input required>", "<input type='required'>", "<input mandatory='true'>", "<input validate='true'>"],
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

  return questionSets[difficulty as keyof typeof questionSets] || questionSets.easy
}

interface QuizRoundProps {
  difficulty: "easy" | "medium" | "hard"
  onComplete: (score: number, total: number) => void
  onExit: () => void
  sessionId?: string
}

export default function QuizRound({ difficulty, onComplete, onExit, sessionId }: QuizRoundProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTimers = JSON.parse(localStorage.getItem("timer-settings") || "{}")
    return savedTimers[difficulty] || 300
  })
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(8).fill(null))

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      const fetchedQuestions = await getQuestions(difficulty)
      setQuestions(fetchedQuestions)
      setAnswers(new Array(fetchedQuestions.length).fill(null))
      setLoading(false)
    }

    loadQuestions()

    const savedTimers = JSON.parse(localStorage.getItem("timer-settings") || "{}")
    const initialTime = savedTimers[difficulty] || 300
    setTimeLeft(initialTime)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [difficulty])

  const handleTimeUp = () => {
    calculateFinalScore()
  }

  const calculateFinalScore = () => {
    let finalScore = 0
    answers.forEach((answer, index) => {
      if (answer === questions[index]?.correct) {
        finalScore++
      }
    })
    setScore(finalScore)
    setShowResult(true)
    // Remove setTimeout, call immediately
    onComplete(finalScore, questions.length)
  }

  const handleAnswerSelect = async (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)

    // Submit answer to backend if sessionId is available
    if (sessionId && questions[currentQuestion]) {
      try {
        await fetch('/api/quiz/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            questionId: questions[currentQuestion].id,
            question: questions[currentQuestion].question,
            options: questions[currentQuestion].options,
            selectedAnswer: answerIndex,
            correctAnswer: questions[currentQuestion].correct
          })
        })
      } catch (error) {
        console.error('Failed to submit answer:', error)
        // Continue with local storage as fallback
      }
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(answers[currentQuestion + 1])
    } else {
      calculateFinalScore()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(answers[currentQuestion - 1])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/80 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/20">
          <CardContent className="text-center p-8 space-y-6">
            <div className="text-4xl font-bold text-cyan-400 arcade-font animate-pulse">
              {score >= (difficulty === "easy" ? 6 : difficulty === "medium" ? 5 : 4) ? "🎉" : "😅"}
            </div>
            <div className="text-2xl font-bold text-white arcade-font">QUIZ COMPLETED!</div>
            <div className="text-xl text-cyan-400 arcade-font">Final Score: {score}/8</div>
            <div className="text-sm text-cyan-300 arcade-font">Processing results...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Badge className={`${getDifficultyColor()} bg-transparent arcade-font text-lg px-4 py-2`}>
              {difficulty.toUpperCase()}
            </Badge>
            <div className="text-cyan-400 arcade-font">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-cyan-400"} arcade-font`}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button
              onClick={onExit}
              variant="outline"
              size="sm"
              className="border-red-400 text-red-400 hover:bg-red-400/20 arcade-font bg-transparent"
            >
              <X className="w-4 h-4 mr-1" />
              EXIT
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-3 bg-gray-800" />
        </div>

        {/* Question Card */}
        <Card className="bg-black/80 border-2 border-cyan-400/50 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-400 arcade-font">{questions[currentQuestion]?.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions[currentQuestion]?.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                variant={selectedAnswer === index ? "default" : "outline"}
                className={`w-full text-left justify-start p-4 h-auto arcade-font ${
                  selectedAnswer === index
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                    : "bg-gray-900/50 border-cyan-400/30 text-cyan-100 hover:border-cyan-400 hover:bg-cyan-400/10"
                }`}
              >
                <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 arcade-font bg-transparent"
          >
            ← PREVIOUS
          </Button>

          <div className="text-cyan-400 text-sm arcade-font">
            Score: {score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}
          </div>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white arcade-font"
          >
            {currentQuestion === questions.length - 1 ? "FINISH" : "NEXT"} →
          </Button>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {questions.map((_, index) => (
            <Button
              key={index}
              onClick={() => {
                setCurrentQuestion(index)
                setSelectedAnswer(answers[index])
              }}
              size="sm"
              variant={currentQuestion === index ? "default" : "outline"}
              className={`w-10 h-10 arcade-font ${
                answers[index] !== null ? "border-green-400 text-green-400" : "border-gray-600 text-gray-400"
              } ${currentQuestion === index ? "bg-cyan-500" : ""}`}
            >
              {index + 1}
            </Button>
          ))}
        </div>
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
