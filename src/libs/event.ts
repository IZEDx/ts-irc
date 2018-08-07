import { Pipe, Operator, Pluck } from "plumbing-toolkit";

export interface Listener<T> {
    (event: T): any;
}

export interface Disposable {
    dispose(): void;
}

export interface ITypedEvent<T>
{
    on(listener: Listener<T>): Disposable;
    once(listener: Listener<T>): void;
    off(listener: Listener<T>): void;
    emit(event: T): void;
}

/** passes through events as they happen. You will not get events from before you start listening */
export class TypedEvent<T> extends Pipe<T> {
    private listeners: Listener<T>[] = [];
    private listenersOncer: Listener<T>[] = [];

    constructor()
    {
        super(sink => this.on(val => sink.next(val)));
    }

    on(listener: Listener<T>): Pluck
    {
        this.listeners.push(listener);
        return () => this.off(listener);
    }

    once(listener: Listener<T>): void
    {
        this.listenersOncer.push(listener);
    }

    off(listener: Listener<T>)
    {
        var callbackIndex = this.listeners.indexOf(listener);
        if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
    }

    emit(event: T)
    {
        /** Update any general listeners */
        this.listeners.forEach((listener) => listener(event));

        /** Clear the `once` queue */
        this.listenersOncer.forEach((listener) => listener(event));
        this.listenersOncer = [];
    }

    emitter(): Operator<T, T, Pluck>
    {
        return input => input.to(v => this.emit(v));
    }
}