import { FSMObj } from "./fsm-obj";

/**状态基类 */
export abstract class FSMState<StateID extends number> implements ServerUtil.FSM.FSMState<StateID> {
    constructor(private __stateId: StateID) {}

    /**
     * 获取当前状态枚举
     */
    getStateId() {
        return this.__stateId;
    }

    abstract getStateName(): string;

    /**
     * 心跳
     * @param stateObj
     */
    async onTick(stateObj: FSMObj<StateID>): Promise<void> {}

    /**
     * 进入状态前置逻辑
     * @param stateObj
     */
    async beforeEnterState(stateObj: FSMObj<StateID>): Promise<void> {}

    /**
     * 进入状态
     * @param stateObj
     */
    async onEnterState(stateObj: FSMObj<StateID>): Promise<void> {}

    /**
     * 进入状态后置逻辑
     * @param stateObj
     */
    async afterEnterState(stateObj: FSMObj<StateID>): Promise<void> {}

    /**
     * 离开状态
     * @param stateObj
     */
    async onLeaveState(stateObj: FSMObj<StateID>): Promise<void> {}
}
