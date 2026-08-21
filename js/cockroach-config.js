/* CockroachDB API endpoint.
   On Vercel, use the same deployment origin so preview/production URLs always work.
   On GitHub Pages, set window.COCKROACH_API_URL before this script if needed. */
(function(){
  const configured = String(window.COCKROACH_API_URL || '').trim().replace(/\/$/, '');
  const onVercel = /(^|\.)vercel\.app$/i.test(location.hostname);
  window.COCKROACH_API_URL = configured || (onVercel ? `${location.origin}/api` : 'https://ibsdesign.vercel.app/api');
})();
