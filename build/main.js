import Input from "./input.js";
import { identityMatrix, matrixMult, matrixRotationX, matrixRotationY, normalize, vectorMatrixMult } from "./math.js";
async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
        alert("Your browser does not support WebGPU.");
        return;
    }
    const canvas = document.querySelector(".sdf-canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const context = canvas.getContext("webgpu");
    if (!context) {
        alert("Failed to initialize WebGPU canvas context.");
        return;
    }
    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: preferredFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    const shaderModule = device.createShaderModule({
        label: "ray march shader module",
        code: await (await fetch("src/shaders/ray-march.wgsl", { cache: "no-store" })).text()
    });
    const cameraData = new ArrayBuffer(80);
    const cameraPosition = new Float32Array(cameraData, 0, 3);
    const cameraAspect = new Float32Array(cameraData, 12, 1);
    const cameraTanFov2 = new Float32Array(cameraData, 16, 1);
    const cameraRotation = new Float32Array(cameraData, 32, 12);
    cameraPosition.set([0, 0, -2]);
    cameraAspect.set([canvas.width / canvas.height]);
    const fov = 60;
    cameraTanFov2.set([Math.tan(fov * Math.PI / 360)]);
    identityMatrix(cameraRotation);
    const cameraDataBuffer = device.createBuffer({
        size: cameraData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const renderPipeline = device.createRenderPipeline({
        label: "ray march render pipeline",
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "quad_vert"
        },
        fragment: {
            module: shaderModule,
            entryPoint: "ray_march_frag",
            targets: [{ format: preferredFormat }]
        },
        primitive: {
            topology: "triangle-list"
        }
    });
    const cameraDataBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: cameraDataBuffer } }
        ]
    });
    const renderPassDescriptor = {
        label: "ray march render pass",
        colorAttachments: [{
                clearValue: [1, 1, 1, 1],
                loadOp: "clear",
                storeOp: "store",
                view: null
            }]
    };
    const input = new Input(canvas);
    let rotationX = 0;
    let rotationY = 0;
    window.addEventListener("resize", () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        cameraAspect.set([canvas.width / canvas.height]);
    });
    const loop = () => {
        const movementSpeed = 0.05;
        const movement = input.movement();
        const rotation = matrixMult(matrixRotationY(rotationY), matrixRotationX(rotationX));
        vectorMatrixMult(movement.slice(), rotation, movement);
        normalize(movement);
        cameraPosition[0] += movement[0] * movementSpeed;
        cameraPosition[1] += movement[1] * movementSpeed;
        cameraPosition[2] -= movement[2] * movementSpeed;
        if (input.pointerIsLocked) {
            const cameraSpeed = 0.005;
            rotationX -= input.mouseDelta[1] * cameraSpeed;
            rotationY -= input.mouseDelta[0] * cameraSpeed;
        }
        matrixMult(matrixRotationX(rotationX), matrixRotationY(rotationY), cameraRotation);
        input.endFrame();
        device.queue.writeBuffer(cameraDataBuffer, 0, cameraData);
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
        const encoder = device.createCommandEncoder({ label: "ray march render encoder" });
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, cameraDataBindGroup);
        pass.draw(6);
        pass.end();
        device.queue.submit([encoder.finish()]);
        window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
}
main();
