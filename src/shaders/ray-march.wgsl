// Reference: https://michaelwalczyk.com/blog-ray-marching.html

struct CameraData {
    position: vec3f,
    aspect: f32,
    tanFov2: f32,

    rotation: mat3x3f,
};

@group(0) @binding(0) var<uniform> cameraData: CameraData;

struct VertexData {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
};

const positions = array<vec2f, 6>(
    vec2f(-1, -1),
    vec2f( 1, -1),
    vec2f( 1,  1),
    vec2f( 1,  1),
    vec2f(-1,  1),
    vec2f(-1, -1)
);

@vertex
fn quad_vert(@builtin(vertex_index) vertexId: u32) -> VertexData {
    var out: VertexData;

    var pos: vec2f = positions[vertexId];
    out.position = vec4f(pos, 0, 1);
    out.texcoord = pos * vec2f(cameraData.aspect, 1) * cameraData.tanFov2;

    return out;
}

fn distance_from_sphere(position: vec3f, sphereCenter: vec3f, sphereRadius: f32) -> f32 {
    return length(position - sphereCenter) - sphereRadius;
}

fn map_the_world(position: vec3f) -> f32 {
    return distance_from_sphere(position, vec3f(0), 1);
}

@fragment
fn ray_march_frag(in: VertexData) -> @location(0) vec4f {
    const MAX_STEPS: i32 = 32;
    const MIN_HIT_DISTANCE: f32 = 0.001;
    const MAX_TRACE_DISTANCE: f32 = 1000;

    var rayOrigin = cameraData.position;
    var rayDirection = normalize(cameraData.rotation * vec3f(in.texcoord, 1));

    var currentPosition = rayOrigin;
    var distanceTraveled: f32 = 0;

    var hit: bool = false;
    for (var i: i32 = 0; i < MAX_STEPS; i++) {
        var distance = map_the_world(currentPosition);

        if (distance < MIN_HIT_DISTANCE) {
            hit = true;
            break;
        }

        distanceTraveled += distance;

        if (distanceTraveled > MAX_TRACE_DISTANCE) {
            break;
        }

        currentPosition += rayDirection * distance;
    }

    if (hit) {
        const SMALL_STEP = vec2f(0.001, 0);

        var normal = normalize(vec3f(
            map_the_world(currentPosition + SMALL_STEP.xyy) - map_the_world(currentPosition - SMALL_STEP.xyy),
            map_the_world(currentPosition + SMALL_STEP.yxy) - map_the_world(currentPosition - SMALL_STEP.yxy),
            map_the_world(currentPosition + SMALL_STEP.yyx) - map_the_world(currentPosition - SMALL_STEP.yyx)
        ));

        const lightDirection = normalize(vec3f(1, 1, -1));

        var diffuseIntensity = max(dot(normal, lightDirection), 0.2);
        const diffuseColor = vec3f(1, 0, 0);

        return vec4f(diffuseColor * diffuseIntensity, 1);
    }

    return vec4f(1, 1, 1, 1);
}