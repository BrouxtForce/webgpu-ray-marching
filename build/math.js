export function identityMatrix(outMatrix) {
    outMatrix ??= new Float32Array(12);
    outMatrix.set([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
    ]);
    return outMatrix;
}
export function matrixRotationX(radians, outMatrix) {
    outMatrix ??= new Float32Array(12);
    const cosRad = Math.cos(radians);
    const sinRad = Math.sin(radians);
    outMatrix.set([
        1, 0, 0, 0,
        0, cosRad, -sinRad, 0,
        0, sinRad, cosRad, 0
    ]);
    return outMatrix;
}
export function matrixRotationY(radians, outMatrix) {
    outMatrix ??= new Float32Array(12);
    const cosRad = Math.cos(radians);
    const sinRad = Math.sin(radians);
    outMatrix.set([
        cosRad, 0, sinRad, 0,
        0, 1, 0, 0,
        -sinRad, 0, cosRad, 0
    ]);
    return outMatrix;
}
export function matrixMult(a, b, outMatrix) {
    outMatrix ??= new Float32Array(12);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const index = i * 4 + j;
            outMatrix[index] = 0;
            for (let k = 0; k < 3; k++) {
                outMatrix[index] += a[i * 4 + k] * b[k * 4 + j];
            }
        }
    }
    return outMatrix;
}
export function vectorMatrixMult(vector, matrix, outVector) {
    outVector ??= Array(3);
    for (let i = 0; i < 3; i++) {
        outVector[i] = 0;
        for (let j = 0; j < 3; j++) {
            outVector[i] += vector[j] * matrix[i * 4 + j];
        }
    }
    return outVector;
}
export function normalize(vector) {
    let sqrMagnitude = 0;
    for (let i = 0; i < vector.length; i++) {
        sqrMagnitude += vector[i] ** 2;
    }
    if (sqrMagnitude === 0) {
        return vector;
    }
    const magnitude = Math.sqrt(sqrMagnitude);
    for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
    }
    return vector;
}
