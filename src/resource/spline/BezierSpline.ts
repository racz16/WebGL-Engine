import { CubicSpline } from './CubicSpline';
import { vec3, vec4, mat4 } from 'gl-matrix';

export class BezierSpline extends CubicSpline {

    public constructor() {
        super();
        this.computeBasisMatrix();
    }

    protected getValue(startIndex: number, t: number): vec3 {
        if (this.getNumberOfControlPoints() < this.getRequiredControlPoints()) {
            return super.getValue(startIndex, t);
        } else {
            const vec = vec4.transformMat4(vec4.create(), vec4.fromValues(t * t * t, t * t, t, 1), this.basisMatrix);
            const closestControlAndHelperPoints = this.computeClosestControlAndHelperPoints(startIndex);
            const v1 = vec4.fromValues(closestControlAndHelperPoints[0][0], closestControlAndHelperPoints[1][0], closestControlAndHelperPoints[2][0], closestControlAndHelperPoints[3][0]);
            const v2 = vec4.fromValues(closestControlAndHelperPoints[0][1], closestControlAndHelperPoints[1][1], closestControlAndHelperPoints[2][1], closestControlAndHelperPoints[3][1]);
            const v3 = vec4.fromValues(closestControlAndHelperPoints[0][2], closestControlAndHelperPoints[1][2], closestControlAndHelperPoints[2][2], closestControlAndHelperPoints[3][2]);
            return vec3.fromValues(vec4.dot(vec, v1), vec4.dot(vec, v2), vec4.dot(vec, v3));
        }
    }

    private computeClosestControlAndHelperPoints(startIndex: number): Array<vec3> {
        const closest = new Array<vec3>(4);
        closest[0] = this.controlPoints[startIndex].getPoint();
        closest[1] = this.controlPoints[startIndex].getRight();
        const loop = startIndex + 1 === this.getNumberOfControlPoints() && this.isLoop();
        closest[2] = loop ? this.controlPoints[0].getLeft() : this.controlPoints[startIndex + 1].getLeft();
        closest[3] = loop ? this.controlPoints[0].getPoint() : this.controlPoints[startIndex + 1].getPoint();
        return closest;
    }

    public getLeftHelperPoint(index: number): vec3 {
        return vec3.clone(this.controlPoints[index].getLeft());
    }

    public getRightHelperPoint(index: number): vec3 {
        return vec3.clone(this.controlPoints[index].getRight());
    }

    public setLeftHelperPoint(index: number, helperPoint: vec3): void {
        this.controlPoints[index].setLeft(vec3.clone(helperPoint));
        this.valid = false;
    }

    public setRightHelperPoint(index: number, helperPoint: vec3): void {
        this.controlPoints[index].setRight(vec3.clone(helperPoint));
        this.valid = false;
    }

    public normalizeHelperPoints(distance: number): void {
        if (this.getNumberOfControlPoints() >= this.getRequiredControlPoints()) {
            this.normalizeFirstControlPoint(distance);
            this.normalizeMiddleControlPoints(distance);
            this.normalizeLastControlPoint(distance);
            this.valid = false;
        }
    }

    private normalizeFirstControlPoint(distance: number): void {
        const direction = vec3.create();
        if (this.isLoop()) {
            direction.set(vec3.sub(vec3.create(), this.getControlPoint(this.controlPoints.length - 1), this.getControlPoint(1)));
        } else {
            direction.set(vec3.sub(vec3.create(), this.getControlPoint(0), this.getControlPoint(1)));
        }
        direction.set(vec3.normalize(vec3.create(), direction));
        this.controlPoints[0].setLeft(vec3.add(vec3.create(), this.getControlPoint(0), vec3.scale(vec3.create(), direction, distance)));
    }

    private normalizeMiddleControlPoints(distance: number): void {
        const direction = vec3.create();
        for (let i = 1; i < this.controlPoints.length - 1; i++) {
            direction.set(vec3.sub(vec3.create(), this.getControlPoint(i - 1), this.getControlPoint(i + 1)));
            direction.set(vec3.normalize(vec3.create(), direction));
            this.controlPoints[i].setLeft(vec3.add(vec3.create(), this.getControlPoint(i), vec3.scale(vec3.create(), direction, distance)));
        }
    }

    private normalizeLastControlPoint(distance: number): void {
        const direction = vec3.create();
        if (this.isLoop()) {
            direction.set(vec3.sub(vec3.create(), this.getControlPoint(this.controlPoints.length - 2), this.getControlPoint(0)));
        } else {
            direction.set(vec3.sub(vec3.create(), this.getControlPoint(this.controlPoints.length - 2), this.getControlPoint(this.controlPoints.length - 1)));
        }
        direction.set(vec3.normalize(vec3.create(), direction));
        this.controlPoints[this.controlPoints.length - 1].setLeft(vec3.add(vec3.create(), this.getControlPoint(this.controlPoints.length - 1), vec3.scale(vec3.create(), direction, distance)));

    }

    protected computeBasisMatrix(): void {
        this.basisMatrix = mat4.fromValues(
            -1, 3, -3, 1,
            3, -6, 3, 0,
            -3, 3, 0, 0,
            1, 0, 0, 0);
        this.valid = false;
    }

}
