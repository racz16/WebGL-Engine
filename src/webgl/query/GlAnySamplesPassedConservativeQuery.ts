import { GlScopedQuery } from './GlScopedQuery';
import { Gl } from '../Gl';

export class GlAnySamplesPassedConservativeQuery extends GlScopedQuery<boolean> {

    public getTarget(): number {
        return Gl.gl.ANY_SAMPLES_PASSED_CONSERVATIVE;
    }

}