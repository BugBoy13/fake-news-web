/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        console.log(err);
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });

        if (res.data.status === 'success') {
            location.reload(true);
        }
    } catch (err) {
        showAlert('error', 'Try again!');
    }
};

export const detect = async (text) => {
    console.log(text);

    let is_fake = false;
    if (is_fake) {
        showAlert('error', 'This news is fake!!');
    } else {
        showAlert('success', text);
        window.setTimeout(() => {
            location.reload(true);
        }, 1500);
    }
};
