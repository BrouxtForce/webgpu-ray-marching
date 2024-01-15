async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
        alert("Your browser does not support WebGPU.");
        return;
    }

    const canvas = document.querySelector(".sdf-canvas") as HTMLCanvasElement;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    window.addEventListener("resize", () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    });

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

    const renderPassDescriptor: GPURenderPassDescriptor = {
        label: "ray march render pass",
        colorAttachments: [{
            clearValue: [1, 1, 1, 1],
            loadOp: "clear",
            storeOp: "store",
            view: null as any
        }]
    };

    const render = () => {
        // @ts-ignore pls
        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

        const encoder = device.createCommandEncoder({ label: "ray march render encoder" });

        const pass = encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(renderPipeline);
        pass.draw(6);
        pass.end();

        device.queue.submit([encoder.finish()]);
    };

    render();
}

main();