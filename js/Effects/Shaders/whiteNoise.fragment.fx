precision highp float;

varying vec2 vUV;

uniform sampler2D shipTexture;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
    vec4 baseColor = texture2D(shipTexture, vUV);
    float noise = rand(vUV);
    vec4 noiseColor = vec4(vec3(noise), 1.0);
    gl_FragColor = mix(baseColor, noiseColor, 0.60); // Вы можете изменить коэффициент смешивания, чтобы настроить интенсивность шума
}