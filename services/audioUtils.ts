export const decode = (str: string): ArrayBuffer => {
  const binaryString = atob(str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const decodeAudioData = async (
  audioData: ArrayBuffer,
  audioContext: AudioContext,
  sampleRate: number,
  channels: number = 1
): Promise<AudioBuffer> => {
  // Create an empty buffer at the target sample rate
  // We assume the incoming data is raw PCM Int16
  const pcm16 = new Int16Array(audioData);
  const buffer = audioContext.createBuffer(channels, pcm16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Convert Int16 to Float32 for the browser to play
  for (let i = 0; i < pcm16.length; i++) {
    channelData[i] = pcm16[i] / 32768.0;
  }
  
  return buffer;
};

// Converts browser Float32 audio to the Base64 PCM format Gemini needs
export const float32ToBase64PCM = (inputData: Float32Array): string => {
  const pcmData = new Int16Array(inputData.length);
  for (let i = 0; i < inputData.length; i++) {
    // Clamp and scale
    const s = Math.max(-1, Math.min(1, inputData[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert buffer to binary string
  let binary = '';
  const bytes = new Uint8Array(pcmData.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
};

// Helper for the "blob" style interface if needed, but Base64 string is usually preferred for sockets
export const createPcmBlob = (inputData: Float32Array): { mimeType: string, data: string } => {
  const base64 = float32ToBase64PCM(inputData);
  return { 
    mimeType: "audio/pcm;rate=16000", 
    data: base64 
  };
};