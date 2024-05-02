

import { Room } from "colyseus.js";
import { Client } from "colyseus.js";
import { MusicApplying } from "./MusicApplying";

// import * as Tone from 'https://cdn.skypack.dev/toninspectorinspectore';

const ROOM_NAME = "my_room";
const ENDPOINT = "ws://20.50.0.235:2567";



export class Luncher {

    private _colyseus: Client = new Client(ENDPOINT);
    musicApplying: MusicApplying;

    constructor(private canvas: HTMLCanvasElement) {
        this.startGame();
    }

    async startGame() {
        this.musicApplying = new MusicApplying(this.canvas, await this._colyseus.joinOrCreate(ROOM_NAME));
        this.musicApplying.bootstrap();
    }


}