import {
  readJson,
} from '../helpers/readJson.mjs';

// FIXME: move it to a shared lib
const OK_STATUS = '200 OK';

export const resolveReply = async (res, req, libReplyResolver = null, debuglog = null) => {
  if (libReplyResolver === null) {
    throw new ReferenceError('libReplyResolver is undefined');
  }

  if (debuglog === null) {
    throw new ReferenceError('debuglog is undefined');
  }

  res.aborted = false;

  res.onAborted(() => {
    res.aborted = true;
  });

  const byIntent = await readJson(res, req, debuglog);

  debuglog({
    byIntent,
  });

  const reply = await libReplyResolver.resolveReply(byIntent) ?? null;

  debuglog({
    reply,
  });

  if (res.aborted === false) {
    res.writeStatus(OK_STATUS).end(JSON.stringify({
      reply,
    }));
  }

  return undefined;
};
