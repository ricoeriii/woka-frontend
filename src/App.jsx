import { Suspense, useDeferredValue, useRef, useLayoutEffect } from 'react'
import { Canvas,useLoader } from '@react-three/fiber'
import { OrbitControls, Center } from '@react-three/drei'
import { useControls } from 'leva'
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import tunnel from 'tunnel-rat'
import { LinearToneMapping } from 'three';

const status = tunnel()

const MODELS = {
  Hand: '/models/hand.obj',
  Arm: '/models/arm.obj',
  Foot: '/models/feet.obj',
  Protohand: '/models/protohand.obj'
}

export default function App() {
  const { model } = useControls({ model: { value: 'Hand', options: Object.keys(MODELS) } })
  const { color } = useControls({ color: "#e5c298" });
  const x = useControls({ x: 1 })
  const y = useControls({ y: 1 })
  const z = useControls({ z: 1 })
  const ScaleXYZ = [x.x, y.y, z.z]

  const Scene = ({ url, color, ...props }) => {
    const deferred = useDeferredValue(url)
    const obj = useLoader(OBJLoader, deferred);
    useLayoutEffect(() => {
      obj.traverse(child => {
        if (child.isMesh) {
          child.material.color.set(color)
        }
      })
    }, [color])
  
    return (
      <Center back precise>
        <primitive object={obj} {...props} />
      </Center>
    );
  };

  const canvasRef = useRef(null);

  const link = document.createElement("a");
  link.style.display = "none";
  document.body.appendChild(link);

  function save(blob, filename) {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  function saveString(text, filename) {
    save(new Blob([text], { type: "text/plain" }), filename);
  }

  const handleExportGLTF = () => {
    const exporter = new GLTFExporter();
    exporter.parse(canvasRef.current, function (gltfJson) {
      const jsonString = JSON.stringify(gltfJson);
      const blob = new Blob([jsonString], { type: "application/json" });
      saveString(blob, `${model}_${Date.now()}.gltf`);
      console.log("Download requested");
    }, { binary: true});
  };
  const handleExportOBJ = () => {
    const exporter = new OBJExporter();
    const result = exporter.parse(canvasRef.current);
    console.log(result)
    saveString(result, `${model}_${Date.now()}.obj`);
  };

  return (
    <>
    <div className="card   w-3/5 h-5/6 shadow-xl flex-auto relative top-10 text-center bg-slate-300">
      <figure className='h-full'>
        <Canvas>
        <ambientLight intensity={0.3} color={"#ffffff"} />
        <directionalLight intensity={2.5} color={"#ffffff"} />
          <group ref={canvasRef}>
            <Suspense fallback={<status.In>Loading ...</status.In>}>
              <Scene scale={ScaleXYZ} url={MODELS[model]} color={color} />
            </Suspense>
          </group>
          <OrbitControls />
        </Canvas>
      </figure>
      <div className="card-body">
        <button className="btn btn-primary" onClick={handleExportGLTF}>Export 3D Object (.GLTF)</button>
        <button className="btn btn-primary" onClick={handleExportOBJ}>Export 3D Object (.OBJ)</button>
      </div>
    </div>
    </>
  )
}
