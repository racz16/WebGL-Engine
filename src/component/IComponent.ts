import { IInvalidatable } from '../utility/invalidatable/IInvalidatable';
import { GameObject } from '../core/GameObject';
import { InvalidatableContainer } from '../utility/invalidatable/InvalidatableContainer';

export interface IComponent extends IInvalidatable {

    updateComponent(): void;

    getInvalidatables(): InvalidatableContainer;

    isActive(): boolean;

    getGameObject(): GameObject;

}
