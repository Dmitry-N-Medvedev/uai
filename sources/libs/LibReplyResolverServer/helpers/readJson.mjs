export const readJson = (res, req, debuglog = null) => new Promise((resolve, reject) => {
  if (debuglog === null) {
    throw new ReferenceError('debuglog is undefined');
  }

  res.onAborted(() => reject());

  let buffer;

  res.onData((ab, isLast) => {
    const chunk = Buffer.from(ab);

    if (isLast) {
      let json;

      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]));
        } catch (e) {
          reject(e);
        }

        resolve(json);
      } else {
        try {
          json = JSON.parse(chunk);
        } catch (e) {
          reject(e);
        }

        debuglog(json);

        resolve(json);
      }
    } else if (buffer) {
      buffer = Buffer.concat([buffer, chunk]);
    } else {
      buffer = Buffer.concat([chunk]);
    }
  });
});
