
//a promise must be in one of these three states.
//when a promise is in PENDING state it can transition to FULFILLED or REJECTED state
// when in FULFILLED state it cannot transition to any other state. and must have a value which must not change.
//when in REJECTED state it cannot transition to any other state, and must have a reason which must not change.
const state = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
}

const isThennable = (mayBePromise)=>mayBePromise&&typeof mayBePromise.then == 'function';

//promise is an eventual result of an asynchronous operation. 
//the primary way of interacting with a promise is using 'then' method which registers callbacks to reieve
//either  a value or a reason why promise cannot fulfilled. 
class PPromise {
    constructor(computation) {
        this._state = state.PENDING;
        this._value = undefined;
        this._reason = undefined;
        this._thenQueue = [];
        this._finallyQueue = [];
        if(typeof computation == 'function') {
            setTimeout(()=>{
                try {
                    computation(this._resolve.bind(this), this._reject.bind(this))
                } catch(ex) {
                    this._reject(ex);
                }
            })
        }
    }

    then(onFulfilled, onRejected) {
        const controlledPromise = new PPromise();

        this._thenQueue.push({ controlledPromise, onFulfilled, onRejected });

        if (this._state == state.FULFILLED) {
            this._propagateFulfilled();
        } else if(this._state == state.REJECTED){
            this._propagateRejected();
        }

        return controlledPromise;
    }

    catch(catchFn) {
        return this.then(undefined, catchFn);
    }

    finally(sideEffectFn) {
        if(this._state != state.PENDING){
            sideEffectFn();
            return this._state == state.FULFILLED?PPromise.resolve(this._value):PPromise.reject(this._reason);
        }
        const controlledPromise = new PPromise();
        this._finallyQueue.push({controlledPromise, sideEffectFn});
        return controlledPromise;
    }

    _propagateFulfilled() {
        this._thenQueue.forEach(({controlledPromise, onFulfilled})=>{
            if(typeof onFulfilled == 'function') {
                const valueOrPromise = onFulfilled(this._value);
                console.log(valueOrPromise)
                if(isThennable(valueOrPromise)) {
                    valueOrPromise.then(
                        value=>controlledPromise._resolve(value),
                        reason=>controlledPromise._reject(reason)
                    )
                } else {
                    controlledPromise._resolve(valueOrPromise)
                }
            } else {
                controlledPromise._resolve(this._value);
            }
        });

        this._finallyQueue.forEach(({controlledPromise, sideEffectFn})=>{
            sideEffectFn();
            controlledPromise._resolve(this._value);
        })

        this._thenQueue = [];
        this._finallyQueue = [];
    }

    _propagateRejected() {
        this._thenQueue.forEach(({controlledPromise, _ ,onRejected})=>{
            if(typeof onRejected == 'function') {
                const valueOrPromise = onRejected(this._reason);
                if(isThennable(valueOrPromise)) {
                    valueOrPromise.then(
                        value=>controlledPromise._resolve(value),
                        reason=>controlledPromise._reject(reason)
                    )
                } else {
                    controlledPromise._resolve(valueOrPromise)
                }
            } else {
                controlledPromise._reject(this._reason);
            }
        });

        this._finallyQueue.forEach(({controlledPromise, sideEffectFn})=>{
            sideEffectFn();
            controlledPromise._reject(this._value);
        });

        this._thenQueue = [];
        this._finallyQueue = [];
    }

    _resolve(value) {
        if (this._state == state.PENDING) {
            this._state = state.FULFILLED;
            this._value = value;
            this._propagateFulfilled();
        }
    }

    _reject(reason) {
        if (this._state == state.PENDING) {
            this._state = state.REJECTED;
            this._reason = reason;
            this._propagateRejected();
        }
    }
}

PPromise.resolve = (value)=>new PPromise((resolve)=>resolve(value));
PPromise.reject = (reason)=>new PPromise((_, reject)=>reject(reason))


const x = new PPromise((resolve, reject)=>{
    setTimeout(()=>{
        reject(2)
    }, 3000)
});
x.then((value)=>{
    console.log("value recieved: "+value);
})
.catch((reason)=>{console.log("reason recieved: "+ reason)})






