// Personality Service - Configurable AI personality for the assistant
import type { PersonalityConfig, DEFAULT_PERSONALITIES } from '../types';

// Current active personality
let activePersonality: PersonalityConfig = {
  name: 'Assistant',
  voiceTone: 'friendly',
  verbosity: 'balanced',
  formality: 'neutral',
  humor: false,
  encouragement: true,
  proactivity: 'balanced',
};

// Set the active personality
export const setPersonality = (personality: PersonalityConfig): void => {
  activePersonality = personality;
};

// Get the active personality
export const getPersonality = (): PersonalityConfig => {
  return activePersonality;
};

// Format a response based on personality
export const formatResponse = (
  baseResponse: string,
  context?: {
    isGreeting?: boolean;
    isNavigation?: boolean;
    isSafety?: boolean;
    isSignOff?: boolean;
  }
): string => {
  const p = activePersonality;
  let response = baseResponse;

  // Handle greeting
  if (context?.isGreeting && p.preferredGreeting) {
    response = `${p.preferredGreeting} ${response}`;
  }

  // Handle sign-off
  if (context?.isSignOff && p.signOffPhrase) {
    response = `${response} ${p.signOffPhrase}`;
  }

  // Adjust verbosity
  if (p.verbosity === 'minimal') {
    response = makeMinimal(response);
  } else if (p.verbosity === 'detailed') {
    response = makeDetailed(response, context);
  }

  // Add encouragement
  if (p.encouragement && shouldAddEncouragement(context)) {
    response = addEncouragement(response);
  }

  // Adjust formality
  response = adjustFormality(response, p.formality);

  return response;
};

// Make response minimal/concise
const makeMinimal = (response: string): string => {
  // Remove filler words and keep essential info
  const fillerPatterns = [
    /I can see that /gi,
    /It appears that /gi,
    /I notice that /gi,
    /There seems to be /gi,
    /It looks like /gi,
  ];

  let minimal = response;
  fillerPatterns.forEach(pattern => {
    minimal = minimal.replace(pattern, '');
  });

  // Shorten distance descriptions
  minimal = minimal
    .replace(/approximately /gi, 'about ')
    .replace(/You are currently /gi, '')
    .replace(/Continue walking /gi, 'Walk ');

  return minimal;
};

// Make response more detailed/descriptive
const makeDetailed = (
  response: string,
  context?: { isNavigation?: boolean; isSafety?: boolean }
): string => {
  let detailed = response;

  if (context?.isNavigation) {
    // Add helpful navigation context
    if (!detailed.includes('feet') && !detailed.includes('meters')) {
      detailed += ' Take your time and stay safe.';
    }
  }

  if (context?.isSafety) {
    // Add safety context
    detailed += ' Let me know if you need more details.';
  }

  return detailed;
};

// Adjust formality level
const adjustFormality = (
  response: string,
  formality: 'informal' | 'neutral' | 'formal'
): string => {
  if (formality === 'informal') {
    return response
      .replace(/You should /gi, "You'll want to ")
      .replace(/Please /gi, '')
      .replace(/I recommend /gi, 'Try ')
      .replace(/\.$/, '!')
      .replace(/You are approaching/gi, "You're coming up on");
  }

  if (formality === 'formal') {
    return response
      .replace(/you'll/gi, 'you will')
      .replace(/don't/gi, 'do not')
      .replace(/can't/gi, 'cannot')
      .replace(/Hey/gi, 'Hello');
  }

  return response;
};

// Determine if encouragement should be added
const shouldAddEncouragement = (
  context?: { isNavigation?: boolean; isSafety?: boolean }
): boolean => {
  // Don't add encouragement to every message - do it probabilistically
  // or based on context
  if (context?.isSafety) return true; // Always encourage on safety alerts
  return Math.random() > 0.7; // 30% chance otherwise
};

// Add encouraging phrases
const addEncouragement = (response: string): string => {
  const encouragements = [
    "You're doing great!",
    "Nice progress!",
    "Keep it up!",
    "You've got this!",
  ];

  const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  // Add to end of response
  if (!response.endsWith('.') && !response.endsWith('!') && !response.endsWith('?')) {
    response += '.';
  }

  return `${response} ${encouragement}`;
};

// Generate greeting based on personality and time
export const generateGreeting = (): string => {
  const p = activePersonality;
  const hour = new Date().getHours();

  let timeGreeting: string;
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }

  if (p.preferredGreeting) {
    return p.preferredGreeting;
  }

  switch (p.voiceTone) {
    case 'friendly':
      return `Hey there! ${timeGreeting}!`;
    case 'casual':
      return hour < 12 ? "Morning!" : "Hey!";
    case 'warm':
      return `${timeGreeting}! Great to have you here.`;
    case 'professional':
      return `${timeGreeting}. How may I assist you?`;
    case 'concise':
      return 'Ready.';
    default:
      return timeGreeting;
  }
};

// Generate context-aware proactive suggestions
export const generateProactiveSuggestion = (
  context: {
    idleTimeSeconds: number;
    hasDestination: boolean;
    recentObstacles: boolean;
    knownPersonNearby: boolean;
  }
): string | null => {
  const p = activePersonality;

  // Only proactive personalities generate suggestions
  if (p.proactivity === 'reactive') {
    return null;
  }

  // Balanced only suggests on important events
  if (p.proactivity === 'balanced') {
    if (context.knownPersonNearby) {
      return p.voiceTone === 'friendly'
        ? "Hey, looks like someone you know is nearby!"
        : "Someone you know is nearby.";
    }
    return null;
  }

  // Proactive - suggest based on various contexts
  if (context.idleTimeSeconds > 30 && context.hasDestination) {
    return formatResponse(
      "Would you like me to repeat the next direction?",
      { isNavigation: true }
    );
  }

  if (context.knownPersonNearby) {
    return formatResponse(
      "I see someone you know approaching. Want me to tell you who?",
      {}
    );
  }

  if (context.idleTimeSeconds > 60 && !context.hasDestination) {
    return formatResponse(
      "Everything okay? Tap to ask about your surroundings.",
      {}
    );
  }

  return null;
};

// Get personality description for display
export const getPersonalityDescription = (config: PersonalityConfig): string => {
  const parts: string[] = [];

  parts.push(`Tone: ${config.voiceTone}`);
  parts.push(`Verbosity: ${config.verbosity}`);

  if (config.humor) parts.push('Humorous');
  if (config.encouragement) parts.push('Encouraging');

  return parts.join(' • ');
};

// Build system prompt for AI based on personality
export const buildSystemPrompt = (): string => {
  const p = activePersonality;

  let prompt = `You are ${p.name}, an AI assistant for the iSpy Gadget helping a visually impaired user navigate and understand their surroundings.\n\n`;

  // Tone guidance
  prompt += `Communication style:\n`;
  prompt += `- Tone: ${p.voiceTone}\n`;
  prompt += `- Be ${p.verbosity === 'minimal' ? 'concise and direct' : p.verbosity === 'detailed' ? 'thorough and descriptive' : 'balanced in detail'}\n`;
  prompt += `- Formality: ${p.formality}\n`;

  if (p.humor) {
    prompt += `- Light humor is welcome when appropriate\n`;
  }

  if (p.encouragement) {
    prompt += `- Offer encouragement, especially during challenging situations\n`;
  }

  // Proactivity guidance
  if (p.proactivity === 'proactive') {
    prompt += `- Proactively share relevant information about surroundings\n`;
    prompt += `- Anticipate needs and offer suggestions\n`;
  } else if (p.proactivity === 'reactive') {
    prompt += `- Only respond to direct questions\n`;
    prompt += `- Keep responses focused on what was asked\n`;
  }

  // Safety priority
  prompt += `\nSafety is always the top priority. Alert about obstacles, stairs, and hazards immediately and clearly.\n`;

  // Custom additions
  if (p.customPrompt) {
    prompt += `\nAdditional instructions: ${p.customPrompt}\n`;
  }

  return prompt;
};
