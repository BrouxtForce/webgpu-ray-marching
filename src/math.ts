// Matrix3x3's are padded to 3 float4's
type Matrix3x3 = Float32Array;

export function identityMatrix(outMatrix?: Matrix3x3): Matrix3x3 {
    outMatrix ??= new Float32Array(12);

    outMatrix.set([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
    ]);

    return outMatrix;
}

export function matrixRotationX(radians: number, outMatrix?: Matrix3x3): Matrix3x3 {
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

export function matrixRotationY(radians: number, outMatrix?: Matrix3x3): Matrix3x3 {
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

// outMatrix cannot be the same object as a or b
export function matrixMult(a: Matrix3x3, b: Matrix3x3, outMatrix?: Matrix3x3): Matrix3x3 {
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

// outVector cannot be the same object as vector
export function vectorMatrixMult(vector: number[], matrix: Matrix3x3, outVector?: number[]): number[] {
    outVector ??= Array<number>(3);

    for (let i = 0; i < 3; i++) {
        outVector[i] = 0;
        for (let j = 0; j < 3; j++) {
            outVector[i] += vector[j] * matrix[i * 4 + j];
        }
    }

    return outVector;
}

export function normalize(vector: number[]): number[] {
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