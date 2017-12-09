import {dataEvent} from "./utils";
import {IPipeable, IActor, IReadWriteStream} from "./interfaces";


interface Transciever<T extends IReadWriteStream>{
    tell(msg : string) : Promise<void>;
}
class Transciever<T extends IReadWriteStream> implements IPipeable,IActor{
    protected _shutdown = false;
    protected socket : T;

    constructor(socket : T){
        this.socket = socket;
    }

    async tell(msg : string){
        this.socket.write(msg);
    }

    async shutdown(){
        this._shutdown = true;
    }

    async pipe(target : IActor, then? : IActor){
        for await (let data of dataEvent(this.socket)){
            target.tell(data.toString(), then || this);
            if(this._shutdown) return;
        }
    }
}

export default Transciever;