import { Column } from "typeorm";
import { BaseEntityWithUuId } from "./base.entity";

export abstract class FSMEntity<StateID extends number> extends BaseEntityWithUuId {
    /** 状态 */
    @Column("smallint")
    state: StateID;

    /**
     * 逻辑删除
     */
    @Column({ default: 0, select: false, name: "del_flag" })
    delFlag: number;
}
