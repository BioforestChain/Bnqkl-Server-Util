export {};
declare global {
    export namespace ServerUtil {
        export namespace FSM {
            /**有限状态机管理器 */
            export interface FSMMgr<StateID extends number, State extends FSMState<StateID>> {
                /**
                 * 注册状态
                 * @param state
                 */
                registerState(state: State): void;

                /**
                 * 获取状态
                 * @param stateId
                 */
                getState(stateId: StateID): State | undefined;

                /**
                 * 心跳
                 */
                tick(): Promise<void>;
            }

            /**有限状态机的逻辑对象 */
            export interface FSMObj<StateID extends number> {
                /**
                 * 心跳
                 */
                onTick(): Promise<void>;

                /**
                 * 初始化
                 */
                init(): Promise<void>;

                /**
                 * 改变当前状态
                 * @param newStateId
                 * @param oldStateId
                 */
                changeState(newStateId: StateID, oldStateId: StateID): Promise<void>;
            }

            /**状态基类 */
            export interface FSMState<StateID extends number> {
                /**
                 * 心跳
                 * @param stateObj
                 */
                onTick(stateObj: FSMObj<StateID>): Promise<void>;

                /**
                 * 获取当前状态枚举
                 */
                getStateId(): StateID;

                /**
                 * 进入状态前置逻辑
                 * @param stateObj
                 */
                beforeEnterState(stateObj: FSMObj<StateID>): Promise<void>;

                /**
                 * 进入状态
                 * @param stateObj
                 */
                onEnterState(stateObj: FSMObj<StateID>): Promise<void>;

                /**
                 * 进入状态后置逻辑
                 * @param stateObj
                 */
                afterEnterState(stateObj: FSMObj<StateID>): Promise<void>;

                /**
                 * 离开状态
                 * @param stateObj
                 */
                onLeaveState(stateObj: FSMObj<StateID>): Promise<void>;
            }
        }
    }
}
