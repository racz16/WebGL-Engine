import { Renderer } from '../Renderer';
import { QuadMesh } from '../../resource/mesh/QuadMesh';
import { RenderingPipeline } from '../RenderingPipeline';
import { Gl } from '../../webgl/Gl';
import { vec2, mat4, ReadonlyMat4 } from 'gl-matrix';
import { Engine } from '../../core/Engine';
import { DebugShader } from '../../resource/shader/DebugShader';
import { Conventions } from '../../resource/Conventions';

export class DebugRenderer extends Renderer {

    private shader: DebugShader;
    private quad: QuadMesh;

    private readonly transformation = mat4.create();
    private layer: number;

    public constructor() {
        super('Debug Renderer');
        this.shader = new DebugShader();
        this.quad = QuadMesh.getInstance();
    }

    public setData(transformation: ReadonlyMat4, layer: number): void {
        mat4.copy(this.transformation, transformation);
        this.layer = layer;
    }

    protected renderUnsafe(): void {
        this.beforeRendering();
        this.beforeDraw();
        this.draw();
    }

    protected beforeRendering(): void {
        this.shader.start();
        this.shader.setUniforms({ transformation: this.transformation, layer: this.layer });

        const canvas = Gl.getCanvas();
        Gl.setViewport(vec2.fromValues(canvas.clientWidth, canvas.clientHeight), vec2.create());
    }

    protected beforeDraw(): void {
        const image = Engine.getRenderingPipeline().getParameters().get(RenderingPipeline.DEBUG);
        if (image) {
            this.getShader().loadTexture2DArray(image, Conventions.TU_ZERO);
        } else {
            this.getShader().loadTexture2DArray(Engine.getParameters().get(Engine.BLACK_TEXTURE_2D_ARRAY), Conventions.TU_ZERO);
        }
        const image2 = Engine.getRenderingPipeline().getParameters().get(RenderingPipeline.DEBUG_2);
        if (image2) {
            this.getShader().loadTexture2D(image2, Conventions.TU_ONE);
        } else {
            this.getShader().loadTexture2D(Engine.getParameters().get(Engine.BLACK_TEXTURE_2D), Conventions.TU_ONE);
        }
    }

    protected draw(): void {
        Gl.setEnableDepthTest(false);
        this.quad.draw();
        Gl.setEnableDepthTest(true);
    }

    public getShader(): DebugShader {
        return this.shader;
    }

}
