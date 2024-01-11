import React, { useState, useEffect, useCallback } from 'react';
import { Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { decodeHTML } from 'entities';

const QUESION_URL = 'https://opentdb.com/api.php?amount=10';

// omitting fields I don't care about
type Question = {
  type: 'multiple' | 'boolean';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [questions, setQuestions] = useState<Array<Question>>([]);
  const [questionIdx, setQuestionIdx] = useState<number>(-1);
  const { exit } = useApp();
  const [answers, setAnswers] = useState<Array<boolean>>([]);

  const answerFn = useCallback(
    (response: boolean) => {
      setAnswers(p => {
        p.push(response);
        return p;
      });
      setQuestionIdx(p => p + 1);
    },
    [setAnswers]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const fetchQuestions = async () => {
      setIsLoading(true);
      setQuestionIdx(-1);
      try {
        const data: any = await fetch(QUESION_URL, {
          signal: abortController.signal
        }).then(r => r.json());
        setQuestions(_ => {
          return data.results;
        });
        setIsLoading(false);
        setQuestionIdx(0);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          throw error;
        }
      }
    };
    fetchQuestions();

    return () => abortController.abort();
  }, []);

  useInput(input => {
    switch (input) {
      case 'Q':
      case 'q':
        exit();
        break;
    }
  });

  return (
    <>
      {isLoading && (
        <>
          <Spinner type="line" />
          <Text>Loading questions...</Text>
        </>
      )}
      <Question question={questions[questionIdx]} handleResponse={answerFn} />
      {questionIdx === questions.length && (
        <Text>
          {answers.reduce((a, c) => (c ? a + 1 : a), 0)}/{questions.length}
        </Text>
      )}

      <Text color={'gray'}>Press 'q' to exit</Text>
    </>
  );
}

type QuestionProps = {
  question: Question | undefined;
  handleResponse: (result: boolean) => void;
};

const AnswerMap = ['a', 'b', 'c', 'd'] as const;

function Question(props: QuestionProps) {
  useInput(
    input => {
      switch (input) {
        case 'a':
          props.handleResponse(true);
          break;
        case 'b':
        case 'c':
        case 'd':
          props.handleResponse(false);
          break;
      }
    },
    { isActive: props.question != null }
  );

  if (props.question == null) {
    return null;
  }

  const { question, correct_answer, incorrect_answers } = props.question;
  const answers = [correct_answer, ...incorrect_answers].map((v, i) => (
    <Text key={i}>
      {AnswerMap[i]}) {decodeHTML(v)}
    </Text>
  ));

  return (
    <>
      <Text>{decodeHTML(question)}</Text>
      {answers}
    </>
  );
}
