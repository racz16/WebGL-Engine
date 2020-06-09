import { Renderer } from './Renderer';
import { Gl } from '../webgl/Gl';
import { QuadMesh } from '../resource/mesh/QuadMesh';
import { Engine } from '../core/Engine';
import { RenderingPipeline } from './RenderingPipeline';
import { Conventions } from '../resource/Conventions';

export abstract class PostProcessRenderer extends Renderer {

    protected quad: QuadMesh;

    public constructor(name: string) {
        super(name);
        this.quad = QuadMesh.getInstance();
    }

    protected renderUnsafe(): void {
        const image = Engine.getRenderingPipeline().getParameters().get(RenderingPipeline.WORK);
        //this.getShader().getNativeShaderProgram().loadTexture(Conventions.ZERO_TEXTURE_UNIT, image.getNativeTexture()); //TODO a többit is így
        image.getNativeTexture().bindToTextureUnit(Conventions.ZERO_TEXTURE_UNIT);
        Gl.setEnableDepthTest(false);
        this.getShader().setUniforms();
        this.quad.draw();
        this.incrementRenderedElementCountBy(1);
        this.incrementRenderedFaceCountBy(this.quad.getFaceCount());
    }

}