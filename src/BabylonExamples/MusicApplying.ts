import {
    Scene,
    Engine,
    SceneLoader,
    Vector3,
    HemisphericLight,
    FreeCamera,
    CannonJSPlugin,
    MeshBuilder,
    PhysicsImpostor,
    AbstractMesh,
    StandardMaterial,
    Color3,
    ActionManager,
    ExecuteCodeAction,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";
import * as Tone from 'tone';
import { Room } from "colyseus.js";
import { Client } from "colyseus.js";
import { Luncher } from "./luncher";

// import * as Tone from 'https://cdn.skypack.dev/toninspectorinspectore';

const ROOM_NAME = "my_room";
const ENDPOINT = "ws://localhost:2567";

export class MusicApplying {
    scene: Scene;
    engine: Engine;
    sphere: AbstractMesh;
    box: AbstractMesh;
    ground: AbstractMesh;
    synth: Tone.Synth | null;

    //colyseus variables
    // private room: Room<any>;
    private playerEntities: { [playerId: string]: AbstractMesh } = {};
    private playerNextPosition: { [playerId: string]: Vector3 } = {};
    private room: Room<any>
    
    constructor(private canvas: HTMLCanvasElement,room: Room<any>) {
        this.engine = new Engine(this.canvas, true);
        this.scene = this.CreateScene();
        this.room = room;

    }

    bootstrap(){
        this.CreateEnvironment();
        this.CreateController();
        this.createImpostors();
        this.detectTrigger();
        this.initPlayers();
        // Start the Tone.js context when a user action occurs

        this.canvas.addEventListener('click', () => {
            this.startAudioContext();
        });
        this.synth = null; // Initialize synth to null
        // this.startAudioContext().then(() => {
            this.engine.runRenderLoop(() => {
                this.scene.render();
            })
        // });
    }


    initPlayers(): void {
        this.room.state.players.onAdd((player, sessionId) => {

            const isCurrentPlayer = (sessionId === this.room.sessionId);

            const sphere = MeshBuilder.CreateSphere(`player-${sessionId}`, {
                segments: 8,
                diameter: 40
            }, this.scene);
            sphere.position = Vector3.Zero()
            // Set player mesh properties
            const sphereMaterial = new StandardMaterial(`playerMat-${sessionId}`, this.scene);
            sphereMaterial.emissiveColor = (isCurrentPlayer) ? Color3.FromHexString("#ff9900") : Color3.Gray();
            sphere.material = sphereMaterial;

            // Set player spawning position
            sphere.position.set(player.x, player.y, player.z);

            this.playerEntities[sessionId] = sphere;
            this.playerNextPosition[sessionId] = sphere.position.clone();

            // update local target position
            player.onChange(() => {
                this.playerNextPosition[sessionId].set(player.x, player.y, player.z);
            });
        });

        this.room.onMessage("playSound", () => {
            // Play the sound when instructed by the server
            this.playMelody();
        });

        this.room.state.players.onRemove((player, playerId) => {
            this.playerEntities[playerId].dispose();
            delete this.playerEntities[playerId];
            delete this.playerNextPosition[playerId];
        });

        this.room.onLeave(code => {
                // handle removed players
        })
    }

    ////////////////////////:::

    CreateScene(): Scene {

        const scene = new Scene(this.engine);
        // const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData("./environement/xmas_bg.env", this.scene);
        // envTex.gammaSpace = false;
        // envTex.rotationY = Math.PI;
        // scene.environmentTexture = envTex;
        // scene.createDefaultSkybox(envTex, true, 1000, 0.25);

        new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

        //block mouse
        // scene.onPointerDown = (evt) => {
        //     if (evt.button === 0) this.engine.enterPointerlock();
        //     if (evt.button === 1) this.engine.exitPointerlock();
        // };

        const framesPerSecond = 60;
        const gravity = -9.81;
        scene.gravity = new Vector3(0, gravity / framesPerSecond, 0);
        scene.collisionsEnabled = true;
        scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin(true, 10, CANNON));
        return scene;
    }

    


    createImpostors(): void {
        // this.box = MeshBuilder.CreateBox("box", { size: 2 }, this.scene);
        // this.box.position = new Vector3(0, 10, 2);
        // this.box.rotation = new Vector3(Math.PI / 4, 0, 0);
        // this.box.physicsImpostor = new PhysicsImpostor(this.box, PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 1 }, this.scene)
        this.ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, this.scene);
        this.ground.position.y = 0.25;
        this.ground.isVisible = false;
        this.ground.physicsImpostor = new PhysicsImpostor(this.ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 1 }, this.scene);
        this.sphere = MeshBuilder.CreateSphere("sphere", { diameter: 3 }, this.scene);
        this.sphere.position = new Vector3(0, 6, 0);
        this.sphere.physicsImpostor = new PhysicsImpostor(this.sphere, PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 1, friction: 1 }, this.scene);

        // this.sphere.physicsImpostor.registerOnPhysicsCollide([this.box.physicsImpostor,this.ground.physicsImpostor], this.detectCollision);
        // this.sphere.physicsImpostor.registerOnPhysicsCollide(this.ground.physicsImpostor, this.detectCollision);
        // this.sphere.physicsImpostor.unregisterOnPhysicsCollide(this.ground.physicsImpostor, this.detectCollision);
    }

    detectCollision(boxCollider: PhysicsImpostor, colliderAgainst: PhysicsImpostor): void {
        // boxCollider.object.scaling = new Vector3(3, 3, 3);
        // boxCollider.setScalingUpdated();
        const mat = new StandardMaterial("mat", this.scene);
        mat.diffuseColor = new Color3(1, 0, 0);
        (colliderAgainst.object as AbstractMesh).material = mat;
    }

    detectTrigger(): void {
        const box = MeshBuilder.CreateBox("box", { width: 4, height: 1, depth: 4 }, this.scene);
        box.position.y = 0.5;
        box.visibility = 0.25;
        box.actionManager = new ActionManager(this.scene);
        box.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPickTrigger,
                () => {
                    // this.playMelody();
                    this.room.send("boxClicked");

                }
            )
        );


    }

    async CreateEnvironment(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "prototype2.babylon",
            this.scene
        );
        meshes.forEach((mesh) => {
            mesh.checkCollisions = true;
            // mesh.isPickable = true;
        })
    }

    CreateController(): void {
        const camera = new FreeCamera("camera", new Vector3(0, 10, -20), this.scene);
        camera.attachControl(this.canvas, true);
        camera.applyGravity = true;
        camera.checkCollisions = true;
        camera.setTarget(Vector3.Zero());

        // body camera
        camera.ellipsoid = new Vector3(1, 1, 1);
        camera.speed = 0.5;

        camera.minZ = 0.40;

        camera.keysUp.push(90);
        camera.keysLeft.push(81);
        camera.keysDown.push(83);
        camera.keysRight.push(68);


    }


    // Tone.js melody setup
    async playMelody(): Promise<void> {
        // Stop the previous melody if it's playing
        // if (this.synth !== null) {
        //    await this.synth.triggerRelease();
        //    console.log(this.synth)
        // //    this.synth = null;
        // }

        // Start the audio context if not already started (required for Tone.js)
        // Tone.start();

        // Define your melody using Tone.js
        const newSound = new Tone.Synth().toDestination();

        // Play a middle 'C' for the duration of an 8th note
        newSound.triggerAttackRelease("C4", "8n");

        // Start the Tone.js Transport to play scheduled events
        Tone.Transport.start();
        this.synth = newSound;

    };



    // Method to start the audio context
    async startAudioContext(): Promise<void> {
        if (Tone.context.state === 'suspended') {
            await Tone.start();
        }
    }



}
