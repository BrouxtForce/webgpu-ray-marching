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
    out.texcoord = (pos + 1) / 2;

    return out;
}

@fragment
fn sdf_frag(in: VertexData) -> @location(0) vec4f {
    return vec4f(in.texcoord, 0, 1);
}