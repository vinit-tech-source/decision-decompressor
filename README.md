# Still

> One gentle thing, then it forgets you.

Still is a calm web application built for days when someone cannot plan. It takes a messy brain-dump and returns exactly one small, physical, reversible action that takes 10 minutes or less.

Still is not a to-do list, a project planner, or a streak tracker. It is a decision decompressor that stores nothing and forgets everything when you are done.

---

## What Still Refuses to Do

- **Plan.** It will never generate a multi-step roadmap.
- **List.** It never gives you a backlog of chores to worry about.
- **Remember.** It has no database, user accounts, or persistent storage for your thoughts.
- **Score.** No streaks, karma, gamification, or productivity badges.
- **Notify.** No push notifications, urgency badges, or reminders.
- **Sync.** Your text is not synced across devices or stored in the cloud.

---

## Execution Modes

Still can be run in two modes:

### 1. Hosted Mode (Gemini API with Gemma 4)
In Hosted Mode, your brain-dump is sent to Google's Gemini API server-side using Gemma 4 models (`gemma-4-26b-a4b-it` or `gemma-4-31b-it`). Still does not log or persist your text. Server logs record only the HTTP method, route, status code, and latency.

### 2. Local Mode (Ollama in your browser)
In Local Mode, everything runs directly on your machine. Your browser speaks directly to your local Ollama instance over HTTP:
```bash
# Allow your local Still origin to call Ollama
OLLAMA_ORIGINS="*" ollama serve

# Pull the lightweight Gemma 4 model
ollama pull gemma4:e2b
```
Nothing leaves your computer.

---

## Quickstart

### Development
```bash
# Install dependencies
npm install

# Run the dev server (Express backend + Vite client)
npm run dev
```

### Self Test Suite
Visit `/selftest` in your browser or run the unit tests directly via the terminal:
```bash
npx tsx --test src/shared/validator.test.ts
```

---

## Privacy Policy Summary

- **Hosted:** Your text is sent to Google's Gemini API (Gemma 4) to get one answer. Still doesn't store it. Google's API terms apply.
- **Local:** Running on your machine. Nothing leaves this device.
- **Safety:** Mentions of self-harm or acute distress halt before contacting any model, offering crisis hotlines immediately.

Still is not medical advice, counseling, or therapy.

---

## License

MIT License.
