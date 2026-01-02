// src/pages/Game.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitScore, getGameLeaderboard, getGames } from "../services/api";
import "../styles/Game.css";
import useTextToSpeech from "../hooks/useTextToSpeech";

// -------------------- CONTENT -------------------- //

const OBJECTIVES = {
  1: [
    "Understand what a digital footprint is.",
    "Tell the difference between active and passive digital footprints.",
    "Recognize risks of oversharing online (photos, IDs, locations).",
    "Practice thinking before posting or installing apps.",
  ],
  2: [
    "Identify examples of personal and sensitive information.",
    "Explain why sharing details like birthday and school can be risky.",
    "Decide when to ask a trusted adult before giving information.",
  ],
  3: [
    "Recognize strong passwords and passphrases.",
    "Understand why reusing passwords is dangerous.",
    "Practice checking suspicious links or messages before clicking.",
  ],
  4: [
    "Understand public vs private accounts on social media.",
    "Recognize risky friend requests and DMs.",
    "Learn how privacy settings help protect your information.",
  ],
};

const REFLECTION_QUESTIONS = {
  1: [
    "Have you ever posted something you later wanted to delete?",
    "Before your next post, what will you check first?",
  ],
  2: [
    "What personal information about you is already online?",
    "Who would you ask if you’re unsure about sharing something?",
  ],
  3: [
    "Are your current passwords strong and unique?",
    "What account will you secure first after this lesson?",
  ],
  4: [
    "Are your social media accounts public or private right now?",
    "Is there anyone in your friends list you don’t really know?",
  ],
};

// Each question also has an explanation (for feedback)
const QUESTION_BANK = {
  1: [
    {
      topic: "Digital Footprint",
      question:
        "A learner posts a photo of their school ID card on social media. What is the biggest risk?",
      options: [
        "Friends might react too much",
        "Personal details could be misused for identity theft",
        "The photo might be low quality",
        "The post disappears after 24 hours",
      ],
      correctIndex: 1,
      explanation:
        "The school ID shows personal details that strangers could use for identity theft. Reactions, quality, or disappearing stories are less serious than that risk.",
    },
    {
      topic: "Digital Footprint",
      question:
        "Someone installs a free game app that asks to access contacts, location, and microphone even though it doesn’t need them. What kind of footprint is this?",
      options: [
        "Only active digital footprint",
        "Only passive digital footprint",
        "Both active and passive digital footprint",
        "No digital footprint",
      ],
      correctIndex: 2,
      explanation:
        "Installing the app is an active choice, and the app collecting data in the background creates a passive footprint. So it’s both active and passive.",
    },
  ],
  2: [
    {
      topic: "Personal Information",
      question:
        "A message asks you to share your full name, birthday, and school to claim a prize. What should you do?",
      options: [
        "Share it if the prize looks cool",
        "Ask a parent/guardian or teacher first",
        "Share only your first name",
        "Ignore your parents’ advice",
      ],
      correctIndex: 1,
      explanation:
        "Full name, birthday, and school are personal details. You should always ask a trusted adult before sharing this kind of information online.",
    },
  ],
  3: [
    {
      topic: "Passwords & Passphrases",
      question: "Which password is the safest choice?",
      options: ["password123", "MyDog2024", "T1ger!Rainbow!Tree", "123456"],
      correctIndex: 2,
      explanation:
        "Passphrases that mix words, numbers, and symbols (like “T1ger!Rainbow!Tree”) are much harder to guess than short, common passwords.",
    },
    {
      topic: "Passwords & Passphrases",
      question:
        "Your friend sends you a link saying: 'Click here now to keep your account or it will be deleted.' What should you do?",
      options: [
        "Click quickly before time runs out",
        "Share the link with others",
        "Check with a trusted adult or the official website/app",
        "Reply with your password",
      ],
      correctIndex: 2,
      explanation:
        "Messages that try to scare or rush you are often scams. Always check with a trusted adult or the official app/website instead of clicking the link.",
    },
  ],
  4: [
    {
      topic: "Social Media & Privacy",
      question:
        "You change your profile from private to public so anyone can see your posts. What is the risk?",
      options: [
        "Only close friends see your posts",
        "More strangers can see your personal information",
        "Your account becomes more secure",
        "Nothing changes",
      ],
      correctIndex: 1,
      explanation:
        "A public profile means more strangers can see your photos and information, which can be risky if you overshare.",
    },
    {
      topic: "Social Media & Privacy",
      question:
        "Someone you don’t know sends a friend request and has no mutual friends. What is the safest action?",
      options: [
        "Accept so you have more followers",
        "Ask them for personal details",
        "Ignore or decline the request",
        "Send them your phone number",
      ],
      correctIndex: 2,
      explanation:
        "If you don’t know them and have no mutual friends, it’s safest to ignore or decline. You never need to share personal details or your number.",
    },
  ],
};

// -------------------- COMPONENT -------------------- //

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const numericGameId = Number(gameId);

  const [questions, setQuestions] = useState([]);
  const [gameTitle, setGameTitle] = useState("Cyber Safety Quiz");
  const [gameEmoji, setGameEmoji] = useState("🎮");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));

  // text-to-speech hook
  const { speak, stop, speaking, supported } = useTextToSpeech();
  const [autoNarrate, setAutoNarrate] = useState(true);

  useEffect(() => {
    const loadGame = async () => {
      const allGames = await getGames();
      const currentGame = allGames.find((g) => g.id === numericGameId);
      if (currentGame) {
        setGameTitle(currentGame.title);
        setGameEmoji(currentGame.emoji);
      }

      const qs = QUESTION_BANK[numericGameId] || [];
      setQuestions(qs);
    };

    loadGame();
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericGameId]);

  const fetchLeaderboard = async () => {
    try {
      const data = await getGameLeaderboard(numericGameId);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMainButton = async () => {
    if (selectedIndex === null) return;

    const currentQuestion = questions[currentIndex];

    // First click: check answer + show feedback
    if (!showFeedback) {
      const correct = selectedIndex === currentQuestion.correctIndex;
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore((prev) => prev + 10); // 10 pts per correct answer
      }
      return;
    }

    // Second click: next question or finish quiz
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedIndex(null);
      setShowFeedback(false);
      setIsCorrect(false);
      return;
    }

    // Finish quiz
    setFinished(true);
    setShowFeedback(false);

    try {
      await submitScore({
        user_id: userId,
        game_id: numericGameId,
        score,
      });
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  // ----- derived values & narration hooks (must be BEFORE any return) -----

  const currentQuestion = questions[currentIndex] || null;
  const quizPercent = questions.length
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;
  const objectives = OBJECTIVES[numericGameId] || [];
  const reflections = REFLECTION_QUESTIONS[numericGameId] || [];

  // build “story style” narration for this question
  const narrationText = useMemo(() => {
    if (!currentQuestion || !questions.length) return "";
    const baseIntro = `Cyber safety quiz. Topic: ${currentQuestion.topic}. Question ${
      currentIndex + 1
    } of ${questions.length}.`;
    const questionPart = currentQuestion.question;
    const optionsPart = currentQuestion.options
      .map((opt, idx) => `Option ${idx + 1}: ${opt}.`)
      .join(" ");
    return `${baseIntro} ${questionPart} Here are your choices. ${optionsPart}`;
  }, [currentQuestion, currentIndex, questions.length]);

  // auto-narrate whenever the question changes
  useEffect(() => {
    if (!autoNarrate || !currentQuestion || !narrationText) return;
    speak(narrationText, { rate: 0.95, pitch: 1.05 });
    return () => {
      stop();
    };
  }, [autoNarrate, currentQuestion, narrationText, speak, stop]);

  // ----- early return AFTER all hooks -----
  if (!questions.length) {
    return <p className="game-loading">Loading questions...</p>;
  }

  // ----- UI -----
  return (
    <div className="game-page">
      <header className="game-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>
        <div className="game-header-title">
          <span className="game-header-emoji">{gameEmoji}</span>
          <h1>{gameTitle}</h1>
        </div>
        <div className="game-score-badge">
          Score: <span>{score}</span>
        </div>
      </header>

      <main className="game-main">
        <section className="quiz-card">
          {/* Learning objectives */}
          <div className="objectives-box">
            <h2>📘 Learning Goals</h2>
            <ul>
              {objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Progress + narration controls */}
          <div className="quiz-top-row">
            <div className="quiz-progress">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${quizPercent}%` }}
                />
              </div>
            </div>

            {supported && (
              <div className="tts-controls">
                <button
                  type="button"
                  className={`tts-button ${speaking ? "speaking" : ""}`}
                  onClick={() =>
                    speaking
                      ? stop()
                      : speak(narrationText, { rate: 0.95, pitch: 1.05 })
                  }
                >
                  {speaking ? "⏹ Stop voice" : "🔊 Listen"}
                </button>

                <label className="tts-toggle">
                  <input
                    type="checkbox"
                    checked={autoNarrate}
                    onChange={(e) => setAutoNarrate(e.target.checked)}
                  />
                  <span>Auto-read questions</span>
                </label>
              </div>
            )}
          </div>

          <p className="quiz-topic">Topic: {currentQuestion.topic}</p>
          <p className="quiz-question">{currentQuestion.question}</p>

          <div className="quiz-options">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedIndex === idx;
              const isAnswer = currentQuestion.correctIndex === idx;

              let extraClass = "";
              if (showFeedback) {
                if (isSelected && isCorrect) extraClass = "correct";
                else if (isSelected && !isCorrect) extraClass = "incorrect";
                else if (isAnswer) extraClass = "answer";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !showFeedback && setSelectedIndex(idx)}
                  className={`quiz-option-btn ${
                    isSelected && !showFeedback ? "selected" : ""
                  } ${extraClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="quiz-footer">
            {showFeedback && (
              <>
                <p
                  className={`feedback-text ${
                    isCorrect ? "feedback-correct" : "feedback-incorrect"
                  }`}
                >
                  {isCorrect
                    ? "Nice! That’s correct 🎉"
                    : "Good try! Check the explanation below 💡"}
                </p>
                <p className="explanation-text">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
              </>
            )}

            {!finished && (
              <button
                className="next-btn"
                onClick={handleMainButton}
                disabled={selectedIndex === null}
              >
                {!showFeedback
                  ? "Check Answer"
                  : currentIndex === questions.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </button>
            )}

            {finished && (
              <div className="quiz-finished">
                <h2>Quiz Finished! 🎉</h2>
                <p>Your final score: {score}</p>

                {/* Reflection section */}
                {reflections.length > 0 && (
                  <div className="reflection-box">
                    <h3>🧠 Reflect</h3>
                    <ul>
                      {reflections.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  className="play-again-btn"
                  onClick={() => {
                    setCurrentIndex(0);
                    setScore(0);
                    setFinished(false);
                    setSelectedIndex(null);
                    setShowFeedback(false);
                    setIsCorrect(false);
                  }}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="leaderboard-card">
          <h2>🏆 Game Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="lb-empty">No scores yet. Be the first!</p>
          ) : (
            <ol>
              {leaderboard.map((entry, i) => (
                <li key={i}>
                  <span className="lb-rank">{i + 1}.</span>
                  <span className="lb-name">{entry.username}</span>
                  <span className="lb-score">{entry.score}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>
    </div>
  );
}
