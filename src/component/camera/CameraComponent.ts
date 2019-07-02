import { Component } from "../../core/Component";
import { ICameraComponent } from "./ICameraComponent";
import { Ubo } from "../../webgl/buffer/Ubo";
import { mat4 } from "gl-matrix";
import { Scene } from "../../core/Scene";
import { BufferObjectUsage } from "../../webgl/enum/BufferObjectUsage";
import { Utility } from "../../utility/Utility";
import { GameObject } from "../../core/GameObject";
import { Log } from "../../utility/log/Log";
import { Frustum } from "./frustum/Frustum";
import { RenderingPipeline } from "../../rendering/RenderingPipeline";

export class CameraComponent extends Component implements ICameraComponent {

    private static ubo: Ubo;
    private static uboValid = false;

    private viewMatrix: mat4;
    private projectionMatrix: mat4;
    private readonly frustum: Frustum;
    private nearPlaneDistance: number;
    private farPlaneDistance: number;
    private fov: number;
    private aspectRatio: number;

    public constructor(fov = 55, aspectRatio = 1, nearPlane = 0.1, farPlane = 200) {
        super();
        this.frustum = new Frustum(this);
        this.setFov(fov);
        this.setAspectRatio(aspectRatio);
        this.setNearPlaneDistance(nearPlane);
        this.setFarPlaneDistance(farPlane);
    }

    private static createUboIfNotExists(): void {
        if (!this.isUboUsable()) {
            this.createUboUnsafe();
        }
    }

    private static createUboUnsafe(): void {
        this.ubo = new Ubo();
        this.ubo.allocate(140, BufferObjectUsage.STATIC_DRAW);
        this.ubo.bindToBindingPoint(RenderingPipeline.CAMERA_BINDING_POINT.bindingPoint);
        Log.resourceInfo('camera ubo created');
    }

    public static refreshUbo(): void {
        const cam = Scene.getParameters().getValue(Scene.MAIN_CAMERA);
        if (!this.uboValid && cam && cam instanceof CameraComponent) {
            this.createUboIfNotExists();
            this.refreshUboUnsafe(cam);
        }
    }

    private static refreshUboUnsafe(camera: CameraComponent): void {
        this.ubo.store(new Float32Array(camera.getViewMatrix()));
        this.ubo.storewithOffset(new Float32Array(camera.getProjectionMatrix()), Ubo.MAT4_SIZE);
        this.ubo.storewithOffset(new Float32Array(camera.getGameObject().getTransform().getAbsolutePosition()), 2 * Ubo.MAT4_SIZE);
        this.uboValid = true;
        Log.resourceInfo('camera ubo refreshed');
    }

    public static releaseUbo(): void {
        this.invalidateMainCamera();
        if (this.isUboUsable()) {
            this.ubo.release();
            this.ubo = null;
            Log.resourceInfo('camera ubo released');
        }
    }

    public static isUboUsable(): boolean {
        return Utility.isUsable(CameraComponent.ubo);
    }

    private static invalidateMainCamera(): void {
        const cam = Scene.getParameters().getValue(Scene.MAIN_CAMERA);
        if (cam) {
            cam.invalidate();
        }
    }

    public getFov(): number {
        return this.fov;
    }

    public setFov(fov: number): void {
        if (fov <= 0 || fov >= 180) {
            throw new Error();
        }
        this.fov = fov;
        this.invalidate();
    }

    public getAspectRatio(): number {
        return this.aspectRatio;
    }

    public setAspectRatio(aspectRatio: number): void {
        if (aspectRatio <= 0) {
            throw new Error();
        }
        this.aspectRatio = aspectRatio;
        this.invalidate();
    }

    public getNearPlaneDistance(): number {
        return this.nearPlaneDistance;
    }

    public setNearPlaneDistance(nearPlaneDistance: number): void {
        if (nearPlaneDistance <= 0 || nearPlaneDistance >= this.farPlaneDistance) {
            throw new Error();
        }
        this.nearPlaneDistance = nearPlaneDistance;
        this.invalidate();
    }

    public getFarPlaneDistance(): number {
        return this.farPlaneDistance;
    }

    public setFarPlaneDistance(farPlaneDistance: number): void {
        if (this.nearPlaneDistance >= farPlaneDistance) {
            throw new Error();
        }
        this.farPlaneDistance = farPlaneDistance;
        this.invalidate();
    }

    public invalidate(sender?: any): void {
        super.invalidate();
        if (this.isTheMainCamera()) {
            CameraComponent.uboValid = false;
        }
    }

    protected refresh(): void {
        if (!this.isValid()) {
            if (this.isTheMainCamera()) {
                this.setAspectRatio(Utility.getCanvasAspectRatio());
            }
            this.refreshProjectionMatrix();
            this.refreshViewMatrix();
            this.setValid(true);
        }
    }

    private refreshProjectionMatrix(): void {
        this.projectionMatrix = Utility.computePerspectiveProjectionMatrix(this.fov, this.aspectRatio, this.nearPlaneDistance, this.farPlaneDistance);
    }

    private refreshViewMatrix(): void {
        if (this.getGameObject()) {
            const transform = this.getGameObject().getTransform();
            const position = transform.getAbsolutePosition();
            const rotation = transform.getAbsoluteRotation();
            this.viewMatrix = Utility.computeViewMatrix(position, rotation);
        }
    }

    public getViewMatrix(): mat4 {
        if (this.getGameObject()) {
            this.refresh();
            return mat4.clone(this.viewMatrix);
        } else {
            return null;
        }
    }

    public getProjectionMatrix(): mat4 {
        this.refresh();
        return mat4.clone(this.projectionMatrix);
    }

    public getFrustum(): Frustum {
        return this.frustum;
    }

    public isTheMainCamera(): boolean {
        return Scene.getParameters().getValue(Scene.MAIN_CAMERA) == this;
    }

    public private_update(): void {
        if (this.isTheMainCamera()) {
            CameraComponent.refreshUbo();
        }
    }

    public private_detachFromGameObject(): void {
        this.getGameObject().getTransform().getInvalidatables().removeInvalidatable(this);
        super.private_detachFromGameObject();
    }

    public private_attachToGameObject(g: GameObject): void {
        super.private_attachToGameObject(g);
        this.getGameObject().getTransform().getInvalidatables().addInvalidatable(this);
    }

}
