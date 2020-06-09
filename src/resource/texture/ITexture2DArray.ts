import { IResource } from '../IResource';
import { vec2 } from 'gl-matrix';
import { GlTexture2DArray } from '../../webgl/texture/GlTexture2DArray';

export interface ITexture2DArray extends IResource {

    getNativeTexture(): GlTexture2DArray;

    getSize(): vec2;

    getLayers(): number;

}