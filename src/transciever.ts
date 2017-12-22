import {listen} from "./utils";
import {ITransciever, IActor} from "./interfaces";
import {Socket} from "net";

/**
 * Enables sending and receiving of ReadWriteStreams like Sockets
 */
class Transciever implements ITransciever {
    protected _shutdown : boolean = false;
    protected socket : Socket;

    constructor(socket : Socket) {
        this.socket = socket;
    }

    public async tell(msg : string) {
        this.socket.write(msg);
    }

    public async shutdown() {
        this._shutdown = true;
        this.socket.end();
        this.socket.destroy();
    }

    public async pipe(target : IActor, then? : IActor) {
        for await (const data of listen<Buffer>(this.socket)) {
            if (this._shutdown) { return; }
            target.tell(data.toString(), then || this);
        }
    }
}

export default Transciever;
