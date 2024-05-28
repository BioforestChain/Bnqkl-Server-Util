import { FSMEntity } from "../entity";
import { Logger } from "../log4j/log4j";
import { FSMMgr } from "./fsm-mgr";
import { FSMState } from "./fsm-state";

/**有限状态机的逻辑对象 */
export abstract class FSMObj<
    StateID extends number,
    State extends FSMState<StateID> = FSMState<StateID>,
    Entity extends FSMEntity<StateID> = FSMEntity<StateID>,
> implements ServerUtil.FSM.FSMObj<StateID>
{
    /**当前状态 */
    private __curState?: State;
    /**是否正在改变状态 */
    private __isChangingState = false;
    /**下一个状态id */
    private __nextStateId: StateID | undefined;

    constructor(private __entity: Entity, private __mgr: FSMMgr<StateID, State>) {}

    get entity() {
        return this.__entity;
    }

    /**唯一id */
    get entityId() {
        return this.entity.entityId;
    }

    /**当前状态id */
    get curStateId() {
        return this.entity.state;
    }
    set curStateId(newStateId: StateID) {
        this.entity.state = newStateId;
    }

    get curState() {
        return this.__curState;
    }

    /**
     * 改变当前状态
     * @param newStateId
     * @param fromStateId
     */
    async changeState(newStateId: StateID, fromStateId: StateID) {
        if (this.__curState && newStateId === this.curStateId) {
            // 新状态和当前状态相同，则直接返回
            return;
        }
        if (this.__isChangingState) {
            // 正在改变状态
            if (fromStateId === this.curStateId) {
                // 当前状态与来源状态相同，则设为下一个状态，延迟改变
                this.__nextStateId = newStateId;
            } else {
                // 当前状态与来源状态不同，则直接报错返回
                Logger.warn(`entityId:${this.entityId} isChangingState. can't changeState to ${newStateId}`);
            }
            return;
        }
        this.__isChangingState = true;
        try {
            await this.__curState?.onLeaveState(this);
            this.curStateId = newStateId;
            this.__curState = this.__mgr.getState(newStateId);
            await this.__curState?.beforeEnterState(this);
            await this.__curState?.onEnterState(this);
            await this.__curState?.afterEnterState(this);
        } finally {
            this.__isChangingState = false;
        }
        // 如果有下一个状态，在当前状态改变完后再改变
        if (this.__nextStateId) {
            const nextStateId = this.__nextStateId;
            this.__nextStateId = undefined;
            await this.changeState(nextStateId, this.curStateId);
        }
    }

    async init() {
        await this.changeState(this.curStateId, this.curStateId);
    }

    /**
     * 心跳
     */
    async onTick(): Promise<void> {
        await this.__curState?.onTick(this);
    }
}
