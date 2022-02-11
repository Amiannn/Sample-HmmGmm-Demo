import { BASE_URL } from "./cfg.js";

export class hmmApi {
    static get(func, efunc) {
        axios({
            method : 'get',
            url    : BASE_URL + '/hmmgmm/get'
        }).then(res => func(res.data)).catch(err => efunc(err));
    }

    static generate(func, efunc) {
        axios({
            method : 'get',
            url    : BASE_URL + '/hmmgmm/generate',
        }).then(res => func(res.data)).catch(err => efunc(err));
    }

    static update(data, func, efunc) {
        axios({
            method : 'post',
            url    : BASE_URL + '/hmmgmm/update',
            data,
        }).then(res => func(res.data)).catch(err => efunc(err));
    }

    static trainDemo(data, func, efunc) {
        axios({
            method : 'post',
            url    : BASE_URL + '/hmmgmm/trainDemo',
            data,
        }).then(res => func(res.data)).catch(err => efunc(err));
    }
};