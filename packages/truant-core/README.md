# truant-core

this projects provides some functions like code spliting, error handling, manage the global state base on redux-saga.

### project structure
truant based projects will be expected has the following structure:
```code
|
|-- routes : components response to a URL route, basically a UI "page".
|-- containers: components used to wrap others
|-- components: shared components
````
### component state
truant orgnize redux action, reducer to a single object called state. A state object could has following property:

1. managedSaga: is an object includs sagas will be managed by truant middleware. managedSaga must provide a namespace used as identifier for sagas. You can trigger managed sagas via aciton.type = "namespace/saganame". 
in the state file, you may have following managedSaga:
````code
managedSaga: {
    sagaNamespace: 'sample',
    * getRandom() {
      const payload = yield call(delayAction, getRandom);
      yield put({ type: SAMPLE_RANDOM, payload });
    }
}
````
if you want to trigger this saga in react component by dispatch action: 
````code
  dispatch({ type: 'sample/getRandom' });
````
truant middleware will provide a promise object for each managed saga in runtime so that enable developer to get feedback immdiutely in react component.
````code
    dispatch({ type: 'sample/increase', command: 'increase' }).then(data => {
      // get feedback from saga
      console.log(data);
    });
````
the resolve and reject method will be injected to managed saga so that you can control the status of promise object.
````code
    * increase(action, resolve, reject) {
      const num = yield select(selectNum);
      const change = yield delayAction(increase);
      yield put({ type: SAMPLE_INCREASE, payload: num + change });
      resolve && resolve(`finish ${num + change}`);
    },
````
2. topSaga: object includes sagas will be registered to saga middleware. For topsaga, developer is resposible for handleing saga monitoring and no promise object provided.
3. reducer: redux reducer
