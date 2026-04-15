#!/usr/bin/env node
// Superpowers skill reminder hook — UserPromptSubmit
// Injects additionalContext telling Claude which skill to invoke based on the user's message.

let input = '';
process.stdin.on('data', chunk => (input += chunk));
process.stdin.on('end', () => {
  let message = '';
  try {
    const data = JSON.parse(input);
    message = (data.message || '').toLowerCase();
  } catch {
    process.exit(0);
  }

  const reminders = [];

  // brainstorming — new features
  if (/agregar|crear|nueva feature|implementar nueva|añadir|nuevo|quiero que|build|feature|funcionalidad/.test(message)) {
    reminders.push('🧠 BRAINSTORMING REQUIRED: Invoke the `brainstorming` skill BEFORE writing any code for this new feature.');
  }

  // systematic-debugging — bugs / errors
  if (/bug|error|no funciona|falla|arreglar|fix|crash|problema|issue|roto|broken|fail|fallo/.test(message)) {
    reminders.push('🔍 DEBUGGING REQUIRED: Invoke the `systematic-debugging` skill BEFORE proposing any fix. Find root cause first.');
  }

  // writing-plans — complex implementations
  if (/plan|planifica|refactor|migrar|redise|arquitectura|implementar|complex|multi.step|restructure/.test(message)) {
    reminders.push('📋 PLANNING REQUIRED: Invoke the `writing-plans` skill BEFORE coding. Produce a plan first.');
  }

  // test-driven-development
  if (/test|prueba|tdd|spec|testing|unit test|jest|vitest/.test(message)) {
    reminders.push('🧪 TDD REQUIRED: Invoke the `test-driven-development` skill. Write the failing test FIRST (Red), then make it pass (Green).');
  }

  // verification-before-completion
  if (/listo|termin|done|complet|finaliz|acabé|finish|ready/.test(message)) {
    reminders.push('✅ VERIFY FIRST: Invoke the `verification-before-completion` skill before declaring this task done.');
  }

  if (reminders.length === 0) process.exit(0);

  const context = [
    '--- SUPERPOWERS SKILL REMINDER ---',
    ...reminders,
    'Invoke the relevant skill(s) using the Skill tool BEFORE responding.',
    '----------------------------------',
  ].join('\n');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
    },
  }));
});
