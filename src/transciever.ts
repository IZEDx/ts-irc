import {dataEvent} from "./utils";
import {IPipeable, IActor, IReadWriteStream} from "./interfaces";

/**
 * Enables sending and receiving of ReadWriteStreams like Sockets
 */
class Transciever<T extends IReadWriteStream> implements IPipeable, IActor {
    protected _shutdown : boolean = false;
    protected socket : T;

    constructor(socket : T) {
        this.socket = socket;
    }

    public async tell(msg : string) {
        this.socket.write(msg);
    }

    public async shutdown() {
        this._shutdown = true;
    }

    public async pipe(target : IActor, then? : IActor) {
        for await (const data of dataEvent(this.socket)) {
            target.tell(data.toString(), then || this);
            if (this._shutdown) { return; }
        }
    }
}

export default Transciever;
