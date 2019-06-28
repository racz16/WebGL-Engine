import { Component } from "../../core/Component";
import { ICameraComponent } from "./ICameraComponent";
import { Ubo } from "../../webgl/buffer/Ubo";
import { mat4, vec3 } from "gl-matrix";
import { Scene } from "../../core/Scene";
import { BufferObjectUsage } from "../../webgl/enum/BufferObjectUsage";
import { Utility } from "../../utility/Utility";
import { GameObject } from "../../core/GameObject";
import { Log } from "../../utility/log/Log";
import { Frustum } from "./frustum/Frustum";
import { RenderingPipeline } from "../../rendering/RenderingPipeline";

export class CameraComponent extends Component implements ICameraComponent {

    private static ubo: Ubo;
    private static camera: CameraComponent;

    private viewMatrix: mat4;
    private projectionMatrix: mat4;
    private frustum: Frustum;
    private nearPlaneDistance: number;
    private farPlaneDistance: number;
    private fov: number;
    private uboInitialized = false;

    public constructor(fov = 55, nearPlane = 0.1, farPlane = 200) {
        super();
        if (!this.uboInitialized) {
            CameraComponent.createUbo();
            this.uboInitialized = true;
        }
        this.setFov(fov);
        this.setNearPlaneDistance(nearPlane);
        this.setFarPlaneDistance(farPlane);
    }

    public static refreshMatricesUbo(): void {
        if (CameraComponent.camera) {
            CameraComponent.createUbo();
            CameraComponent.refreshUboUnsafe();
        }
    }

    private static createUbo(): void {
        if (!CameraComponent.isCameraUboUsable()) {
            CameraComponent.createUboUnsafe();
        }
    }

    private static refreshUboUnsafe(): void {
        CameraComponent.ubo.store(new Float32Array(CameraComponent.camera.getViewMatrix()));
        CameraComponent.ubo.storewithOffset(new Float32Array(CameraComponent.camera.getProjectionMatrix()), Ubo.MAT4_SIZE);
        CameraComponent.ubo.storewithOffset(new Float32Array(CameraComponent.camera.getGameObject().getTransform().getAbsolutePosition()), 2 * Ubo.MAT4_SIZE);
        CameraComponent.camera = null;

        Log.resourceInfo('matrices ubo refreshed');
    }

    public static makeCameraUboUsable(): void {
        CameraComponent.createUbo();
        CameraComponent.refreshMatricesUbo();
    }

    private static createUboUnsafe(): void {
        CameraComponent.ubo = new Ubo();
        CameraComponent.ubo.allocate(140, BufferObjectUsage.STATIC_DRAW);
        CameraComponent.ubo.bindToBindingPoint(RenderingPipeline.CAMERA_BINDING_POINT.bindingPoint);
        Log.resourceInfo('matrices ubo created');
    }

    public static releaseCameraUbo(): void {
        CameraComponent.invalidateMainCamera();
        if (CameraComponent.isCameraUboUsable()) {
            CameraComponent.ubo.release();
            CameraComponent.ubo = null;
            Log.resourceInfo('matrices ubo released');
        }
    }

    public static isCameraUboUsable(): boolean {
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
        super.invalidate(event);
        if (this.isTheMainCamera()) {
            CameraComponent.camera = this;
        }
    }

    protected refresh(): void {
        if (!this.isValid()) {
            this.setValid(true);
            this.refreshProjectionMatrix();
            this.refreshViewMatrixAndFrustum();

        }
    }

    private refreshProjectionMatrix(): void {
        this.projectionMatrix = Utility.computePerspectiveProjectionMatrix(this.fov, this.nearPlaneDistance, this.farPlaneDistance);
    }

    private refreshViewMatrixAndFrustum(): void {
        if (this.getGameObject()) {
            this.viewMatrix = Utility.computeViewMatrix(
                this.getGameObject().getTransform().getAbsolutePosition(),
                this.getGameObject().getTransform().getAbsoluteRotation());
            this.frustum.refresh();
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

    public isTheMainCamera(): boolean {
        return Scene.getParameters().getValue(Scene.MAIN_CAMERA) == this;
    }

    public private_detachFromGameObject(): void {
        this.getGameObject().getTransform().getInvalidatables().removeInvalidatable(this);
        this.frustum = null;
        super.private_detachFromGameObject();
    }

    public private_attachToGameObject(g: GameObject): void {
        super.private_attachToGameObject(g);
        this.getGameObject().getTransform().getInvalidatables().addInvalidatable(this);
        this.frustum = new Frustum(this);
    }

    public getFrustum(): Frustum {
        if (this.isUsable()) {
            //TODO: ne itt, hanem a frustum getterjeiben
            this.refresh();
            return this.frustum;
        } else {
            return null;
        }
    }

    public isUsable(): boolean {
        return this.getGameObject() != null;
    }

}
