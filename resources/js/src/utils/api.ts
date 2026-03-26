import axios from 'axios';
import nprogress from 'nprogress';

nprogress.configure({ showSpinner: false });

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(config => {
    // @ts-ignore
    if (config.showProgress !== false) {
        nprogress.start();
    }
    return config;
});

api.interceptors.response.use(
    response => {
        // @ts-ignore
        if (response.config.showProgress !== false) {
            nprogress.done();
        }
        return response;
    },
    error => {
        // @ts-ignore
        if (error.config?.showProgress !== false) {
            nprogress.done();
        }
        return Promise.reject(error);
    }
);

export default api;
