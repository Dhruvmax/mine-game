import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { z } from 'zod';

const questionsSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard'])
});

// Default questions data
const defaultQuestions = {
  easy: [
    {
      questionId: 1,
      question: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "High Tech Modern Language",
        "Home Tool Markup Language",
        "Hyperlink and Text Markup Language",
      ],
      correctAnswer: 0,
    },
    {
      questionId: 2,
      question: "Which HTML tag is used for the largest heading?",
      options: ["<h6>", "<h1>", "<heading>", "<header>"],
      correctAnswer: 1,
    },
    {
      questionId: 3,
      question: "What is the correct HTML tag for inserting a line break?",
      options: ["<break>", "<lb>", "<br>", "<newline>"],
      correctAnswer: 2,
    },
    {
      questionId: 4,
      question: "Which attribute specifies the URL of the page the link goes to?",
      options: ["src", "href", "link", "url"],
      correctAnswer: 1,
    },
    {
      questionId: 5,
      question: "What is the correct HTML for creating a hyperlink?",
      options: [
        "<a url='http://www.example.com'>Example</a>",
        "<a href='http://www.example.com'>Example</a>",
        "<a>http://www.example.com</a>",
        "<link>http://www.example.com</link>",
      ],
      correctAnswer: 1,
    },
    {
      questionId: 6,
      question: "Which HTML tag is used to define an internal style sheet?",
      options: ["<css>", "<script>", "<style>", "<styles>"],
      correctAnswer: 2,
    },
    {
      questionId: 7,
      question: "What is the correct HTML for making a text bold?",
      options: ["<bold>", "<b>", "<strong>", "Both <b> and <strong>"],
      correctAnswer: 3,
    },
    {
      questionId: 8,
      question: "Which HTML attribute is used to define inline styles?",
      options: ["class", "style", "styles", "font"],
      correctAnswer: 1,
    },
  ],
  medium: [
    {
      questionId: 1,
      question: "Which HTML5 element is used to specify a footer for a document or section?",
      options: ["<bottom>", "<footer>", "<section>", "<end>"],
      correctAnswer: 1,
    },
    {
      questionId: 2,
      question: "What is the correct HTML5 element for playing video files?",
      options: ["<movie>", "<video>", "<media>", "<film>"],
      correctAnswer: 1,
    },
    {
      questionId: 3,
      question: "Which input type is NOT valid in HTML5?",
      options: ["email", "url", "datetime", "slider"],
      correctAnswer: 3,
    },
    {
      questionId: 4,
      question: "What is the purpose of the 'data-*' attributes in HTML5?",
      options: ["To store custom data", "To define CSS classes", "To create links", "To add comments"],
      correctAnswer: 0,
    },
    {
      questionId: 5,
      question: "Which HTML5 element is used to draw graphics via scripting?",
      options: ["<graphics>", "<canvas>", "<draw>", "<svg>"],
      correctAnswer: 1,
    },
    {
      questionId: 6,
      question: "What is the correct way to make a number input field?",
      options: ["<input type='num'>", "<input type='number'>", "<input type='numeric'>", "<number>"],
      correctAnswer: 1,
    },
    {
      questionId: 7,
      question: "Which attribute makes an input field required?",
      options: ["required", "mandatory", "needed", "must"],
      correctAnswer: 0,
    },
    {
      questionId: 8,
      question: "What is the semantic HTML5 element for navigation links?",
      options: ["<navigation>", "<nav>", "<menu>", "<links>"],
      correctAnswer: 1,
    },
  ],
  hard: [
    {
      questionId: 1,
      question: "Which HTML5 API is used for client-side storage that persists even after the browser is closed?",
      options: ["sessionStorage", "localStorage", "cookies", "indexedDB"],
      correctAnswer: 1,
    },
    {
      questionId: 2,
      question: "What is the purpose of the 'srcset' attribute in HTML5?",
      options: ["To set multiple sources", "For responsive images", "To define fallback sources", "All of the above"],
      correctAnswer: 3,
    },
    {
      questionId: 3,
      question: "Which HTML5 element is used to represent a scalar measurement within a known range?",
      options: ["<progress>", "<meter>", "<range>", "<scale>"],
      correctAnswer: 1,
    },
    {
      questionId: 4,
      question: "What is the correct way to specify that an input field must be filled out before submitting?",
      options: ["<input required>", "<input type='required'>", "<input mandatory='true'>", "<input validate='true'>"],
      correctAnswer: 0,
    },
    {
      questionId: 5,
      question: "Which HTML5 element represents a disclosure widget from which the user can obtain additional information?",
      options: ["<summary>", "<details>", "<accordion>", "<expand>"],
      correctAnswer: 1,
    },
    {
      questionId: 6,
      question: "What is the purpose of the 'contenteditable' attribute?",
      options: [
        "Makes element draggable",
        "Makes element editable",
        "Makes element clickable",
        "Makes element visible",
      ],
      correctAnswer: 1,
    },
    {
      questionId: 7,
      question: "Which HTML5 input type is used for selecting a week and year?",
      options: ["week", "date-week", "weekly", "week-year"],
      correctAnswer: 0,
    },
    {
      questionId: 8,
      question: "What does the 'defer' attribute do in a script tag?",
      options: [
        "Delays script execution",
        "Executes script after page load",
        "Executes script asynchronously",
        "Prevents script execution",
      ],
      correctAnswer: 1,
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard';

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_DIFFICULTY',
        message: 'Please provide a valid difficulty level (easy, medium, hard)'
      }, { status: 400 });
    }

    // Try to get questions from database first
    let questions = await QuizQuestion.find({ difficulty }).sort({ questionId: 1 });

    // If no questions in database, use default questions and save them
    if (questions.length === 0) {
      const defaultQuestionsForDifficulty = defaultQuestions[difficulty];
      
      const questionsToSave = defaultQuestionsForDifficulty.map(q => ({
        ...q,
        difficulty
      }));

      await QuizQuestion.insertMany(questionsToSave);
      questions = await QuizQuestion.find({ difficulty }).sort({ questionId: 1 });
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: questions.map(q => ({
          id: q.questionId,
          question: q.question,
          options: q.options,
          correct: q.correctAnswer
        })),
        difficulty,
        totalQuestions: questions.length
      }
    });

  } catch (error) {
    console.error('Quiz questions fetch error:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch quiz questions'
    }, { status: 500 });
  }
}