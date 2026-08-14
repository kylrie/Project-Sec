// sentenceBuffer.js — High-Performance Sentence Buffer for Streaming LLM -> TTS Pipeline

const ABBREVIATIONS = new Set([
  'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'vs.', 'etc.',
  'i.e.', 'e.g.', 'approx.', 'dept.', 'est.', 'fig.', 'inc.', 'ltd.',
  'co.', 'corp.', 'jan.', 'feb.', 'mar.', 'apr.', 'aug.', 'sept.',
  'oct.', 'nov.', 'dec.', 'st.', 'ave.', 'rd.', 'blvd.', 'no.', 'vol.'
]);

export class SentenceBuffer {
  /**
   * @param {Object} options
   * @param {Function} options.onSentence - Callback invoked when a complete sentence is ready: (sentence, index) => void
   * @param {number} [options.minChars=12] - Minimum character length before a sentence can be flushed
   */
  constructor(options = {}) {
    this.onSentence = options.onSentence || (() => {});
    this.minChars = options.minChars !== undefined ? options.minChars : 12;
    this.buffer = '';
    this.sentenceIndex = 0;
    this.isFlushed = false;
  }

  /**
   * Push an incoming token from the streaming LLM into the buffer
   * @param {string} token 
   */
  push(token) {
    if (!token) return;
    this.buffer += token;
    this._processBuffer();
  }

  /**
   * Scan buffer for complete sentence boundaries and dispatch completed sentences
   */
  _processBuffer() {
    // Look for sentence terminators followed by whitespace or quote: . ! ? \n
    const regex = /([.!?\n]+)([\s"'’”\)]+|$)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(this.buffer)) !== null) {
      const matchEnd = match.index + match[0].length;
      const potentialSentence = this.buffer.slice(lastIndex, matchEnd).trim();

      // Allow short sentences if terminated with ! or ? (e.g. "Hello!", "Yes!"), otherwise apply minChars
      const isInterjection = /[!?]/.test(match[1]);
      if (potentialSentence.length < this.minChars && !isInterjection) {
        continue;
      }

      // Check for common abbreviations or decimal numbers (e.g. "Dr.", "2.5", "e.g.")
      const lastWord = potentialSentence.split(/\s+/).pop().toLowerCase();
      if (ABBREVIATIONS.has(lastWord) || /\d+\.\d*$/.test(potentialSentence)) {
        continue;
      }

      // Valid complete sentence found
      const cleanSentence = potentialSentence.replace(/\s+/g, ' ');
      this.sentenceIndex++;
      this.onSentence(cleanSentence, this.sentenceIndex);

      // Advance buffer past this sentence
      this.buffer = this.buffer.slice(matchEnd).trimStart();
      regex.lastIndex = 0; // Reset regex scan on modified buffer
      lastIndex = 0;
    }
  }

  /**
   * Flush any remaining content in the buffer as the final sentence
   * @returns {string|null} The final sentence dispatched, if any
   */
  flush() {
    const remaining = this.buffer.trim();
    if (remaining.length > 0) {
      this.sentenceIndex++;
      const cleanSentence = remaining.replace(/\s+/g, ' ');
      this.onSentence(cleanSentence, this.sentenceIndex);
      this.buffer = '';
      this.isFlushed = true;
      return cleanSentence;
    }
    this.isFlushed = true;
    return null;
  }

  /**
   * Reset buffer state for a new request
   */
  reset() {
    this.buffer = '';
    this.sentenceIndex = 0;
    this.isFlushed = false;
  }
}
