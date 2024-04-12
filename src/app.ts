import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import { BasicScene } from "./BabylonExamples/helpers/BasicScene";
import { StandardMaterials } from "./BabylonExamples/helpers/StandardMaterials";
import Menu from "./BabylonExamples/helpers/Menu";
import { MusicApplying } from "./BabylonExamples/MusicApplying";
import { Luncher } from "./BabylonExamples/luncher";


const canvas = document.querySelector("canvas")!;
const luncher = new Luncher(canvas);
// const menu = new MusicApplying2(canvas);
// menu.createMenu();

class App {
    

}
