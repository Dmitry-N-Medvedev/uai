export const readJson = (res, req, debuglog = null) => new Promise((resolve, reject) => {
  if (debuglog === null) {
    return reject(new ReferenceError('debuglog is undefined'));
  }

  res.onAborted(() => reject());

  let buffer = null;

  res.onData((ab, isLast = false) => {
    const chunk = Buffer.from(ab);

    debuglog(`readJson.onData: "${chunk.toString()}", isLast: ${isLast}`);

    if (isLast === true) {
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

        resolve(json);
      }
    } else if (buffer) {
      buffer = Buffer.concat([buffer, chunk]);
    } else {
      buffer = Buffer.concat([chunk]);
    }
  });

  return undefined;
});
