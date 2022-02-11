import { BASE_URL } from "./cfg.js";

export class datasetApi {
    static getDemo(func, efunc) {
        axios({
            method : 'get',
            url    : BASE_URL + '/datasets/demo/get'
        }).then(res => func(res.data)).catch(err => efunc(err));
    }
}