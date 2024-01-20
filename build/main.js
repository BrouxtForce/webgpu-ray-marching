import Input from "./input.js";
import DebugTable from "./debug-table.js";
import { identityMatrix, matrixMult, matrixRotationX, matrixRotationY, normalize, vectorMatrixMult } from "./math.js";
async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const requiredFeatures = [];
    const supportsTimestampQuery = Boolean(adapter?.features.has("timestamp-query"));
    if (supportsTimestampQuery) {
        requiredFeatures.push("timestamp-query");
    }
    const device = await adapter?.requestDevice({ requiredFeatures });
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
    const querySetCapacity = 2;
    let querySet;
    let queryBuffer;
    if (supportsTimestampQuery) {
        querySet = device.createQuerySet({
            type: "timestamp",
            count: querySetCapacity
        });
        queryBuffer = device.createBuffer({
            size: BigInt64Array.BYTES_PER_ELEMENT * querySetCapacity,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
        });
        renderPassDescriptor.timestampWrites = {
            querySet: querySet,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1
        };
    }
    const input = new Input(canvas);
    let rotationX = 0;
    let rotationY = 0;
    window.addEventListener("resize", () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        cameraAspect.set([canvas.width / canvas.height]);
    });
    const debugTableNode = document.querySelector(".debug-table");
    const debugTable = new DebugTable(debugTableNode);
    let frameTimeMs = 0;
    let gpuTimeMs = 0;
    const loop = () => {
        const frameStart = performance.now();
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
        debugTable.set("CPU", `${frameTimeMs.toFixed(2)}ms`);
        debugTable.set("GPU", `${gpuTimeMs.toFixed(2)}ms`);
        device.queue.writeBuffer(cameraDataBuffer, 0, cameraData);
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
        const encoder = device.createCommandEncoder({ label: "ray march render encoder" });
        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, cameraDataBindGroup);
        pass.draw(6);
        pass.end();
        let queryResultBuffer;
        if (supportsTimestampQuery) {
            queryResultBuffer = device.createBuffer({
                size: queryBuffer.size,
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
            });
            encoder.resolveQuerySet(querySet, 0, querySetCapacity, queryBuffer, 0);
            encoder.copyBufferToBuffer(queryBuffer, 0, queryResultBuffer, 0, queryBuffer.size);
        }
        device.queue.submit([encoder.finish()]);
        if (supportsTimestampQuery) {
            queryResultBuffer.mapAsync(GPUMapMode.READ).then(() => {
                const times = new BigInt64Array(queryResultBuffer.getMappedRange());
                gpuTimeMs = Number(BigInt(times[1]) - BigInt(times[0])) / 1000000;
            });
        }
        window.requestAnimationFrame(loop);
        frameTimeMs = performance.now() - frameStart;
    };
    window.requestAnimationFrame(loop);
}
main();
