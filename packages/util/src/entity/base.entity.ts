import { PrimaryGeneratedColumn, Column } from "typeorm";
import { CommonHelper } from "../helper";

export abstract class BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("datetime", { name: "created_time" })
    createdTime: Date;

    @Column("datetime", { name: "updated_time" })
    updatedTime: Date;
}

export abstract class BaseEntityWithUuId extends BaseEntity {
    /** 唯一id */
    @Column("varchar", { unique: true, name: "entity_id" })
    entityId: string = CommonHelper.getUuid();
}
