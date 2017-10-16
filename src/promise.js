class DevPromise {
    constructor(executor) {
        if(typeof this !== 'object') throw new TypeError("Must be a new");
        if(typeof executor !== 'function') throw new TypeError ("Must be a function");
        this.state = 'pending';   //default state is pending, can be fulfilled, rejected
        this.value = undefined;    //value for fulfilled or rejected
        this._callbacks = [];     //array for callbacks
        this._settled = false;
        try {                                        //catches exceptions thrown from executor and turns them into reject
            executor(this._resolve.bind(this), this._reject.bind(this));
        }catch (e){
             this._reject(e)
        }
    }

    static resolve(value){
        if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
            throw TypeError('resolve should be static method');
        }
        if(value instanceof DevPromise) return value;           //if value is a promise return it
        return new this((resolve) => {
            resolve(value)
        });
    }

    static reject(error){
        if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
            throw TypeError('reject should be static method');
        }
        return new DevPromise((resolve, reject)=>{
            reject(error)
        });
    }

    _release(onSuccess, onFail){
    if(this.state === 'rejected'){
        if(typeof onFail === 'function'){
            onFail(this.value);
        }
        //else throw this.value;
    }else {
        if(typeof onSuccess === 'function'){
            onSuccess(this.value)
        }
    }
    }

    _resolve(value){
        if(this.state !== 'pending') return;
        this.state = 'fulfilled';
        if(value instanceof DevPromise){
            value.done(value=>this._settle(value), (error)=>{
                this.state = 'rejected';
                this._settle(error);
            })
              }else {
            this._settle(value);
        }
    }
   _reject(error){
        if(this.state !== "pending") return;
        this.state = 'rejected';
        this._settle(error);

    }

    _settle(value){
       this._settled = true;
       this.value = value;
       setTimeout(()=> {this._callbacks.forEach((data)=>{
            this._release(data.onSuccess, data.onFail)
        })})
    }

    done(onSuccess, onFail){
        if (this._settled) {
            setTimeout(() => this._release(onSuccess, onFail));
        } else {
            this._callbacks.push({ onSuccess, onFail });
        }
    }

   then(onSuccess, onFail){
       if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
           throw TypeError('reject is a static method');
       }
       return new DevPromise((resolve, reject)=> {
           this.done((value)=> {
               if (typeof onSuccess === 'function' || typeof onSuccess === 'object') {
                   try {
                       value = onSuccess(value);
                   } catch (e) {
                       reject(e);
                   }
               }
               resolve(value);
           }, function (value) {
               if (typeof onFail === 'function') {
                   try {
                       value = onFail(value);
                   } catch (e) {
                       reject(e);
                   }
                   resolve(value);
               } else {
                   reject(value);
               }
           });
       });
   }

    static all (promises) {
        if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
            throw TypeError('is invalid');
        }
        if(!Array.isArray(promises)) return new this ((res,rej) => rej(TypeError('arguments shall be array of promises')));
        const results = [];
        const merged = promises.reduce(
            (init, prItem) => init.then(() => prItem).then(res => results.push(res)),
            DevPromise.resolve(null));

        return merged.then(() => results);
    }

    static race(promises) {
        if ((this.constructor !== DevPromise) && (this !== DevPromise)) {
            throw TypeError('is invalid');
        }
        return new DevPromise((resolve, reject) => {
            promises.forEach(pr => pr.then(resolve, reject))
        });
    }


    catch(onFail){
    return this.then(null, onFail);
}
}



module.exports =  DevPromise // change to devPromise;


DevPromise.resolve("TEST").then(console.log);

Foo =() =>{
    return new DevPromise((res, rej)=>{
        const val = [100, 200, 300];
        setTimeout(()=> {
            res(val)
        }, 1000)
    })
}
Foo().then((res)=>(res.forEach((elem)=>console.log(elem))))
