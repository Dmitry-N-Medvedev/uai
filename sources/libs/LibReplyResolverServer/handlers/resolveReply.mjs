import {
  readJson,
} from '../helpers/readJson.mjs';

const OK_STATUS = '200 OK';

export const resolveReply = async (res, req, libReplyResolver = null, logger = null) => {
  if (libReplyResolver === null) {
    throw new ReferenceError('libReplyResolver is undefined');
  }

  if (logger === null) {
    throw new ReferenceError('logger is undefined');
  }

  res.aborted = false;

  res.onAborted(() => {
    res.aborted = true;
  });

  const byIntent = await readJson(res, req, logger);

  logger({
    byIntent,
  });

  const reply = await libReplyResolver.resolveReply(byIntent) ?? null;

  logger({
    reply,
  });

  if (res.aborted === false) {
    res.writeStatus(OK_STATUS).end(JSON.stringify({
      reply,
    }));
  }

  return undefined;
};
