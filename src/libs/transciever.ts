
import { Socket } from "net";
import { Pipe, ISink } from "plumbing-toolkit";
import { listen } from ".";


/**
 * Enables sending and receiving of ReadWriteStreams like Sockets
 */
export class Transciever extends Pipe<string> implements ISink<string> {
    protected socket: Socket;

    constructor(socket: Socket) {
        super(listen(socket));
        this.socket = socket;
    }

    public async throw(err: Error) {
        await this.return();
    }

    public async return() {
        this.socket.end();
        this.socket.destroy();
    }

    public async next(msg: string) {
        this.socket.write(msg);
    }
}
