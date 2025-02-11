import { DataSource, EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import { BasePageData, PageData } from "../helper";

export class BaseRepository<T extends {}> extends Repository<T> {
    constructor(target: EntityTarget<T>, dataSource: DataSource) {
        super(target, dataSource.createEntityManager());
    }

    async findForce(options: FindManyOptions<T>) {
        const result = await this.find(options);
        if (!result) {
            throw new Error(`could not found any one as '${this.target.toString()}' with condition: ${JSON.stringify(options)}`);
        }
        return result as NonNullable<typeof result>;
    }

    async findByForce(options: FindOptionsWhere<T>) {
        const result = await this.findBy(options);
        if (!result) {
            throw new Error(`could not found any one as '${this.target.toString()}' with condition: ${JSON.stringify(options)}`);
        }
        return result as NonNullable<typeof result>;
    }

    async findOneForce(options: FindOneOptions<T>) {
        const result = await this.findOne(options);
        if (!result) {
            throw new Error(`could not found any one as '${this.target.toString()}' with condition: ${JSON.stringify(options)}`);
        }
        return result as NonNullable<typeof result>;
    }

    async findOneByForce(options: FindOptionsWhere<T> | FindOptionsWhere<T>[]) {
        const result = await this.findOneBy(options);
        if (!result) {
            throw new Error(`could not found any one as '${this.target.toString()}' with condition: ${JSON.stringify(options)}`);
        }
        return result as NonNullable<typeof result>;
    }

    async findByPage(options: FindManyOptions<T>, page = 1, pageSize = 10): Promise<BasePageData<T>> {
        const dataList = await this.find({ ...options, skip: (page - 1) * pageSize, take: pageSize + 1 });
        return new BasePageData<T>(page, pageSize, dataList);
    }

    async findByPageNormal(options: FindManyOptions<T>, page = 1, pageSize = 10): Promise<PageData<T>> {
        const dataList = await this.find({ ...options, skip: (page - 1) * pageSize, take: pageSize });
        const total = await this.count(options);
        return new PageData<T>(page, pageSize, dataList, total);
    }
}
