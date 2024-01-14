async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();

    if (!device) {
        alert("Your browser does not support WebGPU.");
        return;
    }

    const canvas = document.querySelector(".sdf-canvas") as HTMLCanvasElement;
}

main();