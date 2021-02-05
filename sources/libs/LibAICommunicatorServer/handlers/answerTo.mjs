import got from 'got';
import {
  filterIntents,
} from '@dmitry-n-medvedev/libintentsfilter/filterIntents.mjs';
import {
  readJson,
} from '../helpers/readJson.mjs';

// FIXME: move it to a shared lib
const OK_STATUS = '200 OK';
let conf = null;
let log = null;

/**
 * the apiClient communicates exclusively with the AI API backend
 * @param prefixUrl
 * @param apiKey
 * @returns
 */
const apiClient = (prefixUrl = null, apiKey = null) => {
  log(`apiClient (prefixUrl = ${prefixUrl}, apiKey = ${apiKey})`);

  if (prefixUrl === null) {
    throw new ReferenceError('prefixUrl is undefined');
  }

  if (apiKey === null) {
    throw new ReferenceError('apiKey is undefined');
  }

  return got.extend({
    prefixUrl,
    method: 'POST',
    http2: true,
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: apiKey,
    },
  });
};

/**
 * replyClient communicates exclusively with the replyResolverServer
 * @param prefixUrl
 * @param apiKey
 * @returns
 */
const replyClient = (prefixUrl = null) => {
  log(`replyClient (prefixUrl = ${prefixUrl})`);

  if (prefixUrl === null) {
    throw new ReferenceError('prefixUrl is undefined');
  }

  return got.extend({
    prefixUrl,
    method: 'POST',
    http2: true,
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
};

let APIClient = null;
let ReplyClient = null;

const initClients = () => {
  log('.initClients', conf);

  if (APIClient === null) {
    APIClient = apiClient(conf.servers.prefixUrl, conf.apiKey);
  }

  if (ReplyClient === null) {
    ReplyClient = replyClient(`http://${conf.replyResolverServer.host}:${conf.replyResolverServer.port}`);
  }
};

const retrieveIntentsFromAI = async (client = null, message = null) => client.post({
  body: JSON.stringify(message),
});

const retrieveReply = async (client = null, message = null) => client.post(conf.replyResolverServer.path, {
  body: JSON.stringify(message),
});

export const configAnswerTo = (config = null, debuglog = null) => {
  conf = config;
  log = debuglog;

  initClients();
};

export const answerTo = async (res = null, req = null) => {
  log('.answerTo');

  res.aborted = false;

  res.onAborted(() => {
    res.aborted = true;
  });

  // const intents = await libAICommunicator.getIntents(humanSaid);

  //  * 1. read message from the body
  const { message } = await readJson(res, req, log);

  log({
    message,
  });
  //  * 2. post message to servers.prefixUrl/servers.paths.intents and receive an array of intentions
  const intents = await retrieveIntentsFromAI(APIClient, message);

  log({
    intents,
  });
  //  * 4. use LibIntentsFilter.filterIntents(intentions) to a single intents value
  const intent = filterIntents(intents);

  log({
    intent,
  });
  //  * 5. post the intents value to the replyResolverServer.host:replyResolverServer.port/replyResolverServer.path and wait for the reply
  const reply = await retrieveReply(ReplyClient, intent);

  log({
    reply,
  });
  //  * 7. send the message back to the client via res
  if (res.aborted === false) {
    res.writeStatus(OK_STATUS).end(reply);
  }
};
