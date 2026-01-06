// src/pages/Game.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { submitScore, getGameLeaderboard, getGames } from "../services/api";
import "../styles/Game.css";
import useTextToSpeech from "../hooks/useTextToSpeech";

// -------------------- STATIC CONTENT -------------------- //

const OBJECTIVES = {
  1: [
    "Understand what a digital footprint is.",
    "Tell the difference between active and passive digital footprints.",
    "Recognize risks of oversharing online (photos, IDs, locations).",
    "Practice thinking before posting or installing apps.",
  ],
  2: [
    "Define personal information and why it is valuable.",
    "Identify different types of personal and sensitive information.",
    "Recognize how attackers exploit personal information.",
    "Apply best practices to protect data online.",
  ],
  3: [
    "Recognize strong passwords and passphrases.",
    "Understand why reusing passwords is dangerous.",
    "Spot scammy, rushed messages that try to steal passwords.",
  ],
  4: [
    "Understand public vs private accounts on social media.",
    "Recognize risky friend requests and DMs.",
    "Use privacy settings to control who can see and contact you.",
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

// Short “comic-style” lesson intro
const LESSON_INTRO = {
  1: {
    title: "My Digital Footprint",
    text: [
      "Every post, like, and app you use leaves a tiny trail behind you.",
      "Those trails can be saved, shared, or screenshotted—even if you delete them.",
      "Today’s quest: learn how to leave smart, safe footprints online.",
    ],
    quickTip: "Think before you post and ask a guardian if you’re unsure.",
  },
  2: {
    title: "Personal Information = Treasure",
    text: [
      "Your name, birthday, school, and passwords are like gold in a treasure chest.",
      "Scammers and hackers try tricks to get you to hand that treasure over.",
      "Your mission: spot which questions are safe and which are traps.",
    ],
    quickTip: "When in doubt, don’t share—ask a trusted adult first.",
  },
  3: {
    title: "Passwords & Passphrases",
    text: [
      "Passwords are the locks that guard your accounts and loot.",
      "Weak passwords are like paper doors—easy for attackers to break.",
      "We’ll build strong passphrases that are hard to guess but easy to remember.",
    ],
    quickTip: "Use long, unique passphrases instead of short, simple words.",
  },
  4: {
    title: "Social Media & Privacy",
    text: [
      "Your social media profile is like your own digital house.",
      "Public doors let anyone peek inside; private doors let you choose who visits.",
      "We’ll practice using privacy settings and friend requests wisely.",
    ],
    quickTip: "If you don’t know them in real life, you don’t have to let them in.",
  },
};

const STORYLINES = {
  1: "Help Alex clean up their digital footprints before a cyber villain uses them for a fake profile.",
  2: "Guard your treasure chest of personal information from sneaky data pirates.",
  3: "Forge unbreakable passphrases to lock every digital door in your account castle.",
  4: "Patrol your social media city and keep out suspicious friend requests and lurkers.",
};

// 🔹 Mini-game memory pairs per topic
const MINIGAME_DATA = {
    1: [
      {
        id: "id-photo",
        front: "Post school ID photo",
        back: "Reveals full name & school → identity theft risk",
      },
      {
        id: "live-location",
        front: "Share live location in story",
        back: "Strangers can track where you are",
      },
      {
        id: "old-posts",
        front: "Delete an old embarrassing post",
        back: "Might still exist in screenshots or backups",
      },
    ],
    2: [
      {
        id: "bank-details",
        front: "Type bank details in chat",
        back: "Can be used for fraud and stealing money",
      },
      {
        id: "password-share",
        front: "Tell password to a friend",
        back: "Friend or others can access your accounts",
      },
      {
        id: "public-birthday",
        front: "Public birthday on profile",
        back: "Used for password guesses and security questions",
      },
    ],
    3: [
      {
        id: "weak-password",
        front: "Use password123",
        back: "Easy for attackers to guess in seconds",
      },
      {
        id: "reuse-password",
        front: "Same password on all sites",
        back: "One leak opens ALL your accounts",
      },
      {
        id: "strong-passphrase",
        front: "Use T1ger!Rainbow!Tree",
        back: "Long, unique passphrase → much safer",
      },
    ],
    4: [
      {
        id: "public-profile",
        front: "Profile set to public",
        back: "Anyone (even strangers) can see your posts",
      },
      {
        id: "unknown-request",
        front: "Accept random friend request",
        back: "Lets strangers see your info & message you",
      },
      {
        id: "privacy-check",
        front: "Review privacy settings",
        back: "You control who can see and contact you",
      },
    ],
  };
  

// 🔹 Gamified LESSON CARDS per topic (game-type presentation of the lesson)
const LESSON_FLOW = {
  1: [
    {
      title: "Your Invisible Footprints",
      prompt:
        "Which action creates a digital footprint that might still exist even after you delete it?",
      choices: [
        {
          label: "Posting a selfie with your school logo online",
          correct: true,
          explanation:
            "Photos posted online can be saved, screenshotted, or shared by others, even if you delete the original.",
        },
        {
          label: "Talking to a friend at school in person",
          correct: false,
          explanation:
            "Face-to-face chats are not part of your *digital* footprint.",
        },
        {
          label: "Writing your thoughts in a paper notebook",
          correct: false,
          explanation:
            "Paper notes aren’t automatically uploaded to the internet.",
        },
      ],
    },
    {
      title: "Active vs Passive",
      prompt:
        "Which example shows a *passive* digital footprint (data collected automatically)?",
      choices: [
        {
          label: "Typing a comment on your friend’s video",
          correct: false,
          explanation:
            "Typing and posting is an intentional action—an active digital footprint.",
        },
        {
          label: "An app tracking your location while you play",
          correct: true,
          explanation:
            "Location tracking happens in the background. That’s a passive digital footprint.",
        },
        {
          label: "Posting a poll on your story",
          correct: false,
          explanation:
            "Choosing to post is also active—it’s something you do on purpose.",
        },
      ],
    },
    {
      title: "Why Footprints Matter",
      prompt:
        "Why do hackers and scammers care so much about your digital footprint?",
      choices: [
        {
          label: "They want to help you clean up old posts",
          correct: false,
          explanation:
            "Attackers aren’t online to help you—they want information they can exploit.",
        },
        {
          label:
            "They can use your info for identity theft or targeted scams",
          correct: true,
          explanation:
            "Details like birthday, school, and interests can be used for social engineering and phishing.",
        },
        {
          label: "They are bored and just scroll for fun",
          correct: false,
          explanation:
            "Real attackers are looking for valuable data, not just entertainment.",
        },
      ],
    },
    {
      title: "Cyber Sleuths",
      prompt:
        "A cybercriminal finds your birthday and school on social media. What could they do with that?",
      choices: [
        {
          label:
            "Guess your passwords or send fake emails that sound very real",
          correct: true,
          explanation:
            "This is OSINT: they combine small pieces of data to craft believable attacks.",
        },
        {
          label: "Make harmless memes about your school mascot",
          correct: false,
          explanation:
            "They’re more likely to use the information for attacks than jokes.",
        },
        {
          label: "Automatically improve your account’s security",
          correct: false,
          explanation:
            "Attackers do not protect your accounts—they try to break into them.",
        },
      ],
    },
    {
      title: "Manage Your Footprint",
      prompt: "Which habit BEST helps protect your digital footprint?",
      choices: [
        {
          label: "Posting your location in real time to show where you are",
          correct: false,
          explanation:
            "Live location can reveal where you are right now, which can be dangerous.",
        },
        {
          label: "Thinking before you post and limiting what you share",
          correct: true,
          explanation:
            "Pausing to think and sharing less personal info keeps your trail safer.",
        },
        {
          label: "Using the same password on all your accounts",
          correct: false,
          explanation:
            "Reusing passwords makes it easier for attackers if one site is hacked.",
        },
      ],
    },
    {
      title: "Key Takeaway",
      prompt: "Which statement about digital footprints is the MOST accurate?",
      choices: [
        {
          label: "Everything you delete online is gone forever",
          correct: false,
          explanation:
            "Deleted posts can still exist in backups, screenshots, or other people’s devices.",
        },
        {
          label: "Small actions online can have big consequences later",
          correct: true,
          explanation:
            "Even a single post can affect your privacy, reputation, or security.",
        },
        {
          label: "Only adults need to worry about digital footprints",
          correct: false,
          explanation:
            "Everyone who uses the internet has a footprint—kids and teens too.",
        },
      ],
    },
  ],

  2: [
    {
      title: "Treasure Chest Data",
      prompt:
        "Which of these is considered personal information that can identify you?",
      choices: [
        {
          label: "Your favorite movie genre",
          correct: false,
          explanation:
            "Likes and interests are less sensitive by themselves (but can still add up).",
        },
        {
          label: "Your full name and exact home address",
          correct: true,
          explanation:
            "Those directly identify who and where you are—very sensitive.",
        },
        {
          label: "Your favorite color and pet’s nickname only",
          correct: false,
          explanation:
            "On their own these are less risky, but can still be clues for password guesses.",
        },
      ],
    },
    {
      title: "Basic vs Sensitive",
      prompt:
        "Which piece of information is MOST sensitive and should NEVER be shared in chat?",
      choices: [
        {
          label: "Your school name and grade level",
          correct: false,
          explanation:
            "That’s important, but there is something even more sensitive here.",
        },
        {
          label: "Your government ID or banking details",
          correct: true,
          explanation:
            "These can be used for serious fraud and identity theft—never share them.",
        },
        {
          label: "Your favorite sports team",
          correct: false,
          explanation:
            "That’s more like a fun preference, not sensitive data.",
        },
      ],
    },
    {
      title: "Why Hackers Want Your Info",
      prompt:
        "How can attackers use small pieces of your personal information?",
      choices: [
        {
          label: "To send you thank-you messages for being online",
          correct: false,
          explanation:
            "Attackers aren’t thankful—they’re trying to abuse your data.",
        },
        {
          label:
            "To combine them into a profile for scams, identity theft, or account takeover",
          correct: true,
          explanation:
            "Even small details can be stitched together for powerful social engineering.",
        },
        {
          label: "To help you remember your passwords",
          correct: false,
          explanation:
            "They want to *steal* your passwords, not help you manage them.",
        },
      ],
    },
    {
      title: "Leaky Habits",
      prompt:
        "Which situation is MOST likely to expose your personal information?",
      choices: [
        {
          label: "Using strong, unique passwords on each website",
          correct: false,
          explanation:
            "That habit actually protects you instead of exposing you.",
        },
        {
          label: "Oversharing on social media and public profiles",
          correct: true,
          explanation:
            "Posting too many details publicly gives attackers more to work with.",
        },
        {
          label: "Asking a parent to check a suspicious link",
          correct: false,
          explanation:
            "That’s a safe move, not a risky one.",
        },
      ],
    },
    {
      title: "Smart Cyber Habits",
      prompt:
        "Which action is the BEST example of protecting your personal information?",
      choices: [
        {
          label: "Sharing your one-time code with a friend you trust",
          correct: false,
          explanation:
            "Codes and passwords should never be shared, even with friends.",
        },
        {
          label:
            "Using strong passwords and enabling multi-factor authentication (MFA)",
          correct: true,
          explanation:
            "MFA and strong passwords make it much harder for attackers to get in.",
        },
        {
          label: "Clicking every quiz and survey on social media",
          correct: false,
          explanation:
            "Many quizzes collect data or can be used for social engineering.",
        },
      ],
    },
    {
      title: "When in Doubt…",
      prompt:
        "Someone online asks for your birthday and exact location. You’re not sure if it’s okay. What’s the BEST move?",
      choices: [
        {
          label: "Share it quickly so they don’t get upset",
          correct: false,
          explanation:
            "Your safety is more important than anyone’s feelings online.",
        },
        {
          label: "Don’t share and ask a parent/guardian or teacher first",
          correct: true,
          explanation:
            "If you’re unsure, pause and ask a trusted adult. You control your data.",
        },
        {
          label: "Give them slightly wrong information to trick them",
          correct: false,
          explanation:
            "It’s better to avoid the conversation or block/report than play along.",
        },
      ],
    },
  ],

  3: [
    {
      title: "Build the Strongest Lock",
      prompt: "Which password is the strongest and hardest to guess?",
      choices: [
        {
          label: "password123",
          correct: false,
          explanation:
            "Very common and easy to guess—attackers try this first.",
        },
        {
          label: "T1ger!Rainbow!Tree",
          correct: true,
          explanation:
            "Long, unusual passphrases with numbers and symbols are much harder to crack.",
        },
        {
          label: "myname2024",
          correct: false,
          explanation:
            "Using your name and a simple year makes it easier to guess.",
        },
      ],
    },
    {
      title: "One Key for Every Door?",
      prompt:
        "What happens if you reuse the same password on many different websites?",
      choices: [
        {
          label: "It’s safer because it’s easy to remember",
          correct: false,
          explanation:
            "Easy to remember also means easy for attackers to reuse everywhere.",
        },
        {
          label:
            "If one site is hacked, attackers can get into all your other accounts",
          correct: true,
          explanation:
            "This is called a credential stuffing attack. One leak can unlock many accounts if you reuse passwords.",
        },
        {
          label: "Websites will block you for using the same password",
          correct: false,
          explanation:
            "Some warn you, but the real danger is attackers, not the site.",
        },
      ],
    },
    {
      title: "Rushed Messages",
      prompt:
        "A message says: 'Click this link in the next 2 minutes or your account will be deleted!' What should you do?",
      choices: [
        {
          label: "Click quickly so you don’t lose anything",
          correct: false,
          explanation:
            "That’s exactly what scammers want—fast clicks without thinking.",
        },
        {
          label: "Ignore it and log in through the official app or website",
          correct: true,
          explanation:
            "Go directly to the real app/website to check. Don’t trust the scary link.",
        },
        {
          label: "Send the link to your friends to warn them",
          correct: false,
          explanation:
            "Sharing the link spreads the scam. Report or delete it instead.",
        },
      ],
    },
  ],

  4: [
    {
      title: "Public or Private?",
      prompt:
        "What is a risk of changing your social media profile from private to public?",
      choices: [
        {
          label: "Only your close friends can see your posts",
          correct: false,
          explanation:
            "That’s what private mode does. Public mode does the opposite.",
        },
        {
          label: "More strangers can see your photos and personal details",
          correct: true,
          explanation:
            "Public profiles can be viewed by anyone, including people you don’t know.",
        },
        {
          label: "Your account becomes more secure",
          correct: false,
          explanation:
            "Public mode usually exposes more information, not less.",
        },
      ],
    },
    {
      title: "Friend or Fake?",
      prompt:
        "Someone you don’t know sends a friend request with no mutual friends. What’s the safest action?",
      choices: [
        {
          label: "Accept so you have more followers",
          correct: false,
          explanation:
            "Follower count isn’t worth the risk of letting strangers see your life.",
        },
        {
          label: "Ignore or decline the request",
          correct: true,
          explanation:
            "If you don’t know them, you don’t need to let them into your online space.",
        },
        {
          label: "Send them your phone number to check who they are",
          correct: false,
          explanation:
            "Sharing your number gives them even more ways to contact or scam you.",
        },
      ],
    },
    {
      title: "Tune Your Settings",
      prompt: "Which action helps you stay safer on social media?",
      choices: [
        {
          label: "Letting anyone tag you in posts",
          correct: false,
          explanation:
            "Tags can expose you to strangers and unwanted posts.",
        },
        {
          label: "Reviewing privacy settings with a trusted adult",
          correct: true,
          explanation:
            "Checking who can see, tag, or message you is a powerful safety step.",
        },
        {
          label: "Posting your location in real time",
          correct: false,
          explanation:
            "Live location can reveal where you are right now, which can be risky.",
        },
      ],
    },
  ],
};

const RANK_TIERS = [
  { threshold: 0, label: "Trainee" },
  { threshold: 20, label: "Rookie" },
  { threshold: 40, label: "Cyber Scout" },
  { threshold: 60, label: "Defender" },
  { threshold: 80, label: "Guardian" },
];

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

  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rankLabel, setRankLabel] = useState(RANK_TIERS[0].label);

  // lesson vs quiz mode
  const [mode, setMode] = useState("lesson");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonSelected, setLessonSelected] = useState(null);
  const [lessonRevealed, setLessonRevealed] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));

  const { speak, stop, speaking, supported } = useTextToSpeech();
  const [autoNarrate, setAutoNarrate] = useState(true);

  // ----- load game + questions ----- //
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

      // reset quiz state
      setCurrentIndex(0);
      setSelectedIndex(null);
      setScore(0);
      setFinished(false);
      setShowFeedback(false);
      setIsCorrect(false);
      setStreak(0);
      setBestStreak(0);

      // reset lesson state
      setMode("lesson");
      setLessonIndex(0);
      setLessonSelected(null);
      setLessonRevealed(false);
    };

    loadGame();
  }, [numericGameId]);

  // leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getGameLeaderboard(numericGameId);
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeaderboard();
  }, [numericGameId]);

  // ----- derived values & narration ----- //

  const currentQuestion = questions[currentIndex] || null;
  const quizPercent = questions.length
    ? Math.round((currentIndex / questions.length) * 100)
    : 0;
  const objectives = OBJECTIVES[numericGameId] || [];
  const reflections = REFLECTION_QUESTIONS[numericGameId] || [];
  const story = STORYLINES[numericGameId];

  const lessonSteps = LESSON_FLOW[numericGameId] || [];
  const currentLesson = lessonSteps[lessonIndex] || null;

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

  useEffect(() => {
    if (!autoNarrate || !currentQuestion || !narrationText) return;
    if (mode !== "quiz") return; // only auto-read in quiz mode
    speak(narrationText, { rate: 0.95, pitch: 1.05 });
    return () => {
      stop();
    };
  }, [autoNarrate, currentQuestion, narrationText, speak, stop, mode]);

  useEffect(() => {
    let label = RANK_TIERS[0].label;
    for (const tier of RANK_TIERS) {
      if (score >= tier.threshold) label = tier.label;
    }
    setRankLabel(label);
  }, [score]);

  // ----- LESSON handlers (game-type presentation of lessons) ----- //

  const handleLessonChoice = (idx) => {
    if (lessonRevealed) return;
    setLessonSelected(idx);
    setLessonRevealed(true);
  };

  const handleLessonNext = () => {
    if (!lessonRevealed) return;
    const next = lessonIndex + 1;
    if (next < lessonSteps.length) {
      setLessonIndex(next);
      setLessonSelected(null);
      setLessonRevealed(false);
    } else {
      // after finishing all lesson cards → switch to quiz mode
      setMode("quiz");
      setLessonIndex(0);
      setLessonSelected(null);
      setLessonRevealed(false);
    }
  };

  // ----- QUIZ handlers ----- //

  const refreshLeaderboard = async () => {
    try {
      const data = await getGameLeaderboard(numericGameId);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMainButton = async () => {
    if (selectedIndex === null) return;
    const question = questions[currentIndex];

    // first click: check answer
    if (!showFeedback) {
      const correct = selectedIndex === question.correctIndex;
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore((prev) => prev + 10);
        setStreak((prev) => {
          const newStreak = prev + 1;
          setBestStreak((best) => Math.max(best, newStreak));
          return newStreak;
        });
      } else {
        setStreak(0);
      }
      return;
    }

    // second click: next / finish
    const nextIndex = currentIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedIndex(null);
      setShowFeedback(false);
      setIsCorrect(false);
      return;
    }

    // finish quiz
    setFinished(true);
    setShowFeedback(false);

    try {
      await submitScore({
        user_id: userId,
        game_id: numericGameId,
        score,
      });
      await refreshLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  // ----- early return (after hooks) ----- //

  if (!questions.length || !currentQuestion) {
    return <p className="game-loading">Loading questions...</p>;
  }

  function MiniGame({ topicId }) {
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]); // indices of currently flipped
    const [matchedPairIds, setMatchedPairIds] = useState([]); // list of pair ids
    const [moves, setMoves] = useState(0);
    const [completed, setCompleted] = useState(false);
  
    // build & shuffle deck whenever topic changes
    useEffect(() => {
      const pairs = MINIGAME_DATA[topicId] || [];
      const deck = pairs.flatMap((pair) => [
        { uid: pair.id + "-a", pairId: pair.id, label: pair.front },
        { uid: pair.id + "-b", pairId: pair.id, label: pair.back },
      ]);
  
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setFlipped([]);
      setMatchedPairIds([]);
      setMoves(0);
      setCompleted(false);
    }, [topicId]);
  
    const handleFlip = (index) => {
      if (completed) return;
  
      // already matched? ignore
      const card = cards[index];
      if (!card) return;
      if (matchedPairIds.includes(card.pairId)) return;
  
      // already flipped? ignore
      if (flipped.includes(index)) return;
  
      // first flip
      if (flipped.length === 0) {
        setFlipped([index]);
        return;
      }
  
      // second flip
      if (flipped.length === 1) {
        const firstIndex = flipped[0];
        const firstCard = cards[firstIndex];
  
        const newFlipped = [firstIndex, index];
        setFlipped(newFlipped);
        setMoves((m) => m + 1);
  
        // check match after short delay so player can see both cards
        setTimeout(() => {
          if (!firstCard || !card) return;
  
          if (firstCard.pairId === card.pairId) {
            // found a match
            setMatchedPairIds((prev) => {
              const updated = [...prev, card.pairId];
              // all pairs matched?
              const totalPairs = MINIGAME_DATA[topicId]?.length || 0;
              if (updated.length === totalPairs && totalPairs > 0) {
                setCompleted(true);
              }
              return updated;
            });
            setFlipped([]);
          } else {
            // not a match → flip back
            setFlipped([]);
          }
        }, 700);
  
        return;
      }
    };
  
    const handleRestart = () => {
      const pairs = MINIGAME_DATA[topicId] || [];
      const deck = pairs.flatMap((pair) => [
        { uid: pair.id + "-a", pairId: pair.id, label: pair.front },
        { uid: pair.id + "-b", pairId: pair.id, label: pair.back },
      ]);
      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setFlipped([]);
      setMatchedPairIds([]);
      setMoves(0);
      setCompleted(false);
    };
  
    return (
      <div className="mini-game-wrapper">
        <div className="mini-game-hud">
          <div>
            <span className="mini-hud-label">Pairs matched:</span>{" "}
            <strong>{matchedPairIds.length}</strong> /{" "}
            {MINIGAME_DATA[topicId]?.length || 0}
          </div>
          <div>
            <span className="mini-hud-label">Moves:</span>{" "}
            <strong>{moves}</strong>
          </div>
          <button type="button" className="mini-restart-btn" onClick={handleRestart}>
            🔁 Shuffle cards
          </button>
        </div>
  
        <div className="mini-game-grid">
          {cards.map((card, index) => {
            const isFlipped =
              flipped.includes(index) || matchedPairIds.includes(card.pairId);
  
            return (
              <button
                key={card.uid}
                type="button"
                className={`mini-card ${isFlipped ? "flipped" : ""} ${
                  matchedPairIds.includes(card.pairId) ? "matched" : ""
                }`}
                onClick={() => handleFlip(index)}
              >
                <div className="mini-card-inner">
                  <div className="mini-card-front">?</div>
                  <div className="mini-card-back">{card.label}</div>
                </div>
              </button>
            );
          })}
        </div>
  
        {completed && (
          <div className="mini-complete-banner">
            🎉 Nice memory! You matched all the cyber safety pairs in {moves} moves.
          </div>
        )}
      </div>
    );
  }
  

  // -------------------- UI -------------------- //

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
          {/* Mode toggle: lesson vs quiz */}
          <div className="game-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "lesson" ? "active" : ""}`}
              onClick={() => setMode("lesson")}
            >
              📖 Story Lesson
            </button>
                      
            <button
              type="button"
              className={`mode-btn ${mode === "minigame" ? "active" : ""}`}
              onClick={() => setMode("minigame")}
            >
              🎮 Mini Game
            </button>
                      
            <button
              type="button"
              className={`mode-btn ${mode === "quiz" ? "active" : ""}`}
              onClick={() => setMode("quiz")}
            >
              🎯 Quiz Challenge
            </button>
          </div>


          {/* LESSON MODE: gamified lesson flow */}
          {mode === "lesson" && currentLesson && (
            <div className="lesson-wrapper">
              <div className="lesson-header">
                <span className="lesson-step">
                  Card {lessonIndex + 1} of {lessonSteps.length}
                </span>
                <h2 className="lesson-title">{currentLesson.title}</h2>
                <p className="lesson-prompt">{currentLesson.prompt}</p>
              </div>

              <div className="lesson-choices">
                {currentLesson.choices.map((choice, idx) => {
                  const isChosen = lessonSelected === idx;
                  const isCorrectChoice = choice.correct;
                  let extra = "";
                  if (lessonRevealed && isChosen && isCorrectChoice)
                    extra = "lesson-choice-correct";
                  else if (lessonRevealed && isChosen && !isCorrectChoice)
                    extra = "lesson-choice-incorrect";
                  else if (lessonRevealed && isCorrectChoice)
                    extra = "lesson-choice-right-answer";

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`lesson-choice-btn ${extra}`}
                      onClick={() => handleLessonChoice(idx)}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>

              {lessonRevealed && (
                <p className="lesson-feedback">
                  {
                    currentLesson.choices[lessonSelected]?.explanation ||
                    "Great thinking! Keep going."
                  }
                </p>
              )}

              <div className="lesson-footer">
                <button
                  type="button"
                  className="next-btn"
                  disabled={!lessonRevealed}
                  onClick={handleLessonNext}
                >
                  {lessonIndex === lessonSteps.length - 1
                    ? "Start the quiz"
                    : "Next card"}
                </button>
              </div>
            </div>
          )}

        {mode === "minigame" && (
          <MiniGame topicId={numericGameId} />
        )}


          {/* QUIZ MODE: game-style quiz presentation */}
          {mode === "quiz" && (
            <>
              {LESSON_INTRO[numericGameId] && (
                <div className="lesson-box">
                  <h2>📖 {LESSON_INTRO[numericGameId].title}</h2>
                  <ul>
                    {LESSON_INTRO[numericGameId].text.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                  <p className="lesson-tip">
                    {LESSON_INTRO[numericGameId].quickTip}
                  </p>
                </div>
              )}

              <div className="objectives-box">
                <h2>📘 Learning Goals</h2>
                <ul>
                  {objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>

              {story && (
                <div className="story-box">
                  <h2>📖 Your Mission</h2>
                  <p>{story}</p>
                </div>
              )}

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
            </>
          )}
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
