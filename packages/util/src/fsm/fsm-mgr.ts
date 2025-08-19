import type { FSMState } from "./fsm-state.js";

/**有限状态机管理器 */
export abstract class FSMMgr<StateID extends number, State extends FSMState<StateID>> implements ServerUtil.FSM.FSMMgr<StateID, State> {
    /**所有State的集合 */
    private __stateMap = new Map<StateID, State>();

    /**
     * 注册状态
     * @param state
     */
    registerState(state: State) {
        this.__stateMap.set(state.getStateId(), state);
    }

    getState(stateId: StateID) {
        return this.__stateMap.get(stateId);
    }

    /**
     * 心跳
     */
    abstract tick(): Promise<void>;
}
