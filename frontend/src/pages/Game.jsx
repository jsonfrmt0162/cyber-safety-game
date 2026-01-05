// src/pages/Game.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitScore, getGameLeaderboard, getGames } from "../services/api";
import "../styles/Game.css";
import useTextToSpeech from "../hooks/useTextToSpeech";

// -------------------- CONTENT -------------------- //

const OBJECTIVES = {
  1: [
    "Define what a digital footprint is.",
    "Tell the difference between active and passive digital footprints.",
    "Identify real-world cybersecurity risks from online footprints.",
    "Apply best practices to manage and protect your digital presence.",
  ],
  2: [
    "Define personal information and why it is valuable.",
    "Identify different types of personal information (basic vs sensitive).",
    "Recognize how attackers exploit personal information.",
    "Apply best practices to protect personal data online.",
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

const LESSON_INTRO = {
    1: {
      title: "Let’s Learn: My Digital Footprint",
      text: [
        "Everything you do online leaves tiny 'footprints' behind—just like walking on the beach.",
        "These footprints show where you've been, what you've liked, and what you've shared.",
        "Even if you delete something, it might still be saved, shared, or screenshotted.",
        "Ask yourself: 'Would I still be okay with this a year from now?' before you post.",
        "Make sure your online footprints are kind, positive, and something you'll be proud of.",
      ],
      quickTip:
        "Quick Tip: Think before posting online and ask a guardian if you’re unsure.",
    },
    2: {
      title: "Let’s Learn: What Is Personal Information?",
      text: [
        "Your personal information is like treasure in your own chest—special and valuable.",
        "Things like your name, birthday, address, school, and passwords are part of that treasure.",
        "Sneaky 'pirates' online (strangers or scammers) may try to trick you into giving it away.",
        "Only share personal information with people you trust, like a parent, guardian, or teacher.",
        "Once something is shared online, it can be hard to take back, so choose carefully.",
      ],
      quickTip:
        "Quick Tip: Keep your personal info safe—ask your parent or guardian before sharing anything online.",
    },
    3: {
        title: "Let’s Learn: Strong Passwords & Passphrases",
        text: [
          "Your password is like the key to your house—if someone gets it, they can get inside your accounts.",
          "Short, simple passwords like '123456' or 'password' are very easy for attackers to guess.",
          "Long passphrases with a mix of words, numbers, and symbols are much stronger.",
          "Reusing the same password on many apps is risky—if one is hacked, they all are.",
          "One smart habit can protect many accounts: strong, unique passwords for each important login.",
        ],
        quickTip:
          "Quick Tip: Use a long passphrase and never share your password or one-time code with anyone.",
      },
      4: {
        title: "Let’s Learn: Social Media & Privacy",
        text: [
          "Social media is like a giant stage—sometimes you’re talking to more people than you realize.",
          "Public accounts let almost anyone see your posts, photos, and profile details.",
          "Oversharing your location, school, or daily routine can help strangers learn too much about you.",
          "Strangers may send friendly messages or follow requests to get your trust first.",
          "Good privacy settings and careful choices help you stay connected and still stay safe.",
        ],
        quickTip:
          "Quick Tip: Keep accounts private when possible, and don’t accept requests from people you don’t really know.",
      },
  };
  
// NEW: little story / mission per topic
const TOPIC_STORIES = {
  1: "You are a Digital Detective helping classmates clean up their online trail. Every choice you make will either protect or leak their digital footprint.",
  2: "You’re the Info Guardian of your school. Your mission is to decide which details are safe to share and which should stay private.",
  3: "You’re building a shield around your accounts using strong passwords and smart choices about links and messages.",
  4: "You’re the Social Media Scout. Your choices decide who can see your posts and how safely you connect with others.",
};

// NEW: ranks based on score (for extra motivation)
const QUIZ_RANKS = [
  { threshold: 0, label: "New Explorer" },
  { threshold: 20, label: "Quick Learner" },
  { threshold: 40, label: "Cyber Defender" },
  { threshold: 60, label: "Safety Champion" },
];

function getQuizRank(score) {
  let current = QUIZ_RANKS[0].label;
  for (const r of QUIZ_RANKS) {
    if (score >= r.threshold) current = r.label;
  }
  return current;
}

// Each question also has an explanation (for feedback)
const QUESTION_BANK = {
    1: [
        {
          topic: "Digital Footprint",
          question:
            "Alex posts a photo of their new school ID on social media because they’re excited. What is the biggest cybersecurity risk?",
          options: [
            "Friends may like the post too much",
            "Personal information can be used for identity theft",
            "The photo quality is poor",
            "The post will disappear after 24 hours",
          ],
          correctIndex: 1,
          explanation:
            "The school ID shows personal details like name, school, and possibly ID number. Attackers can use this information for identity theft or social engineering.",
        },
        {
          topic: "Digital Footprint",
          question:
            "Sam downloads a free game app that asks for access to location, contacts, and microphone—even though the game doesn’t need them. What type of digital footprint is being created?",
          options: [
            "Active only",
            "Passive only",
            "Both active and passive",
            "No digital footprint",
          ],
          correctIndex: 2,
          explanation:
            "Installing the app is an active choice, and the extra data collected in the background creates a passive footprint. So it’s both active and passive.",
        },
        {
          topic: "Digital Footprint",
          question:
            "Taylor receives an email that says: “Hi Taylor, we noticed unusual activity on your account. Click here to confirm your birthday.” Why is this dangerous?",
          options: [
            "The email might be spam",
            "Sharing personal details can help attackers steal accounts",
            "Birthdays are not important",
            "Emails can’t be trusted at all",
          ],
          correctIndex: 1,
          explanation:
            "Attackers often ask for personal details like birthdays to reset passwords or break into accounts. This kind of email is a common phishing trick.",
        },
        {
          topic: "Digital Footprint",
          question:
            "Jordan sets their social media account to “Public” so more people can follow them. What is the cybersecurity impact?",
          options: [
            "Nothing changes",
            "Only friends can see posts",
            "More personal information is exposed to strangers",
            "The account becomes more secure",
          ],
          correctIndex: 2,
          explanation:
            "A public profile means more strangers can see your posts, photos, and bio. This exposes more of your digital footprint to people you don’t know.",
        },
        {
          topic: "Digital Footprint",
          question:
            "Chris deletes an old post that shared their home city and sports team. Which statement is most accurate?",
          options: [
            "The information is completely gone forever",
            "Deleted posts can still exist in screenshots or backups",
            "Hackers can’t see deleted content",
            "Only friends can access deleted posts",
          ],
          correctIndex: 1,
          explanation:
            "Even if you delete a post, it may still be saved in backups, screenshots, or archives. That’s why thinking before posting is so important.",
        },
        {
          topic: "Digital Footprint",
          question:
            "Jamie wants to reduce their digital footprint. Which action is the BEST choice?",
          options: [
            "Share less personal information online",
            "Accept all website cookies",
            "Use the same password everywhere",
            "Turn off privacy settings",
          ],
          correctIndex: 0,
          explanation:
            "Sharing less personal information online directly reduces your digital footprint. The other options actually increase your risk.",
        },
      ],
      2: [
        {
          topic: "Personal Information",
          question:
            "Maria posts a photo of her new sports jersey. The photo also shows her full name and school logo. What is the cybersecurity risk?",
          options: [
            "Her friends may copy her style",
            "Attackers can use the information to identify and target her",
            "The post will get fewer likes",
            "Nothing—this information is harmless",
          ],
          correctIndex: 1,
          explanation:
            "Her full name plus school logo can help attackers identify where she studies and who she is. That can be used for scams, social engineering, or tracking.",
        },
        {
          topic: "Personal Information",
          question:
            "A player in an online game asks Leo for his age and city so they can 'team up better.' What should Leo do?",
          options: [
            "Share the information to be polite",
            "Share only his age",
            "Refuse and keep personal information private",
            "Share fake information",
          ],
          correctIndex: 2,
          explanation:
            "Even simple details like age and city can be used to learn more about you. The safest choice is to keep that personal information private and not share it in game chats.",
        },
        {
          topic: "Personal Information",
          question:
            "Nina receives an email saying: 'We detected a problem with your account. Please reply with your password to fix it.' Why is this dangerous?",
          options: [
            "Emails are slow",
            "Real companies never ask for passwords",
            "The message has bad grammar",
            "Passwords are easy to remember",
          ],
          correctIndex: 1,
          explanation:
            "Legitimate companies will never ask you to send your password by email or message. This is a common trick to steal login details.",
        },
        {
          topic: "Personal Information",
          question:
            "A free flashlight app asks for access to contacts, photos, and location. What is the BEST action?",
          options: [
            "Allow all permissions",
            "Install it anyway—it’s free",
            "Deny unnecessary permissions or uninstall the app",
            "Share fewer photos",
          ],
          correctIndex: 2,
          explanation:
            "A simple flashlight app doesn’t need access to your contacts, photos, or location. Denying extra permissions or uninstalling protects your personal data.",
        },
        {
          topic: "Personal Information",
          question:
            "Ethan logs into his bank account using free public Wi-Fi at a café. What personal information is at risk?",
          options: [
            "His favorite food",
            "His device battery life",
            "Login credentials and financial information",
            "His username only",
          ],
          correctIndex: 2,
          explanation:
            "Using public Wi-Fi for banking can expose login details and financial information if the connection is not secure. That’s very risky for personal data.",
        },
        {
          topic: "Personal Information",
          question:
            "Bonus: True or False — Sharing personal information is safe as long as you trust the person asking.",
          options: ["True", "False", "Only with friends", "Only at school"],
          correctIndex: 1,
          explanation:
            "Even if you trust the person now, messages can be hacked, forwarded, or seen by others. Important personal and sensitive details should stay private.",
        },
      ],
      3: [
        {
          topic: "Passwords & Passphrases",
          question:
            "Liam uses the password 'gamer123' for his email, game accounts, and school portal. What is the main cybersecurity risk?",
          options: [
            "He will forget his password",
            "If one account is hacked, attackers can access all of them",
            "His friends will guess it and log in for fun",
            "The password is too long",
          ],
          correctIndex: 1,
          explanation:
            "Reusing the same password on many accounts means if one site is hacked or leaked, attackers can try that same password everywhere else.",
        },
        {
          topic: "Passwords & Passphrases",
          question:
            "Which of these is the strongest password or passphrase?",
          options: [
            "dragon123",
            "myname2008",
            "T!ger-Lemon_Sky-42",
            "abcdef",
          ],
          correctIndex: 2,
          explanation:
            "A strong passphrase is long and mixes words, numbers, and symbols. 'T!ger-Lemon_Sky-42' is much harder to guess or crack than the other options.",
        },
        {
          topic: "Passwords & Passphrases",
          question:
            "A message pops up saying: 'Your account will be deleted in 10 minutes! Click here and enter your password to keep it.' What is the safest response?",
          options: [
            "Click quickly and type your password before time runs out",
            "Ignore it and go to the official website or app to check",
            "Share the link with friends to warn them",
            "Reply to the message with your password",
          ],
          correctIndex: 1,
          explanation:
            "Messages that rush or scare you are often phishing. You should ignore the link and check using the official app or website instead.",
        },
        {
          topic: "Passwords & Passphrases",
          question:
            "Noah’s friend asks for his password so they can 'help play' a game on his account. What should Noah do?",
          options: [
            "Share it only with close friends",
            "Change it after sharing",
            "Refuse and keep his password private",
            "Write it on paper and give it back later",
          ],
          correctIndex: 2,
          explanation:
            "Passwords should never be shared, even with friends. Once someone else knows it, you lose control of your account and data.",
        },
        {
          topic: "Passwords & Passphrases",
          question:
            "A website sends Mia a one-time code (OTP) to log in. Then someone messages her pretending to be 'support' and asks for the code. What should she do?",
          options: [
            "Give them the code so they can fix her account",
            "Ask a friend if it’s okay to share the code",
            "Ignore the message and never share her one-time code",
            "Change her username instead",
          ],
          correctIndex: 2,
          explanation:
            "One-time codes are like temporary keys. Real support will never ask for them. Sharing the code lets attackers log in as if they were you.",
        },
      ],
      4: [
        {
          topic: "Social Media & Privacy",
          question:
            "Ava sets her social media account to public so anyone can see her posts and stories. What is the main cybersecurity risk?",
          options: [
            "Only her friends can see her posts",
            "More strangers can see her photos and personal information",
            "Her account will load slower",
            "Her battery will drain faster",
          ],
          correctIndex: 1,
          explanation:
            "A public profile allows strangers to see posts, photos, bio, and sometimes even comments or friends. That can expose a lot of personal information.",
        },
        {
          topic: "Social Media & Privacy",
          question:
            "Ben gets a friend request from someone he doesn’t know with no mutual friends. Their profile looks cool. What is the safest choice?",
          options: [
            "Accept to be friendly",
            "Message them and share personal details",
            "Ignore or decline the request",
            "Send them his phone number to chat",
          ],
          correctIndex: 2,
          explanation:
            "If you don’t know the person and have no mutual friends, it’s safest to ignore or decline the request. Strangers online may not be who they say they are.",
        },
        {
          topic: "Social Media & Privacy",
          question:
            "Chloe posts a live video showing the front of her house and street name while she is home alone. What is the risk?",
          options: [
            "Viewers will get bored",
            "People might copy her video style",
            "Strangers could learn where she lives and when she is alone",
            "Her friends will know her internet speed",
          ],
          correctIndex: 2,
          explanation:
            "Sharing your exact location or home details publicly can help strangers figure out where you live and your routine, which is a serious safety risk.",
        },
        {
          topic: "Social Media & Privacy",
          question:
            "A stranger sends a direct message saying: 'You won a prize! Send a screenshot of your ID or school card to claim it.' What should you do?",
          options: [
            "Send the ID so you don’t lose the prize",
            "Ask them if the prize is real",
            "Block or report the account and do not send anything",
            "Send a photo with some parts covered",
          ],
          correctIndex: 2,
          explanation:
            "No legitimate prize will ask for ID or school cards in a DM. This is a trick to collect personal information. Blocking or reporting is the safest action.",
        },
        {
          topic: "Social Media & Privacy",
          question:
            "Diego tags his friends and shares their full names and school name in every public post. Why can this be dangerous?",
          options: [
            "His friends will get more followers",
            "The posts will be harder to delete",
            "It makes it easier for strangers to find and contact them",
            "It uses more mobile data",
          ],
          correctIndex: 2,
          explanation:
            "Tagging friends with full names and school publicly gives strangers more information to look them up, message them, or try to scam them.",
        },
        {
          topic: "Social Media & Privacy",
          question:
            "Bonus: True or False — It’s always safe to share anything if your account is set to private.",
          options: ["True", "False", "Only with family", "Only if posts disappear"],
          correctIndex: 1, // False
          explanation:
            "Even on private accounts, screenshots and forwards can share your posts beyond your followers. Privacy settings help, but smart choices still matter.",
        },
      ],
};

// -------------------- COMPONENT -------------------- //

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const numericGameId = Number(gameId);

  const [questions, setQuestions] = useState([]);
  const [gameTitle, setGameTitle] = useState("Cyber Quest Quiz");
  const [gameEmoji, setGameEmoji] = useState("🎮");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // NEW: streak / best streak
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

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
        // combo / streak scoring
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak((prev) => Math.max(prev, newStreak));

        const base = 10;
        const bonus = Math.max(0, (newStreak - 1) * 5); // +5, +10, +15...
        setScore((prev) => prev + base + bonus);
      } else {
        // miss breaks streak
        setStreak(0);
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
  const story = TOPIC_STORIES[numericGameId] || "";
  const rankLabel = useMemo(() => getQuizRank(score), [score]);

  // build “story style” narration for this question
  const narrationText = useMemo(() => {
    if (!currentQuestion || !questions.length) return "";
    const baseIntro = `Cyber Quest quiz. Topic: ${currentQuestion.topic}. Question ${
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

        {/* NEW: rank + streak HUD */}
        <div className="game-meta">
          <div className="game-score-badge">
            Score: <span>{score}</span>
          </div>
          <div className="game-streak-badge">
            Streak: <span>{streak}</span>
            {bestStreak > 1 && (
              <span className="game-streak-best">Best: {bestStreak}</span>
            )}
          </div>
          <div className="game-rank-pill">Rank: {rankLabel}</div>
        </div>
      </header>

      <main className="game-main">
        <section className="quiz-card">
        {LESSON_INTRO[numericGameId] && (
          <div className="lesson-box">
            <h2>📖 {LESSON_INTRO[numericGameId].title}</h2>
            <ul>
              {LESSON_INTRO[numericGameId].text.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
            <p className="lesson-tip">{LESSON_INTRO[numericGameId].quickTip}</p>
          </div>
        )}
          {/* Learning objectives */}
          <div className="objectives-box">
            <h2>📘 Learning Goals</h2>
            <ul>
              {objectives.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* NEW: story / mission box */}
          {story && (
            <div className="story-box">
              <h2>📖 Your Mission</h2>
              <p>{story}</p>
            </div>
          )}

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
                    ? streak > 1
                      ? `Awesome! Correct + combo x${streak} 🔥`
                      : "Nice! That’s correct 🎉"
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
                <p>Final rank: {rankLabel}</p>

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
                    setStreak(0);
                    setBestStreak(0);
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
