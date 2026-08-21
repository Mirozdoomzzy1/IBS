/* Supabase-only persistence adapter.
   Project data is never persisted to browser storage. */
window.IBSPersistence = (() => {
  const requireCloud = () => {
    if (typeof window.saveProjectToSupabase !== 'function') {
      throw new Error('Supabase persistence is required but is not available.');
    }
  };
  const save = async (patch) => {
    requireCloud();
    if (window.project && patch && typeof patch === 'object') Object.assign(window.project, patch);
    await window.saveProjectToSupabase();
    return window.project;
  };
  const setProject = (project) => save({project});
  const getProject = () => window.project || null;
  const setScreens = (screens) => save({screens});
  const getScreens = () => (window.project?.screens || []);
  const setERD = (erd) => save({erd});
  const getERD = () => window.project?.erd || null;
  const setBusinessLogic = (logic) => save({businessLogic: logic});
  const getBusinessLogic = () => window.project?.businessLogic || null;
  const setState = (state) => save(state);
  const getState = () => window.project || {};
  const load = getState;
  return {load, save, setProject, getProject, setScreens, getScreens,
          setERD, getERD, setBusinessLogic, getBusinessLogic, setState, getState};
})();
