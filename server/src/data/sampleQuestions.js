const bank = {
  Technical: {
    'Frontend Developer': [
      { topic: 'JavaScript', prompt: 'Explain how closures work in JavaScript and when you would use one.' },
      { topic: 'React', prompt: 'How do you decide between useState, useReducer, and lifting state up in React?' },
      { topic: 'JavaScript', prompt: 'What is the difference between == and ===, and why does it matter in UI code?' },
      { topic: 'React', prompt: 'How would you prevent unnecessary re-renders in a React list view?' },
      { topic: 'System Design', prompt: 'How would you structure a frontend for a dashboard that loads slowly?' },
      { topic: 'JavaScript', prompt: 'Describe event bubbling and how you would stop an accidental double submit.' },
      { topic: 'React', prompt: 'How do you handle form validation before sending data to an API?' },
      { topic: 'JavaScript', prompt: 'What are promises and async/await, and how do you handle a failed fetch?' },
    ],
    'Backend Developer': [
      { topic: 'Node.js', prompt: 'How would you design a REST endpoint that creates a resource and handles duplicates?' },
      { topic: 'Databases', prompt: 'When would you use an index in MongoDB, and what is a risk of too many indexes?' },
      { topic: 'Node.js', prompt: 'How do you keep secrets such as database URIs out of source control?' },
      { topic: 'System Design', prompt: 'Explain how you would add authentication to an Express API.' },
      { topic: 'Databases', prompt: 'What is the difference between embedding and referencing documents in MongoDB?' },
      { topic: 'Node.js', prompt: 'How would you handle errors so a failed request does not crash the process?' },
      { topic: 'System Design', prompt: 'How would you rate-limit an API that calls an expensive third-party service?' },
      { topic: 'Databases', prompt: 'How do you paginate a large collection without skipping rows inefficiently?' },
    ],
    'MERN Stack Developer': [
      { topic: 'React', prompt: 'How would you connect a React form to an Express registration endpoint?' },
      { topic: 'Node.js', prompt: 'How do you protect an Express route so only the logged-in user can read their data?' },
      { topic: 'MongoDB', prompt: 'How would you model users and interviews so one student cannot read another student\'s sessions?' },
      { topic: 'JavaScript', prompt: 'Where should JWT verification happen, and why should the browser not score answers?' },
      { topic: 'React', prompt: 'How would you restore an in-progress interview after a page refresh?' },
      { topic: 'Node.js', prompt: 'Describe a clean folder structure for routes, controllers, models, and services.' },
      { topic: 'Databases', prompt: 'How would you store interview answers and later attach AI evaluations?' },
      { topic: 'System Design', prompt: 'How do the React client, Express server, and MongoDB share one interview session?' },
    ],
    'Java Developer': [
      { topic: 'Java', prompt: 'Explain the difference between an interface and an abstract class in Java.' },
      { topic: 'Java', prompt: 'How does garbage collection affect a long-running Java service?' },
      { topic: 'Data Structures', prompt: 'When would you use a HashMap instead of a TreeMap?' },
      { topic: 'Java', prompt: 'How would you handle checked exceptions in a REST controller?' },
      { topic: 'System Design', prompt: 'How would you make a Java API idempotent for a create request?' },
      { topic: 'Java', prompt: 'What is the purpose of synchronized, and when is it the wrong tool?' },
      { topic: 'Data Structures', prompt: 'How would you find duplicates in a large list efficiently?' },
      { topic: 'Java', prompt: 'Explain equals and hashCode and why they must stay consistent.' },
    ],
    'Python Developer': [
      { topic: 'Python', prompt: 'What is the difference between a list, a tuple, and a set in Python?' },
      { topic: 'Python', prompt: 'How do virtual environments help a Python project stay reproducible?' },
      { topic: 'Python', prompt: 'Explain list comprehensions and when a plain loop is clearer.' },
      { topic: 'Data Structures', prompt: 'How would you count word frequencies in a large text file?' },
      { topic: 'Python', prompt: 'What are *args and **kwargs, and when should you avoid them?' },
      { topic: 'Python', prompt: 'How do you handle exceptions without hiding bugs?' },
      { topic: 'System Design', prompt: 'How would you structure a Python service that calls an external HTTP API?' },
      { topic: 'Python', prompt: 'What is a generator, and why might you use one for large data?' },
    ],
    default: [
      { topic: 'General', prompt: 'Walk through how you would design a simple application for this role.' },
      { topic: 'General', prompt: 'How do you test a change before you consider it done?' },
      { topic: 'General', prompt: 'Describe how you debug a defect you cannot reproduce locally.' },
      { topic: 'General', prompt: 'How do you keep code readable when a deadline is close?' },
      { topic: 'General', prompt: 'What tradeoffs do you consider when choosing a library?' },
      { topic: 'General', prompt: 'How would you explain this role\'s main technical risk to a teammate?' },
      { topic: 'General', prompt: 'How do you document an API so another developer can use it safely?' },
      { topic: 'General', prompt: 'What would you monitor after deploying a new feature?' },
    ],
  },
  HR: {
    default: [
      { topic: 'Communication', prompt: 'Why are you interested in this role right now?' },
      { topic: 'Communication', prompt: 'How do you prefer to receive feedback from a manager?' },
      { topic: 'Communication', prompt: 'Describe a time you had to learn a tool quickly. What did you do first?' },
      { topic: 'Communication', prompt: 'How do you prioritize when every task feels urgent?' },
      { topic: 'Communication', prompt: 'What kind of team environment helps you do your best work?' },
      { topic: 'Communication', prompt: 'How do you handle a missed deadline?' },
      { topic: 'Communication', prompt: 'What do you want to learn in the next six months?' },
      { topic: 'Communication', prompt: 'How do you explain a technical delay to a non-technical stakeholder?' },
    ],
  },
  Behavioral: {
    default: [
      { topic: 'Communication', prompt: 'Tell me about a conflict with a teammate and how you resolved it.' },
      { topic: 'Communication', prompt: 'Describe a mistake you made in a project and what you changed afterward.' },
      { topic: 'Communication', prompt: 'Give an example of a time you asked for help. What happened next?' },
      { topic: 'Communication', prompt: 'Tell me about a time you disagreed with a requirement. How did you respond?' },
      { topic: 'Communication', prompt: 'Describe a situation where you had incomplete information but still had to deliver.' },
      { topic: 'Communication', prompt: 'Tell me about a time you improved a repetitive process.' },
      { topic: 'Communication', prompt: 'Describe how you onboarded yourself to an unfamiliar codebase.' },
      { topic: 'Communication', prompt: 'Give an example of receiving critical code review comments.' },
    ],
  },
  Mixed: {
    default: [
      { topic: 'General', prompt: 'How would you explain your current skill level for this role?' },
      { topic: 'General', prompt: 'Walk through a technical decision you made and the tradeoff you accepted.' },
      { topic: 'Communication', prompt: 'How do you communicate progress when you are blocked?' },
      { topic: 'General', prompt: 'What would you test first in a new feature for this stack?' },
      { topic: 'Communication', prompt: 'Describe a time you adapted after requirements changed.' },
      { topic: 'General', prompt: 'How do you decide what to build yourself versus reuse?' },
      { topic: 'Communication', prompt: 'How would you prepare for a pairing session with a senior engineer?' },
      { topic: 'General', prompt: 'What security or privacy issue would you watch for in this application?' },
    ],
  },
};

function pickSampleQuestions({ jobRole, interviewType, difficulty, questionCount, topics = [] }) {
  const typeBank = bank[interviewType] || bank.Mixed;
  const roleBank = typeBank[jobRole] || typeBank.default || bank.Mixed.default;
  const wantedTopics = new Set(topics.map((topic) => topic.toLowerCase()));

  const preferred = wantedTopics.size
    ? roleBank.filter((item) => wantedTopics.has(item.topic.toLowerCase()))
    : [];
  const pool = preferred.length ? [...preferred, ...roleBank] : roleBank;

  const prefix =
    difficulty === 'Beginner'
      ? 'For a beginner audience: '
      : difficulty === 'Advanced'
        ? 'Go deeper than a surface-level answer: '
        : '';

  return Array.from({ length: questionCount }, (_, index) => {
    const item = pool[index % pool.length];
    return {
      text: `${prefix}${item.prompt}`,
      topic: item.topic,
      source: 'sample',
      isFollowUp: false,
    };
  });
}

module.exports = { pickSampleQuestions };
