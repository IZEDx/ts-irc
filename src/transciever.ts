import {IPipeable, IActor, dataEvent, NodeDataStream} from "./utils";

export default class Transciever implements IPipeable,IActor{
    protected socket : NodeDataStream;

    constructor(socket : NodeDataStream){
        this.socket = socket;
    }

    async tell(msg : string){
        this.socket.write(msg);
    }

    async shutdown(){
    }

    async pipe(target : IActor, then? : IActor){
        for await (let data of dataEvent(this.socket)){
            target.tell(data.toString(), then || this);
        }
    }
}