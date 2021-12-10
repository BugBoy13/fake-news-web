/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout, detect } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    document.querySelector('.form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        // console.log(email);
        detect(email);
    });
}

if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const photo = document.getElementById('photo').files[0];

        const form = new FormData();
        form.append('name', name);
        form.append('email', email);
        form.append('photo', photo);

        updateSettings(form, 'data');
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        document.querySelector('.btn--save-password').textContent =
            'Updating...';

        const passwordCurrent =
            document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm =
            document.getElementById('password-confirm').value;
        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            'password'
        );

        document.querySelector('.btn--save-password').textContent =
            'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing...';

        // data defined on button as data-tour-id, automatically converts in camel case, and data comes in dataset object
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage);
