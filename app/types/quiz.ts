// One multiple-choice question.
export interface quizQuestion {
  question: string;
  options: string[]; // the choices the user picks from
  correctIndex: number; // 0-based index into `options` that is correct
}
