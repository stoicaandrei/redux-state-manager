import { useDispatch, useSelector as useReduxSelector } from 'react-redux';

import type { StateSelector } from './types';

const getSelectorHook = <State>() => {
  return <T>(selector: StateSelector<T, State>) => useReduxSelector(selector);
};

const getDispatchHook = () => {
  return useDispatch;
};

export { getDispatchHook, getSelectorHook };
