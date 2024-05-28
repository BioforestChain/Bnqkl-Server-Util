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
    constructor(public page: number = 1, public pageSize: number = 10, public dataList: T[] = []) {
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
        public total = 0,
        public hasMore = total - (page - 1) * pageSize > pageSize,
        public skip = (page - 1) * pageSize,
    ) {
        super(page, pageSize, dataList);
    }

    replaceDataList<R>(dataList: R[], total: number = 0) {
        return new PageData(this.page, this.pageSize, dataList, total);
    }
}
