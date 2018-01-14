
export const loadingMiddleware = () => ({ dispatch, getState }) => next => action => {
  const result = next(action);

  if (result instanceof Promise) {
    dispatch({ type: 'loading/changeState', shown: true });
    ((pro, _dispatch) => {
      pro.then(data => {
        _dispatch({ type: 'loading/changeState', shown: false });
        return data;
      }, reason => {
        _dispatch({ type: 'loading/changeState', shown: false });
        throw reason;
      });
    })(result, dispatch);
  }
  return result;
};
