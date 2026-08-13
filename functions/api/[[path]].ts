import {createSiteApi, type Env} from '../../server/site-api';

export const onRequest: PagesFunction<Env> = async ({request, env, waitUntil}) => {
  const cache =
    typeof caches === 'undefined' ? undefined : await caches.open('teti-site-network-v1');
  return createSiteApi({cache, waitUntil})(request, env);
};
