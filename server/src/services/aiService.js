const { pickSampleQuestions } = require('../data/sampleQuestions');

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 25000);
const MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

function isAiConfigured() {
  const key = process.env.AI_API_KEY || '';
  return Boolean(key) && !key.includes('<') && !key.includes('your-openai-api-key');
}

function providerConfig() {
  return {
    provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL || '',
  };
}

function extractJson(text) {
  if (!text) {
    throw new Error('The model returned an empty response');
  }

  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{') === -1 ? raw.indexOf('[') : raw.indexOf('{');
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (start === -1 || end === -1) {
    throw new Error('The model response was not valid JSON');
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(10, Math.round(number * 10) / 10));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAiCompatible({ system, user }) {
  const { model, apiKey, baseUrl } = providerConfig();
  const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const error = new Error(errBody.error?.message || `AI provider error (${response.status})`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    return extractJson(content);
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini({ system, user }) {
  const { model, apiKey } = providerConfig();
  const selected = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selected}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const error = new Error(errBody.error?.message || `AI provider error (${response.status})`);
      error.status = response.status;
      throw error;
    }

    const payload = await response.json();
    const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n');
    return extractJson(content);
  } finally {
    clearTimeout(timer);
  }
}

async function callModel(system, user) {
  const { provider } = providerConfig();
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      if (provider === 'gemini') {
        return await callGemini({ system, user });
      }
      return await callOpenAiCompatible({ system, user });
    } catch (error) {
      lastError = error;
      const status = error.status || 0;
      const retryable = error.name === 'AbortError' || status === 429 || status >= 500;
      if (!retryable || attempt === MAX_RETRIES) {
        throw error;
      }
      await sleep(400 * 2 ** attempt);
    }
  }

  throw lastError;
}

const QUESTION_SYSTEM = `You generate mock interview questions for software students.
Return JSON only in this shape: {"questions":[{"text":"string","topic":"string"}]}.
Match the requested role, interview type, difficulty, and topics.
Do not include answers, scores, personality claims, or hiring recommendations.
Keep each question to one or two sentences.`;

const EVAL_SYSTEM = `You evaluate a student's written mock-interview answer for practice only.
Return JSON only in this shape:
{"correctness":0,"relevance":0,"completeness":0,"clarity":0,"strengths":["string"],"weaknesses":["string"],"mistakes":["string"],"missingConcepts":["string"],"improvementTips":["string"],"correctAnswer":"string","improvedAnswer":"string","feedback":"string","followUpQuestion":""}
Scores are numbers from 0 to 10.
correctAnswer is a concise model answer to the question.
mistakes are specific issues in the student's writing.
improvementTips are short, actionable next steps.
Judge the written answer only. Do not assess personality, confidence, culture fit, or hiring suitability.
Do not say whether the student should be hired.
followUpQuestion should be one extra question only when the answer is thin or misses a key idea; otherwise use an empty string.`;

function validateGeneratedQuestions(payload, count) {
  const items = Array.isArray(payload?.questions) ? payload.questions : [];
  const cleaned = items
    .map((item) => ({
      text: String(item?.text || '').trim(),
      topic: String(item?.topic || '').trim(),
    }))
    .filter((item) => item.text.length >= 10);

  if (cleaned.length < Math.min(count, 3)) {
    throw new Error('The model did not return enough valid questions');
  }

  return Array.from({ length: count }, (_, index) => {
    const item = cleaned[index % cleaned.length];
    return {
      text: item.text.slice(0, 2000),
      topic: item.topic.slice(0, 80),
      source: 'ai',
      isFollowUp: false,
    };
  });
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];
}

function validateEvaluation(payload) {
  const correctness = clampScore(payload?.correctness);
  const relevance = clampScore(payload?.relevance);
  const completeness = clampScore(payload?.completeness);
  const clarity = clampScore(payload?.clarity);

  return {
    correctness,
    relevance,
    completeness,
    clarity,
    overall: clampScore((correctness + relevance + completeness + clarity) / 4),
    strengths: cleanList(payload?.strengths),
    weaknesses: cleanList(payload?.weaknesses),
    mistakes: cleanList(payload?.mistakes),
    missingConcepts: cleanList(payload?.missingConcepts),
    improvementTips: cleanList(payload?.improvementTips),
    correctAnswer: String(payload?.correctAnswer || '').trim().slice(0, 4000),
    improvedAnswer: String(payload?.improvedAnswer || '').trim().slice(0, 4000),
    feedback: String(payload?.feedback || '').trim().slice(0, 2000),
    followUpQuestion: String(payload?.followUpQuestion || '').trim().slice(0, 2000),
  };
}

async function generateQuestions(input) {
  const sample = pickSampleQuestions(input);

  if (!isAiConfigured()) {
    return { source: 'sample', questions: sample, usedFallback: true };
  }

  const role = input.jobRole === 'Custom Role' ? input.customRole : input.jobRole;
  const topics = input.topics?.length ? input.topics.join(', ') : 'none specified';

  try {
    const payload = await callModel(
      QUESTION_SYSTEM,
      `Create ${input.questionCount} ${input.difficulty} ${input.interviewType} interview questions for a ${role} role. Optional topics: ${topics}.`
    );
    return {
      source: 'ai',
      questions: validateGeneratedQuestions(payload, input.questionCount),
      usedFallback: false,
    };
  } catch (error) {
    return { source: 'sample', questions: sample, usedFallback: true, fallbackReason: error.message };
  }
}

async function evaluateAnswer(input) {
  if (!isAiConfigured()) {
    return { evaluation: null, followUpQuestion: '', skipped: true };
  }

  const payload = await callModel(
    EVAL_SYSTEM,
    `Role: ${input.role}\nDifficulty: ${input.difficulty}\nQuestion: ${input.questionText}\nStudent answer: ${input.answerText}`
  );
  const evaluation = validateEvaluation(payload);
  const followUpQuestion = evaluation.followUpQuestion;
  delete evaluation.followUpQuestion;

  return {
    evaluation: {
      ...evaluation,
      provider: providerConfig().provider,
      model: providerConfig().model,
    },
    followUpQuestion,
    skipped: false,
  };
}

module.exports = {
  isAiConfigured,
  generateQuestions,
  evaluateAnswer,
};
