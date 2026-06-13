import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import initialData from '../data/initialData.js';

import {
  loadState,
  saveState,
} from '../../utils/storage.js';

const ElanContext = createContext(null);

export function ElanProvider({ children }) {
  const [state, setState] = useState(() => {
    return loadState() || initialData;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateModule = (
    moduleName,
    data
  ) => {
    setState((prev) => ({
      ...prev,
      [moduleName]: data,
    }));
  };

  const addItem = (
    moduleName,
    item
  ) => {
    setState((prev) => ({
      ...prev,
      [moduleName]: [
        ...(prev[moduleName] || []),
        item,
      ],
    }));
  };

  const removeItem = (
    moduleName,
    id
  ) => {
    setState((prev) => ({
      ...prev,
      [moduleName]: (
        prev[moduleName] || []
      ).filter((x) => x.id !== id),
    }));
  };

  const value = useMemo(
    () => ({
      state,
      setState,
      updateModule,
      addItem,
      removeItem,
    }),
    [state]
  );

  return (
    <ElanContext.Provider value={value}>
      {children}
    </ElanContext.Provider>
  );
}

export function useElan() {
  return useContext(ElanContext);
}