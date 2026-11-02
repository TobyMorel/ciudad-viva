// Automatic deployment cleanup for the Ciudad Viva Vercel project.
const token = process.env.VERCEL_TOKEN;
const ids = (process.env.VERCEL_PROJECT_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
const teamId = process.env.VERCEL_TEAM_ID || '';
if (!token) {
  throw new Error('VERCEL_TOKEN secret is required to list and delete deployments.');
}
if (ids.length !== 1 || new Set(ids).size !== 1) {
  throw new Error('Configure exactly one VERCEL_PROJECT_IDS before running.');
}

const base = 'https://api.vercel.com';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function api(path, options = {}) {
  const url = new URL(path, base);
  if (teamId) url.searchParams.set('teamId', teamId);
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 429 || response.status >= 500) {
      if (attempt < 3) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const reset = Number(response.headers.get('x-ratelimit-reset'));
        const resetMs = reset > 1e12 ? reset : reset * 1000;
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Number.isFinite(reset) && resetMs > Date.now()
            ? resetMs - Date.now()
            : 1000 * 2 ** attempt;
        await sleep(Math.min(waitMs, 60_000) + Math.random() * 250);
        continue;
      }
    }
    if (!response.ok) {
      throw new Error(`Vercel API ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }
    return response.status === 204 ? null : response.json();
  }
}

async function listDeployments(projectId) {
  const deployments = [];
  let until;
  for (let page = 0; page < 100; page++) {
    const params = new URLSearchParams({ projectId, limit: '100' });
    if (until) params.set('until', String(until));
    const result = await api('/v6/deployments?' + params);
    const batch = result.deployments || [];
    deployments.push(...batch);
    if (!result.pagination?.next || !batch.length) return deployments;
    if (result.pagination.next === until) throw new Error('Pagination did not advance');
    until = result.pagination.next;
  }
  throw new Error('Too many pages: aborting without deletion for safety');
}

for (const projectId of ids) {
  try {
    const deployments = await listDeployments(projectId);
    const sorted = [...deployments].sort((a, b) => b.created - a.created);

    // Keep the three most recent deployments overall and the three most recent production deployments.
    const keep = new Set(sorted.slice(0, 3).map(deployment => deployment.uid));
    sorted.filter(deployment => deployment.target === 'production')
      .slice(0, 3)
      .forEach(deployment => keep.add(deployment.uid));

    // Preserve deployments that still own direct or branch aliases.
    for (const deployment of sorted) {
      if (deployment.alias?.length || deployment.aliasAssigned === true) keep.add(deployment.uid);
    }

    console.log(`Project ${projectId}: ${sorted.length} deployments, ${keep.size} locally protected`);
    const candidates = sorted.filter(deployment =>
      !keep.has(deployment.uid) && ['READY', 'ERROR', 'CANCELED'].includes(deployment.state || deployment.readyState)
    );
    let nextIndex = 0;
    let deletedCount = 0;
    const concurrency = Math.min(8, candidates.length);
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (nextIndex < candidates.length) {
        const deployment = candidates[nextIndex++];
        try {
          await api('/v13/deployments/' + encodeURIComponent(deployment.uid), { method: 'DELETE' });
          deletedCount++;
          console.log(`Deleted ${deployment.uid}`);
        } catch (error) {
          console.warn(`Skipped ${deployment.uid}: ${error.message}`);
        }
      }
    }));
    console.log(`Project ${projectId}: deleted ${deletedCount}/${candidates.length} eligible deployments`);
  } catch (error) {
    console.error(`Project ${projectId} aborted: ${error.message}`);
    process.exitCode = 1;
  }
}
