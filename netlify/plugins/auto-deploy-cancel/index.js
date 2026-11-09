// Netlify build plugin that cancels builds started by a Git push, while letting build hook and manual deploys through.

export const onPreBuild = async ({ constants, utils }) => {
  const { INCOMING_HOOK_TITLE, BUILD_ID, DEPLOY_ID, COMMIT_REF } = process.env;
  const log = (message) => console.log(`[auto-deploy-cancel] ${message}`);

  // Local build on your own machine
  if (constants.IS_LOCAL) {
    log('Local build detected. Proceeding with deployment...');
    return;
  }

  // Started by a build hook request
  if (INCOMING_HOOK_TITLE) {
    log(`Triggered by build hook event "${INCOMING_HOOK_TITLE}". Proceeding with deployment...`);
    return;
  }

  const options = {
    headers: { Authorization: `Bearer ${constants.NETLIFY_API_TOKEN}` },
    signal: AbortSignal.timeout(5000),
  };

  let build, deploy;
  try {
    [build, deploy] = await Promise.all([
      fetch(`https://api.netlify.com/api/v1/builds/${BUILD_ID}`, options),
      fetch(`https://api.netlify.com/api/v1/deploys/${DEPLOY_ID}`, options),
    ]).then((responses) => {
      for (const res of responses) {
        if (!res.ok) {
          const error = new Error('Unexpected HTTP status code');
          error.name = 'HTTPError';
          error.cause = { code: res.status };
          throw error;
        }
      }
      return Promise.all(responses.map((res) => res.json()));
    });
  } catch (error) {
    // Could not verify trigger
    const detail = error.cause?.code ? ` (${error.cause.code})` : '';
    log(`Netlify API request failed with ${error.name}${detail}. Proceeding with deployment...`);
    return;
  }

  // Netlify fills in these three fields when a Git push triggers the build.
  // For builds started from the Trigger deploy button, all three are null.
  const fieldsToCheck = [build?.sha, deploy?.committer, deploy?.title];
  const fieldsCount = fieldsToCheck.filter(Boolean).length;

  if (fieldsCount === 3) {
    // Started by a Git push event
    utils.build.cancelBuild(`Triggered by a Git push (${(COMMIT_REF ?? '').slice(0, 7)}). Canceling build...`);
  } else {
    // Manual deploy, or fields partly missing
    log(`Triggered by a manual or non-push event (${fieldsCount}/3 fields found). Proceeding with deployment...`);
  }
};
