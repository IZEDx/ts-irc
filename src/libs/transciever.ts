
import { Socket } from "net";
import { ISubject, Observable } from "./async";

/**
 * Enables sending and receiving of ReadWriteStreams like Sockets
 */
export class Transciever implements ISubject<string, string> {
    protected _shutdown: boolean = false;
    protected socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    public async error(err: Error) {
        await this.complete();
    }

    public async complete() {
        this._shutdown = true;
        this.socket.end();
        this.socket.destroy();
    }

    public async next(msg: string) {
        this.socket.write(msg);
    }

    public observe(): Observable<string> {
        return Observable.listen<Buffer>(this.socket).map(async b => b.toString());
    }
}
