import Alert from './Alert';

function AiStatusBanner({ aiConfigured }) {
  if (aiConfigured) return null;
  return (
    <div className="mb-4">
      <Alert>
        LLM feedback is off until you set a real AI_API_KEY in server/.env. Interviews still save. The app will not invent
        scores.
      </Alert>
    </div>
  );
}

export default AiStatusBanner;
