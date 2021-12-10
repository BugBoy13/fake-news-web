/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
    const stripe = Stripe(
        'pk_test_51JspTqSENP6ehdlzy1Vx7iYR3POsG159T1jLDr2KtikchfBHaOHwquWVxGU2peh1yOqPOOqGnRiM1Wl3Orn4bpjq00uwrqrY03'
    );

    try {
        // console.log(tourId);
        // 1. Get the checkout session from server
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        // console.log(session);
        // 2. Create checkout form + charge credit card

        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};
