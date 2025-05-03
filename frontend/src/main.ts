import './style.css'
import { createBabylonScene } from './components/BabylonScene'

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (canvas) {
  createBabylonScene(canvas);
}
