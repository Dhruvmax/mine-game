import { z } from 'zod';

// Common validation schemas
export const teamNameSchema = z.string()
  .min(1, 'Team name is required')
  .max(50, 'Team name must be less than 50 characters')
  .trim()
  .refine(name => name.length > 0, 'Team name cannot be empty');

export const accessCodeSchema = z.enum(['EASY123', 'MED456', 'HARD789', 'techteammode'], {
  errorMap: () => ({ message: 'Invalid access code' })
});

export const difficultySchema = z.enum(['easy', 'medium', 'hard'], {
  errorMap: () => ({ message: 'Invalid difficulty level' })
});

export const sessionIdSchema = z.string()
  .min(1, 'Session ID is required');

export const questionIdSchema = z.number()
  .int('Question ID must be an integer')
  .min(1, 'Question ID must be at least 1')
  .max(8, 'Question ID must be at most 8');

export const answerSchema = z.number()
  .int('Answer must be an integer')
  .min(0, 'Answer must be at least 0')
  .max(3, 'Answer must be at most 3');

export const cellCoordinateSchema = z.number()
  .int('Coordinate must be an integer')
  .min(0, 'Coordinate must be at least 0')
  .max(2, 'Coordinate must be at most 2');

export const cellTypeSchema = z.enum(['mine', 'pro', 'blank'], {
  errorMap: () => ({ message: 'Invalid cell type' })
});

export const actionTypeSchema = z.enum(['reveal', 'flag'], {
  errorMap: () => ({ message: 'Invalid action type' })
});

// Composite validation schemas
export const teamRegistrationSchema = z.object({
  teamName: teamNameSchema,
  accessCode: accessCodeSchema
});

export const teamValidationSchema = z.object({
  teamName: teamNameSchema,
  accessCode: accessCodeSchema
});

export const quizAnswerSchema = z.object({
  sessionId: sessionIdSchema,
  questionId: questionIdSchema,
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
  selectedAnswer: answerSchema,
  correctAnswer: answerSchema
});

export const quizCompleteSchema = z.object({
  sessionId: sessionIdSchema,
  score: z.number().int().min(0).max(8),
  totalQuestions: z.number().int().min(1).max(8)
});

export const mineGameStartSchema = z.object({
  sessionId: sessionIdSchema,
  difficulty: difficultySchema
});

export const mineGameActionSchema = z.object({
  sessionId: sessionIdSchema,
  cellX: cellCoordinateSchema,
  cellY: cellCoordinateSchema,
  cellType: cellTypeSchema,
  action: actionTypeSchema.default('reveal')
});

export const mineGameCompleteSchema = z.object({
  sessionId: sessionIdSchema,
  finalMineScore: z.number().min(0),
  finalProScore: z.number().min(0)
});

export const questionCreateSchema = z.object({
  difficulty: difficultySchema,
  questionId: questionIdSchema,
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
  correctAnswer: answerSchema
});

export const questionUpdateSchema = z.object({
  _id: z.string().min(1, 'Question ID is required'),
  difficulty: difficultySchema,
  questionId: questionIdSchema,
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).length(4, 'Must have exactly 4 options'),
  correctAnswer: answerSchema
});

// Validation helper functions
export function validateTeamName(teamName: string): { isValid: boolean; error?: string } {
  try {
    teamNameSchema.parse(teamName);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid team name' };
  }
}

export function validateAccessCode(accessCode: string): { isValid: boolean; error?: string } {
  try {
    accessCodeSchema.parse(accessCode);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid access code' };
  }
}

export function validateQuizAnswer(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = quizAnswerSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid quiz answer data' };
  }
}

export function validateMineGameAction(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = mineGameActionSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid mine game action data' };
  }
}