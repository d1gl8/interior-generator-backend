const logClientAI = [
  {
    session: null,
    ip: null,
    timestamp: null,
    userAgent: null,
    image: {
      width: null,
      height: null,
      input: {
        // name: null,  // !@
        type: null,
        link: null,
      },
      output: {
        type: null,
        link: null,
      },
      crops: [
        {
          rgba: null,
          width: null,
          height: null,
          x: null,
          y: null,
        },
      ],
    },
  },
];

class log {
  constructor(
    sessionId = null,
    ip = null,
    timestamp = null,
    userAgent = null,
    input = null,
    error = null
  ) {
    this.sessionId = sessionId;
    this.ip = ip;
    this.timestamp = timestamp;
    this.userAgent = userAgent;
    this.input = input;
    this.error = error;
  }
}

module.exports = { log };
