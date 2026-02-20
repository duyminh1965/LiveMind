import { 
  createSession, 
  createUser,
  saveConversationTurn,
  endSession,
  getSessionsByUserId,
  updateUserApiKey
} from './repository';

// ==================== EXAMPLE USAGE IN YOUR LIVE COMPONENT ====================

/**
 * Example: Initialize user and session when component mounts
 */
async function initializeUserSession(userId: string, apiKey: string) {
  // 1. Create or update user
  const user = await createUser({
    id: userId,
    apiKey: apiKey,
    hasValidKey: true,
    email: 'user@example.com', // Optional
  });

  // 2. Create a new session
  const session = await createSession({
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId: user.id,
    status: 'CONNECTING',
    modelName: 'gemini-2.5-flash-native-audio-preview-12-2025',
    voiceName: 'Zephyr',
    isCameraEnabled: true,
    isMicEnabled: true,
    systemInstruction: 'You are LiveMind, a high-intelligence multimodal reasoning companion.',
  });

  return { user, session };
}

/**
 * Example: Save transcription when turn completes
 * This should be called when you receive `turnComplete` in your Live component
 */
async function handleTurnComplete(
  sessionId: string,
  userTranscription: string,
  modelTranscription: string
) {
  await saveConversationTurn(
    sessionId,
    userTranscription || null,
    modelTranscription || null
  );
}

/**
 * Example: End session when user disconnects
 * This should be called in your stopSession() callback
 */
async function handleStopSession(sessionId: string, hadError = false, errorMessage?: string) {
  await endSession(
    sessionId, 
    hadError ? 'ERROR' : 'IDLE',
    errorMessage
  );
}

/**
 * Example: Load previous sessions
 */
async function loadUserHistory(userId: string) {
  const sessions = await getSessionsByUserId(userId, 10);
  return sessions;
}

// ==================== INTEGRATION POINTS IN LIVE.TSX ====================

/**
 * In your Live component, you would modify it like this:
 */

/*
const Live = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('user_123'); // Get from auth
  
  // Modified startSession function
  const startSession = async () => {
    try {
      setStatus(SessionStatus.CONNECTING);
      setError(null);

      // 1. Initialize database session
      const { session } = await initializeUserSession(userId, apiKey);
      setCurrentSessionId(session.id);

      // ... rest of your existing code ...

      sessionPromiseRef.current = ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: async () => {
            setStatus(SessionStatus.ACTIVE);
            
            // Update session status in DB
            await updateSession(session.id, { status: 'ACTIVE' });
            
            // ... rest of your code ...
          },
          
          onmessage: async (message: LiveServerMessage) => {
            // ... existing transcription logic ...
            
            if (message.serverContent?.turnComplete) {
              // Save to database
              if (currentSessionId) {
                await handleTurnComplete(
                  currentSessionId,
                  currentInputTranscriptionRef.current,
                  currentOutputTranscriptionRef.current
                );
              }
              
              // ... rest of your code ...
            }
          },
          
          onerror: async (e: { message: string; }) => {
            console.error('Session Error:', e);
            
            // Save error to database
            if (currentSessionId) {
              await handleStopSession(currentSessionId, true, e.message);
            }
            
            // ... rest of your code ...
          },
          
          onclose: async () => {
            // Save session end
            if (currentSessionId) {
              await handleStopSession(currentSessionId);
            }
            
            setStatus(SessionStatus.IDLE);
          }
        },
        // ... rest of config ...
      });
    } catch (err: any) {
      console.error(err);
      
      // Save error
      if (currentSessionId) {
        await handleStopSession(currentSessionId, true, err.message);
      }
      
      setError(err.message || 'Failed to start session');
      setStatus(SessionStatus.IDLE);
    }
  };

  // Modified stopSession
  const stopSession = useCallback(async () => {
    // ... existing cleanup code ...
    
    // Save session end
    if (currentSessionId) {
      await handleStopSession(currentSessionId);
      setCurrentSessionId(null);
    }
    
    // ... rest of cleanup ...
  }, [currentSessionId]);

  return (
    // ... your existing JSX ...
  );
};
*/

// ==================== QUERYING SAVED DATA ====================

/**
 * Example: Display conversation history from previous session
 */
async function displayPreviousSession(sessionId: string) {
  const session = await getSessionById(sessionId);
  
  if (session) {
    console.log(`Session: ${session.id}`);
    console.log(`Started: ${session.startedAt}`);
    console.log(`Duration: ${session.totalDurationSeconds}s`);
    console.log(`Status: ${session.status}`);
    console.log('\nTranscript:');
    
    session.transcriptions.forEach((trans) => {
      const sender = trans.sender === 'user' ? 'You' : 'LiveMind';
      console.log(`[${sender}]: ${trans.text}`);
    });
  }
}

export {
  initializeUserSession,
  handleTurnComplete,
  handleStopSession,
  loadUserHistory,
  displayPreviousSession
};
