const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const User = require('../Models/userModel');
const Tour = require('../Models/tourModel');
const Booking = require('../Models/bookingModel');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1. Get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${
        //     // This is not secure, anyone can call this url to make booking without paying, in real, we just have to use webhook
        //     req.params.tourId
        // }&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get(
            'host'
        )}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [
                    `${req.protocol}://${req.get('host')}/img/tours/${
                        tour.imageCover
                    }`,
                ],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1,
            },
        ],
    });

    // 3. Send it to client
    res.status(200).json({
        status: 'success',
        session,
    });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // this is only temporary solution, this is unsecure
//     const { tour, user, price } = req.query;

//     if (!tour || !user || !price) {
//         return next();
//     }

//     await Booking.create({
//         tour,
//         user,
//         price,
//     });

//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = catchAsync(async (session) => {
    const tourId = session.client_reference_id; // tourId set previously

    const tour = await Tour.findById(tourId);

    const user = (
        await User.findOne({
            email: session.customer_email,
        })
    ).id;

    await Booking.create({
        tour: tourId,
        user,
        price: tour.price,
    });
});

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.err(err);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        createBookingCheckout(event.data.object);
    }

    res.status(200).json({
        received: true,
    });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
