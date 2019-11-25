import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:3500',
    timeout: 50000
});
instance.defaults.headers.post['Content-Type'] = 'application/json';

export default instance;