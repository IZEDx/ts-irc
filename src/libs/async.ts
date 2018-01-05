// Async Hacks
(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("asyncIterator");
export interface IAsyncIterable<T> {[Symbol.asyncIterator](): AsyncIterator<T>; }

/**
 * An IObservable exposes an observe() method that returns an Observable.
 */
export type ISubject<T, K> = IObserver<T> & {
    observe(): Observable<K>;
};

/**
 * An Observer can subscribe on an Observable,
 * after which its functions will be called by the Observable.
 */
export interface IObserver<T> {
    next(value: T): Promise<void>;
    error?(error: Error): Promise<void>;
    complete?(): Promise<void>;
}

/**
 * A Handler is an Observer that handles a value for a client.
 */
export interface IHandler<T, K> {
    handle(value: T, client: IObserver<K>): Promise<K>;
    error?(error: Error): Promise<void>;
    complete?(): Promise<void>;
}

/**
 * An AsyncOperator is a function that takes an AsyncIterable and returns an AsyncIterable.
 */
export type AsyncOperator<T, K = T> = (input: IAsyncIterable<T>, ...args: any[]) => IAsyncIterable<K>;

/**
 * An Observable produces an asynchronous stream of values once iterated over or subscribed on.
 * Observable methods operate on the asynchronous stream of values as they come by returning a new observable.
 * Using this it's possible to create an asynchronous operator chain.
 *
 * eg.
 *  const myObservable = Observable.for(0, 100, 10).map(i => i += 5);
 *
 *  myObservable.subscribe({next: console.log});
 *
 *  for await(const i of myObservable) {
 *      console.log(i);
 *  }
 */
export class Observable<T> {
    public [Symbol.asyncIterator]: () => AsyncIterator<T>;

    constructor(ai: IAsyncIterable<T>) {
        Object.assign(this, ai);
    }

    public static create<T>(creator: (observer: IObserver<T>) => void): Observable<T> {
        return new Observable(AsyncGenerators.create(creator));
    }

    public static interval(ms: number): Observable<number> {
        return new Observable(AsyncGenerators.interval(ms));
    }

    public static for(from: number, to?: number, step?: number): Observable<number> {
        return new Observable(AsyncGenerators.forLoop(from, to, step));
    }

    public static listen<T>(stream: NodeJS.ReadableStream): Observable<T> {
        return new Observable(AsyncGenerators.create(observer => {
            stream.on("error", err      => observer.error && observer.error(err));
            stream.on("close", hadError => observer.complete && observer.complete());
            stream.on("data",  data     => observer.next(data));
        }));
    }

    public do(fn: (value: T) => Promise<void>): Observable<T> {
        return this.forEach(fn);
    }

    public pipe(consumer: IObserver<T>): Promise<void> {
        return this.subscribe(consumer);
    }

    public forEach(fn: (value: T) => Promise<void>): Observable<T> {
        return new Observable(AsyncOperators.forEach(this, fn));
    }

    public async subscribe(consumer: IObserver<T>): Promise<void> {
        try {
            for await(const data of this) {
                consumer.next(data);
            }
        } catch (e) {
            if (consumer.error !== undefined) {
                consumer.error(e);
            }
        }

        if (consumer.complete !== undefined) {
            consumer.complete();
        }
    }

    public map<K>(fn: (value: T) => Promise<K>): Observable<K> {
        return new Observable(AsyncOperators.map(this, fn));
    }

    public filter(fn: (value: T) => Promise<boolean>): Observable<T> {
        return new Observable(AsyncOperators.filter(this, fn));
    }

    public flatMap<K>(fn: (value: T) => Observable<K>): Observable<K> {
        return new Observable(AsyncOperators.flatMap(this, fn));
    }

    public handle<K>(handler: IHandler<T, K>, client: IObserver<K>): Observable<K> {
        return new Observable(AsyncOperators.handle(this, handler, client));
    }
}

/**
 * Collection of asynchronous generator functions.
 */
export namespace AsyncGenerators {

    export async function* forLoop(from: number, to?: number, step?: number): IAsyncIterable<number> {
        for (let i = from; to === undefined || i < to; i += step || 1) {
            yield i;
        }
    }

    export function interval(ms: number): AsyncIterable<number> {
        return {
            [Symbol.asyncIterator]() {
                let waitingNext: null | ((data: IteratorResult<number>) => void);
                const queue: IteratorResult<number>[] = [];
                let i = 0;

                setInterval(
                    () => {
                        if (!waitingNext) {
                            queue.push({value: i, done: false});
                        } else {
                            waitingNext({value: i, done: false});
                            waitingNext = null;
                        }
                        i += 1;
                    },
                    ms
                );

                return {
                    next(): Promise<IteratorResult<number>> {
                        return new Promise<IteratorResult<number>>((resolve, reject) => {
                            if (queue.length === 0) {
                                return waitingNext = resolve;
                            }

                            resolve(queue[0]);
                            queue.splice(0, 1);
                        });
                    }
                };
            }
        };
    }

    export function create<T>(creator: (observer: IObserver<T>) => void): AsyncIterable<T> {
        return {
            [Symbol.asyncIterator]() {
                let waitingNext: null | ((data: IteratorResult<T>) => void);
                let waitingError: (err: Error) => void;
                const queue: IteratorResult<T>[] = [];

                creator({
                    async next(value: T) {
                        if (!waitingNext) {
                            queue.push({value, done: false});
                        } else {
                            waitingNext({value, done: false});
                            waitingNext = null;
                        }
                    },
                    // Any hack because TypeScript doesn't like IteratorResults with undefined values.
                    async complete() {
                        if (!waitingNext) {
                            queue.push({value: undefined, done: true} as any);
                        } else {
                            waitingNext({value: undefined, done: true} as any);
                            waitingNext = null;
                        }
                    },
                    async error(err: Error) {
                        if (waitingError) {
                            waitingError(err);
                        }
                    }
                });

                return {
                    next(): Promise<IteratorResult<T>> {
                        return new Promise<IteratorResult<T>>((resolve, reject) => {
                            waitingError = reject;
                            if (queue.length === 0) { return waitingNext = resolve; }

                            resolve(queue[0]);
                            queue.splice(0, 1);
                        });
                    }
                };
            }
        };
    }

    /**
     * Creates an AsyncIterable from a ReadableStream (eg. Socket, FileReader, etc.)
     * @param {IDataEvent<T>} stream
     * @returns {IAsyncIterable<T>}
     */
    export async function* listen<T>(stream: NodeJS.ReadableStream): IAsyncIterable<T> {
        let waitingResolve: null | ((data: T) => void);
        let waitingReject: (err: Error) => void;
        const buffered: T[] = [];
        let ended = false;

        stream.on("error", err => waitingReject && waitingReject(err));
        stream.on("close", hadError => {
            ended = !hadError;
            if (waitingReject) { waitingReject(new Error("Event closed")); }
        });
        stream.on("data",  data => {
            if (!waitingResolve) { return buffered.push(data); }
            waitingResolve(data);
            waitingResolve = null;
        });

        let error: Error|undefined;
        while (error === undefined) {
            try {
                yield await new Promise<T>((resolve, reject) => {
                    waitingReject = reject;
                    if (buffered.length === 0) { return waitingResolve = resolve; }

                    resolve(buffered[0]);
                    buffered.splice(0, 1);
                });
            } catch (err) {
                error = err;
            }
        }

        if (!ended) {
            throw error;
        }
    }
}

/**
 * Collection of asynchronous operator functions.
 */
export namespace AsyncOperators {

    /**
     * Returns an AsyncIterable that maps all values of another AsyncIterable using the given mapping function.
     * @param {IAsyncIterable<T>} input Input
     * @param {(value: T) => Promise<K>} fn Mapping function
     * @return {IAsyncIterable<K>} Output
     */
    export async function* map<T, K>(input: IAsyncIterable<T>, fn: (value: T) => Promise<K>): IAsyncIterable<K> {
        for await(const data of input) {
            yield await fn(data);
        }
    }

    export async function* split(input: IAsyncIterable<string>, seperator: string): IAsyncIterable<string> {
        for await(const data of input) {
            for (const msg of data.split(seperator)) {
                yield msg;
            }
        }
    }

    export async function* buffer(input: IAsyncIterable<string>, until: string): IAsyncIterable<string> {
        let buff = "";

        for await(const data of input) {
            buff += data;
            let idx = buff.indexOf(until);

            while (idx >= 0) {
                yield buff.substr(0, idx);
                buff = buff.substr(idx + until.length);
                idx = buff.indexOf(until);
            }
        }
    }

    export async function* filter<T>(input: IAsyncIterable<T>, fn: (value: T) => Promise<boolean>): IAsyncIterable<T> {
        for await(const data of input) {
            if (await fn(data)) {
                yield data;
            }
        }
    }

    export async function* forEach<T>(input: IAsyncIterable<T>, fn: (value: T) => Promise<void>): IAsyncIterable<T> {
        for await(const data of input) {
            await fn(data);
            yield data;
        }
    }

    export async function* flatMap<T, K>(input: IAsyncIterable<T>, fn: (value: T) => Observable<K>): IAsyncIterable<K> {
        for await(const data of input) {
            for await(const resultData of fn(data)) {
                yield resultData;
            }
        }
    }

    export async function* handle<T, K = T>(input: IAsyncIterable<T>, handler: IHandler<T, K>, client: IObserver<K>): IAsyncIterable<K> {
        for await(const value of input) {
            yield await handler.handle(value, client);
        }
    }
}
