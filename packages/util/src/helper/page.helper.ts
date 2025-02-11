export const getPagination = (page: number, pageSize: number, total: number) => {
    const pages = Math.ceil(total / pageSize);
    return {
        page: Number(page),
        pageSize: Number(pageSize),
        total: Number(total),
        pages: Number(pages),
    };
};

export class BasePageData<T> {
    constructor(public readonly page: number = 1, public readonly pageSize: number = 10, public readonly dataList: T[] = []) {
        this.page = page;
        this.pageSize = pageSize;
    }

    map<R>(mapper: (item: T, index: number) => R) {
        return this.replaceDataList(this.dataList.map(mapper));
    }
    replaceDataList<R>(dataList: R[]) {
        return new BasePageData(this.page, this.pageSize, dataList);
    }
}

export class PageData<T> extends BasePageData<T> {
    constructor(
        page: number = 1,
        pageSize: number = 10,
        dataList: T[] = [],
        public readonly total = 0,
        public readonly hasMore = total - (page - 1) * pageSize > pageSize,
        public readonly skip = (page - 1) * pageSize,
    ) {
        super(page, pageSize, dataList);
    }

    replaceDataList<R>(dataList: R[]) {
        return new PageData(this.page, this.pageSize, dataList, this.total, this.hasMore);
    }
}
