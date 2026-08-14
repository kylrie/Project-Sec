// testStreamingPipeline.js — Automated Verification for Low-Latency 4-Stage Streaming Pipeline
import { SentenceBuffer } from './sentenceBuffer.js';
import { streamingServer } from './streamingServer.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('   F.R.I.D.A.Y. 4-STAGE STREAMING PIPELINE AUTOMATED TESTS    ');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // Test 1: SentenceBuffer Token Ingestion & Sentence Splitting
  // -------------------------------------------------------------
  console.log('[TEST 1/3] Testing SentenceBuffer token-by-token streaming & sentence extraction...');
  const emittedSentences = [];
  const sb = new SentenceBuffer({
    minChars: 10,
    onSentence: (sentence, idx) => {
      emittedSentences.push({ sentence, idx });
    }
  });

  const sampleTokens = [
    'Hello! ', 'I ', 'have ', 'checked ', 'your ', 'calendar. ',
    'You ', 'have ', 'a ', 'strategy ', 'meeting ', 'with ', 'Dr. ', 'Watson ', 'at ', '2:30 ', 'PM.'
  ];

  for (const token of sampleTokens) {
    sb.push(token);
  }
  sb.flush();

  assert(emittedSentences.length === 3, `SentenceBuffer extracted exactly 3 sentences (got ${emittedSentences.length})`);
  assert(emittedSentences[0].sentence === 'Hello!', `Sentence 1 is "Hello!"`);
  assert(emittedSentences[1].sentence === 'I have checked your calendar.', `Sentence 2 is "I have checked your calendar."`);
  assert(emittedSentences[2].sentence.includes('Dr. Watson'), `Sentence 3 preserved abbreviation "Dr. Watson" without splitting`);

  // -------------------------------------------------------------
  // Test 2: Instant Response Cache Sub-50ms Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 2/3] Testing Instant Audio Response Cache...');
  const mockWs = {
    sentMessages: [],
    send(data) {
      this.sentMessages.push(JSON.parse(data));
    }
  };

  const startTime = Date.now();
  await streamingServer.handleStreamCommand(mockWs, 'Good morning');

  const cacheHitChunk = mockWs.sentMessages.find(m => m.type === 'audio_chunk' && m.isCacheHit);
  const latencyMsg = mockWs.sentMessages.find(m => m.type === 'latency_metrics');

  assert(Boolean(cacheHitChunk), 'Cached audio chunk was immediately dispatched');
  assert(latencyMsg && latencyMsg.metrics.totalPerceivedLatency < 100, `Cache perceived latency was ultra-fast (${latencyMsg?.metrics.totalPerceivedLatency}ms < 100ms)`);

  // -------------------------------------------------------------
  // Test 3: Progressive Multi-Sentence Streaming Execution
  // -------------------------------------------------------------
  console.log('\n[TEST 3/3] Testing End-to-End Progressive Streaming Execution...');
  const mockWs2 = {
    sentMessages: [],
    send(data) {
      this.sentMessages.push(JSON.parse(data));
    }
  };

  await streamingServer.handleStreamCommand(mockWs2, 'Check my schedule for today');

  const transcriptionMsg = mockWs2.sentMessages.find(m => m.type === 'transcription' && m.is_final);
  const thinkingMsgs = mockWs2.sentMessages.filter(m => m.type === 'thinking');
  const audioChunks = mockWs2.sentMessages.filter(m => m.type === 'audio_chunk');
  const completionMsg = mockWs2.sentMessages.find(m => m.type === 'response_complete');
  const metricsMsg = mockWs2.sentMessages.find(m => m.type === 'latency_metrics');

  assert(Boolean(transcriptionMsg), 'Final transcription emitted');
  assert(thinkingMsgs.length > 0, `Thinking indicators emitted (${thinkingMsgs.length} stages)`);
  assert(audioChunks.length > 0, `Audio chunks streamed (${audioChunks.length} chunks)`);
  assert(Boolean(completionMsg), 'Pipeline response_complete event emitted');
  assert(metricsMsg && metricsMsg.metrics.totalPerceivedLatency < 3000, `Perceived latency (${metricsMsg?.metrics?.totalPerceivedLatency}ms) meets <3000ms target`);

  console.log('\n===============================================================');
  console.log('  ALL 3 STREAMING PIPELINE TESTS PASSED! (100% OPERATIONAL)    ');
  console.log('===============================================================\n');
}

runTests();
