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
    Mesh,

} from "@babylonjs/core";
import "@babylonjs/loaders";
import * as CANNON from "cannon";
import * as Tone from 'tone';
import { Room } from "colyseus.js";

// import * as Tone from 'https://cdn.skypack.dev/toninspectorinspectore';

export default class MusicApplying2 {
    scene: Scene;
    engine: Engine;
    sphere: AbstractMesh;
    box: AbstractMesh;
    ground: AbstractMesh;
    synth: Tone.Synth | null;

    private canvas: HTMLCanvasElement;
    private room: Room<any>;
    private playerEntities: { [playerId: string]: Mesh } = {};
    private playerNextPosition: { [playerId: string]: Vector3 } = {};



    constructor(canvas: HTMLCanvasElement, engine: Engine, room: Room<any>) {
        this.canvas = canvas;
        this.engine = engine;
        this.room = room;



    }

    CreateScene(): Scene {

        // (...)

        // //
        // // Create the Colyseus Client.
        // //
        // var colyseusSDK = new Colyseus.Client("ws://localhost:2567");

        // //
        // // Connect with Colyseus server
        // //
        // colyseusSDK
        //   .joinOrCreate("my_room")
        //   .then(function (room) {
        //     console.log("Connected to roomId: " + room.roomId);
        //   })
        //   .catch(function (error) {
        //     console.log("Couldn't connect.");
        //   });

        // // (...)

        const scene = new Scene(this.engine);
        new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);

        scene.onPointerDown = (evt) => {
            if (evt.button === 0) this.engine.enterPointerlock();
            if (evt.button === 1) this.engine.exitPointerlock();
        };

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
                    this.playMelody();
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

    bootstrap(): void {
        // this.scene = new BABYLON.Scene(this.engine);
        // this.light = new BABYLON.HemisphericLight("pointLight", new BABYLON.Vector3(), this.scene);
        // this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, 1.0, 550, BABYLON.Vector3.Zero(), this.scene);
        // this.camera.setTarget(BABYLON.Vector3.Zero());

        // createSkyBox(this.scene);
        // this.createGround();
        // this.displayGameControls();
        // this.initPlayers();

        // this.scene.onPointerDown = (event, pointer) => {
        //     if (event.button == 0) {
        //         const targetPosition = pointer.pickedPoint.clone();

        //         // Position adjustments for the current play ground.
        //         targetPosition.y = -1;
        //         if (targetPosition.x > 245) targetPosition.x = 245;
        //         else if (targetPosition.x < -245) targetPosition.x = -245;
        //         if (targetPosition.z > 245) targetPosition.z = 245;
        //         else if (targetPosition.z < -245) targetPosition.z = -245;

        //         this.playerNextPosition[this.room.sessionId] = targetPosition;

        //         // Send position update to the server
        //         this.room.send("updatePosition", {
        //             x: targetPosition.x,
        //             y: targetPosition.y,
        //             z: targetPosition.z,
        //         });
        //     }
        // };

        this.scene = this.CreateScene();

        // createSkyBox(this.scene);
        // // this.createGround();
        // this.displayGameControls();
        // this.initPlayers();

        this.CreateEnvironment();
        this.CreateController();
        this.createImpostors();
        this.detectTrigger();
        // Start the Tone.js context when a user action occurs

        this.canvas.addEventListener('click', () => {
            this.startAudioContext();
        });
        this.synth = null; // Initialize synth to null
        // this.startAudioContext().then(() => {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        })

        this.doRender();
    }

    // private gotoMenu() {
    //     this.scene.dispose();
    //     const menu = new Menu('renderCanvas');
    //     menu.createMenu();
    // }

    private doRender(): void {
        // constantly lerp players
        this.scene.registerBeforeRender(() => {
            for (let sessionId in this.playerEntities) {
                const entity = this.playerEntities[sessionId];
                const targetPosition = this.playerNextPosition[sessionId];
                entity.position = Vector3.Lerp(entity.position, targetPosition, 0.05);
            }
        });

        // Run the render loop.
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // The canvas/window resize event handler.
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }




}
